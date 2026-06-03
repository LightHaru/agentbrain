#!/usr/bin/env node
/**
 * Import a standalone memory-graph SQLite database into AgentBrain brain.db.
 *
 * Usage:
 *   node scripts/migrate-memory-graph.mjs /path/memory-graph.db /path/brain.db
 *   node scripts/migrate-memory-graph.mjs /path/memory-graph.db /path/brain.db --dry-run
 */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [sourcePath, targetPath, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');

if (!sourcePath || !targetPath) {
  console.error('Usage: node scripts/migrate-memory-graph.mjs <memory-graph.db> <brain.db> [--dry-run]');
  process.exit(2);
}

if (!existsSync(sourcePath)) {
  console.error(`Source DB not found: ${sourcePath}`);
  process.exit(2);
}

if (!existsSync(dirname(targetPath))) {
  mkdirSync(dirname(targetPath), { recursive: true });
}

const source = new Database(sourcePath, { readonly: true });
const target = new Database(targetPath);

target.pragma('journal_mode = WAL');
target.pragma('foreign_keys = ON');

function ensureTargetSchema() {
  target.exec(`
    CREATE TABLE IF NOT EXISTS graph_entities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'concept',
      properties TEXT NOT NULL DEFAULT '{}',
      first_seen TEXT NOT NULL,
      last_seen TEXT NOT NULL,
      mention_count INTEGER NOT NULL DEFAULT 1,
      confidence REAL NOT NULL DEFAULT 1.0,
      embedding BLOB,
      vector_size INTEGER NOT NULL DEFAULT 1024,
      UNIQUE(name, type)
    );
    CREATE INDEX IF NOT EXISTS idx_graph_entities_name ON graph_entities(name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_graph_entities_type ON graph_entities(type);

    CREATE TABLE IF NOT EXISTS graph_relationships (
      id TEXT PRIMARY KEY,
      from_entity_id TEXT NOT NULL,
      to_entity_id TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      properties TEXT NOT NULL DEFAULT '{}',
      confidence REAL NOT NULL DEFAULT 0.7,
      first_seen TEXT NOT NULL,
      last_seen TEXT NOT NULL,
      valid_until TEXT DEFAULT NULL,
      source_memory_id TEXT DEFAULT NULL,
      FOREIGN KEY(from_entity_id) REFERENCES graph_entities(id) ON DELETE CASCADE,
      FOREIGN KEY(to_entity_id) REFERENCES graph_entities(id) ON DELETE CASCADE,
      UNIQUE(from_entity_id, to_entity_id, relation_type)
    );
    CREATE INDEX IF NOT EXISTS idx_graph_relationships_from ON graph_relationships(from_entity_id);
    CREATE INDEX IF NOT EXISTS idx_graph_relationships_to ON graph_relationships(to_entity_id);
    CREATE INDEX IF NOT EXISTS idx_graph_relationships_type ON graph_relationships(relation_type);

    CREATE TABLE IF NOT EXISTS graph_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      entities TEXT NOT NULL DEFAULT '[]'
    );
    CREATE INDEX IF NOT EXISTS idx_graph_conversations_timestamp ON graph_conversations(timestamp DESC);

    CREATE TABLE IF NOT EXISTS embeddings (
      id TEXT PRIMARY KEY,
      owner_type TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      model TEXT NOT NULL,
      vector_size INTEGER NOT NULL DEFAULT 1024,
      embedding BLOB NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(owner_type, owner_id, model)
    );
    CREATE INDEX IF NOT EXISTS idx_embeddings_owner ON embeddings(owner_type, owner_id);
  `);
}

function tableExists(db, table) {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
  return Boolean(row);
}

function vectorToBuffer(vectorText) {
  if (!vectorText) return null;
  try {
    const vector = JSON.parse(vectorText);
    if (!Array.isArray(vector)) return null;
    const buffer = Buffer.allocUnsafe(vector.length * 4);
    vector.forEach((value, index) => buffer.writeFloatLE(Number(value) || 0, index * 4));
    return { buffer, size: vector.length };
  } catch {
    return null;
  }
}

function count(table) {
  if (!tableExists(source, table)) return 0;
  return source.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
}

const plan = {
  entities: count('entities'),
  relationships: count('relationships'),
  memoryLog: count('memory_log'),
  embeddings: count('embeddings'),
};

if (dryRun) {
  console.log(JSON.stringify({ dryRun: true, source: sourcePath, target: targetPath, plan }, null, 2));
  source.close();
  target.close();
  process.exit(0);
}

ensureTargetSchema();

const migrate = target.transaction(() => {
  const entityIdBySource = new Map();
  let entities = 0;
  let relationships = 0;
  let conversations = 0;
  let embeddings = 0;

  if (tableExists(source, 'entities')) {
    const rows = source.prepare('SELECT * FROM entities').all();
    const insertEntity = target.prepare(`
      INSERT INTO graph_entities (
        id, name, type, properties, first_seen, last_seen, mention_count, confidence, vector_size
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1024)
      ON CONFLICT(name, type) DO UPDATE SET
        properties = excluded.properties,
        last_seen = excluded.last_seen,
        mention_count = MAX(graph_entities.mention_count, excluded.mention_count),
        confidence = MAX(graph_entities.confidence, excluded.confidence)
    `);
    const lookupEntity = target.prepare('SELECT id FROM graph_entities WHERE name = ? AND type = ?');

    for (const row of rows) {
      const type = row.type || 'concept';
      const id = row.id || `mg-${entities}`;
      insertEntity.run(
        id,
        row.name,
        type,
        row.properties || '{}',
        row.created_at || row.first_seen || new Date().toISOString(),
        row.updated_at || row.last_seen || row.created_at || new Date().toISOString(),
        row.mention_count || 1,
        row.confidence ?? 0.7
      );
      const targetRow = lookupEntity.get(row.name, type);
      entityIdBySource.set(row.id, targetRow.id);
      entities++;
    }
  }

  if (tableExists(source, 'relationships')) {
    const rows = source.prepare('SELECT * FROM relationships').all();
    const insertRel = target.prepare(`
      INSERT INTO graph_relationships (
        id, from_entity_id, to_entity_id, relation_type, properties, confidence,
        first_seen, last_seen, valid_until, source_memory_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(from_entity_id, to_entity_id, relation_type) DO UPDATE SET
        properties = excluded.properties,
        confidence = MAX(graph_relationships.confidence, excluded.confidence),
        last_seen = excluded.last_seen,
        valid_until = excluded.valid_until
    `);

    for (const row of rows) {
      const fromId = entityIdBySource.get(row.from_id);
      const toId = entityIdBySource.get(row.to_id);
      if (!fromId || !toId) continue;
      insertRel.run(
        row.id || `mg-rel-${relationships}`,
        fromId,
        toId,
        row.relation || row.type || 'related_to',
        row.properties || '{}',
        row.confidence ?? 0.7,
        row.created_at || row.valid_from || new Date().toISOString(),
        row.updated_at || row.created_at || new Date().toISOString(),
        row.valid_until || null,
        row.source || null
      );
      relationships++;
    }
  }

  if (tableExists(source, 'memory_log')) {
    const rows = source.prepare('SELECT * FROM memory_log').all();
    const insertConversation = target.prepare(`
      INSERT INTO graph_conversations (role, content, timestamp, entities)
      VALUES ('user', ?, ?, ?)
    `);
    for (const row of rows) {
      insertConversation.run(row.raw_text, row.timestamp || new Date().toISOString(), row.extracted_entities || '[]');
      conversations++;
    }
  }

  if (tableExists(source, 'embeddings')) {
    const rows = source.prepare('SELECT * FROM embeddings').all();
    const insertEmbedding = target.prepare(`
      INSERT INTO embeddings (id, owner_type, owner_id, model, vector_size, embedding, created_at, updated_at)
      VALUES (?, 'graph_entity', ?, ?, ?, ?, ?, ?)
      ON CONFLICT(owner_type, owner_id, model) DO UPDATE SET
        vector_size = excluded.vector_size,
        embedding = excluded.embedding,
        updated_at = excluded.updated_at
    `);
    const updateEntityEmbedding = target.prepare(`
      UPDATE graph_entities SET embedding = ?, vector_size = ? WHERE id = ?
    `);

    for (const row of rows) {
      const ownerId = entityIdBySource.get(row.entity_id);
      const vector = vectorToBuffer(row.vector);
      if (!ownerId || !vector) continue;
      const created = row.created_at || new Date().toISOString();
      insertEmbedding.run(row.id || `mg-emb-${embeddings}`, ownerId, row.model || 'unknown', vector.size, vector.buffer, created, created);
      updateEntityEmbedding.run(vector.buffer, vector.size, ownerId);
      embeddings++;
    }
  }

  return { entities, relationships, conversations, embeddings };
});

const migrated = migrate();
const totals = {
  entities: target.prepare('SELECT COUNT(*) AS count FROM graph_entities').get().count,
  relationships: target.prepare('SELECT COUNT(*) AS count FROM graph_relationships').get().count,
  conversations: target.prepare('SELECT COUNT(*) AS count FROM graph_conversations').get().count,
  embeddings: target.prepare('SELECT COUNT(*) AS count FROM embeddings WHERE owner_type = ?').get('graph_entity').count,
};

console.log(JSON.stringify({ dryRun: false, source: sourcePath, target: targetPath, plan, migrated, totals }, null, 2));

source.close();
target.close();
