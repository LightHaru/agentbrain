import { rm } from 'node:fs/promises';

/**
 * Remove a temp dir, tolerant of Windows file locks.
 *
 * The e2e tests load the real plugin, which opens a better-sqlite3 handle on
 * brain.db held in module scope. On Linux an open file can be unlinked
 * immediately; on Windows the handle must be released (GC) before the file can
 * be deleted, so a plain rm() throws EBUSY. Retry a few times with a short
 * backoff — the assertions have already run, this is teardown only.
 */
export async function cleanupDir(dir: string, attempts = 5): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      await rm(dir, { recursive: true, force: true });
      return;
    } catch (err: any) {
      const code = err?.code;
      if (code !== 'EBUSY' && code !== 'EPERM' && code !== 'ENOTEMPTY') throw err;
      if (i === attempts - 1) return; // best-effort: OS clears the temp dir later
      if (global.gc) global.gc();
      await new Promise(r => setTimeout(r, 100 * (i + 1)));
    }
  }
}
