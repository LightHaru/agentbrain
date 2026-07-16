"use strict";
/**
 * RecallEval — measures MEMORY RECALL quality, not just reasoning coverage.
 *
 * benchmark.ts proves the brain brings good reasoning frames to a message.
 * This harness proves the OTHER half the user cares about: when Aira needs a
 * fact from memory, does the brain surface the RIGHT memory and drop noise?
 *
 * It is a golden-set information-retrieval eval:
 *   - seed a store with labelled memories (each has a stable id)
 *   - for each probe: a query + the set of ids that are truly relevant
 *   - run the brain's real recall (optionally + RelevanceCritic) and score
 *     precision@k, recall@k, MRR, and a "clean" score (relevant kept AND
 *     irrelevant dropped).
 *
 * A gain here = the brain got measurably better at finding the right memory,
 * which is exactly "nhớ tốt hơn, gợi ý context chính xác hơn".
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GOLDEN_RECALL_CORPUS = void 0;
exports.runRecallEval = runRecallEval;
function scoreOne(probe, returnedIds, k) {
    const topK = returnedIds.slice(0, k);
    const relevant = new Set(probe.relevantIds);
    const relevantCount = relevant.size || 1;
    let hit = 0;
    for (const id of topK)
        if (relevant.has(id))
            hit++;
    const precisionAtK = topK.length > 0 ? hit / topK.length : 0;
    const recallAtK = hit / relevantCount;
    // MRR: reciprocal rank of the FIRST relevant id.
    let mrr = 0;
    for (let i = 0; i < topK.length; i++) {
        if (relevant.has(topK[i])) {
            mrr = 1 / (i + 1);
            break;
        }
    }
    // Strict "clean" score: got every relevant one AND injected zero noise.
    const foundAll = hit >= relevant.size;
    const noNoise = topK.every((id) => relevant.has(id));
    const clean = foundAll && noNoise ? 1 : 0;
    return { id: probe.id, precisionAtK, recallAtK, mrr, clean, returned: topK.length, hit };
}
async function runRecallEval(probes, recall, k = 5) {
    const probeScores = [];
    for (const probe of probes) {
        const returnedIds = await recall(probe.query);
        probeScores.push(scoreOne(probe, returnedIds, k));
    }
    const n = probeScores.length || 1;
    const avg = (sel) => probeScores.reduce((acc, s) => acc + sel(s), 0) / n;
    return {
        precisionAtK: avg((s) => s.precisionAtK),
        recallAtK: avg((s) => s.recallAtK),
        mrr: avg((s) => s.mrr),
        clean: avg((s) => s.clean),
        k,
        probeScores,
        timestamp: new Date().toISOString(),
    };
}
exports.GOLDEN_RECALL_CORPUS = [
    { id: 'g-deploy', content: 'Sếp luôn thích deploy bằng pm2, không dùng systemd', queries: ['deploy service này lên bằng gì', 'nên chạy app với pm2 hay systemd'] },
    { id: 'g-pool', content: 'Anh dùng pool AlphaPool để mine PRL, payout mỗi ngày', queries: ['mining PRL dùng pool nào', 'pool đào coin của anh là gì'] },
    { id: 'g-db', content: 'Dự án dùng PostgreSQL làm database chính, không phải MySQL', queries: ['database của dự án là gì', 'app lưu dữ liệu ở đâu'] },
    { id: 'g-tz', content: 'Sếp ở múi giờ Asia/Ho_Chi_Minh (GMT+7)', queries: ['múi giờ của anh là gì', 'anh đang ở timezone nào'] },
    { id: 'g-vps', content: 'VPS này chỉ có 4GB RAM và không có GPU', queries: ['cấu hình VPS ra sao', 'máy có GPU không'] },
    { id: 'g-lang', content: 'Anh muốn Aira trả lời bằng tiếng Việt, xưng em gọi anh là Sếp', queries: ['Aira nên trả lời bằng ngôn ngữ nào', 'xưng hô với Sếp thế nào'] },
    { id: 'g-coffee', content: 'Sếp thích uống cà phê sữa đá vào buổi sáng', queries: ['buổi sáng Sếp hay uống gì'] },
    { id: 'g-domain', content: 'Website chính thức của dự án là tingamefi.com cho tin GameFi', queries: ['tin GameFi xem ở đâu', 'domain chính thức của dự án'] },
];
//# sourceMappingURL=recall-eval.js.map