"use strict";
/**
 * EmbeddingService — one consistent way to turn text into a stored vector.
 *
 * "Store like people do" (production RAG/vector-DB practice) means:
 *   - ONE embedding model of record, identified by name + dimension
 *   - every stored vector tagged with that model id + dim
 *   - vectors L2-normalized (unit length) so dot product == cosine
 *   - NEVER compare vectors from different models/dims (meaningless distance);
 *     re-embed on mismatch instead
 *
 * This wraps the local MiniLM EmbeddingEngine and adds the metadata + guarantees
 * the raw engine doesn't. All durable stores (knowledge, conversation) embed
 * through this so the whole brain shares one vector space.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingService = exports.EMBED_DIM = exports.EMBED_MODEL_ID = void 0;
exports.l2normalize = l2normalize;
exports.cosineSim = cosineSim;
exports.getEmbeddingService = getEmbeddingService;
const embedding_engine_js_1 = require("./embedding-engine.js");
exports.EMBED_MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
exports.EMBED_DIM = 384;
/** L2-normalize in place; returns the same array (unit length, or unchanged if zero). */
function l2normalize(v) {
    let norm = 0;
    for (let i = 0; i < v.length; i++)
        norm += v[i] * v[i];
    norm = Math.sqrt(norm);
    if (norm > 0)
        for (let i = 0; i < v.length; i++)
            v[i] /= norm;
    return v;
}
/** Cosine similarity for equal-length vectors (== dot product if both unit-norm). */
function cosineSim(a, b) {
    if (a.length !== b.length)
        return NaN; // different spaces are not comparable
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    if (na === 0 || nb === 0)
        return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
class EmbeddingService {
    engine;
    model = exports.EMBED_MODEL_ID;
    dim = exports.EMBED_DIM;
    constructor(engine = (0, embedding_engine_js_1.getEmbeddingEngine)()) {
        this.engine = engine;
    }
    isReady() {
        return this.engine.isLoaded();
    }
    async warmup() {
        const v = await this.engine.embed('warmup');
        return !!v && !this.engine.hasFailed();
    }
    /** Embed text into a tagged, unit-normalized vector (or null if model down). */
    async embed(text) {
        const raw = await this.engine.embed(text);
        if (!raw)
            return null;
        return { vector: l2normalize(new Float32Array(raw)), model: this.model, dim: raw.length };
    }
    /**
     * Compare a live query embedding against a STORED vector, honoring model/dim.
     * Returns null when the stored vector is from a different space (caller should
     * re-embed rather than trust a bogus score).
     */
    compatible(storedModel, storedDim) {
        return storedModel === this.model && storedDim === this.dim;
    }
}
exports.EmbeddingService = EmbeddingService;
let shared = null;
function getEmbeddingService() {
    if (!shared)
        shared = new EmbeddingService();
    return shared;
}
//# sourceMappingURL=embedding-service.js.map