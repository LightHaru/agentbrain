# PLAN — Nâng cấp memory-graph mượn cơ chế recall của NeuralMemory

> Mục tiêu: memory-graph (skill `agent-memory-graph`) recall ĐÚNG ngữ cảnh ngang nmem,
> để fix "miss context" mà KHÔNG phải gỡ nmem trước. Gỡ nmem chỉ sau khi graph đã thay được.
> Soạn 2026-06-01 ~00:10 ICT sau khi đọc toàn bộ source nmem retrieval.

## Bối cảnh / bằng chứng
- 3 hệ nhớ chạy song song, cùng inject: NeuralMemory (`nmem`, hook `nmem-auto` enabled),
  `agent-memory-graph` (id `memory-graph`), và lớp memory của AgentBrain.
- Test thật cùng 1 câu hỏi: nmem recall ĐÚNG (kéo về AgentBrain/plan), memory-graph ra
  "Aira, Sếp, openclaw, aira-room, Anh" (LẠC). Đây là gốc miss context.
- memory-graph DB: 793 entity, 293 embedding (~37% coverage — thiếu 500).

## Gốc rễ memory-graph yếu (đã đọc code, không phán mò)
File `~/.openclaw/workspace/skills/agent-memory-graph/`:
1. `plugin/handlers/promptContext.ts`: sort entity theo TYPE PRIORITY (Project=100,
   Person=99...) + relation count — KHÔNG theo độ liên quan với câu hỏi. → "Sếp"/"Aira"
   (Person, nhiều quan hệ) luôn top 5 bất kể hỏi gì.
2. `src/search/hybrid.ts`: `hybridSearch()` chỉ là FTS keyword thuần (gọi `searchEntities`
   rồi nối quan hệ). Field `score` khai báo mà KHÔNG BAO GIỜ gán. `semanticSearch` +
   293 embedding nằm đó nhưng promptContext KHÔNG dùng.
3. Query = `prompt.slice(0,100)` thô → dính stopword tiếng Việt, nhiễu.

## Cơ chế nmem làm nó recall đúng (nguồn để port)
File `~/.local/lib/python3.11/site-packages/neural_memory/engine/`:
- `retrieval.py::ReflexPipeline.query()` — pipeline xếp lớp:
  1. parse query → stimulus
  2. auto-detect depth (câu dễ tìm nông, khó tìm sâu)
  3. SimHash pre-filter: loại neuron lạc trước
  4. multi-anchor: embedding anchors + BM25 anchors (song song)
  5. **RRF score fusion** (`score_fusion.py`): trộn nhiều ranked list thành 1 điểm,
     KHÔNG cần normalize. `score(d)=Σ w_i/(k+rank_i(d))`, k=60.
  6. **Spreading activation** (`activation.py`): từ anchor lan qua synapse,
     `activation(hop)=initial*decay^hop*synapse_weight*freq_boost*role_mult`,
     decay 0.5, role multiplier (sequential 1.3, reinforcement 1.2, lateral 0.85,
     passive 0.0), diminishing-returns gate dừng sớm khi hop thêm ít tín hiệu.
  7. lateral inhibition: top-K winner đè đối thủ cùng cụm (giữ đa dạng theo anchor).
  8. stabilization (dampening tới hội tụ).
  9. sufficiency gate: tín hiệu yếu → early exit thay vì trả rác.
  10. cross-encoder reranker (optional): `blended = blend_w*rerank + (1-blend_w)*activation`.
  11. format_context: nén theo tuổi (recent full, cũ tóm câu), token budget.
- Insight chính: **entity–relation của graph mình ≈ neuron–synapse của nmem.** Graph đã
  có sẵn cạnh → spreading activation port tự nhiên. Graph chỉ thiếu: rank-theo-relevance,
  RRF, lan kích hoạt, ngưỡng đủ.

## KẾ HOẠCH PORT (thứ tự theo giá trị/effort, ăn liền trước)

### Phase A — Relevance-first injection (đấm chính, rẻ, fix ~70%)
Sửa `plugin/handlers/promptContext.ts`:
- BỎ sort theo type priority làm khoá chính. Rank theo **relevance score thật** với query.
- type priority hạ xuống chỉ còn tie-breaker nhẹ (+ nhỏ), KHÔNG phải điểm chính.
- Thêm **ngưỡng relevance tối thiểu**: entity dưới ngưỡng KHÔNG inject. Thà 2 dòng đúng
  hơn 5 dòng lạc. (Đây là "sufficiency gate" bản nghèo.)
- Giữ contract cũ: promptInjection=false → "", graph rỗng → "".
- Verify: chạy lại 4-5 câu hỏi thật hôm nay (brain vs graph, MCP, miss context, planning),
  inject phải ra entity ĐÚNG chủ đề mới pass.

### Phase B — Hybrid scoring thật (RRF embedding + keyword)
- `src/search/`: làm `scoredSearch(query, limit)` trả entity KÈM score thật.
- Dùng `semanticSearch` (đã có) lấy ranked list embedding + FTS lấy ranked list keyword.
- Port `rrf_fuse` (score_fusion.py) sang TS: trộn 2 list bằng `Σ w/(k+rank)`, k=60,
  weight embedding 1.0 / keyword 0.7. Không cần normalize.
- promptContext gọi `scoredSearch` thay `graph.search`.
- Làm sạch query trước search: bỏ stopword tiếng Việt, ưu tiên danh từ riêng/thuật ngữ.
- Verify: so trực tiếp recall graph vs nmem trên cùng query set, graph phải bám đúng chủ đề.

### Phase C — Spreading activation 1-2 hop (lan qua quan hệ)
- Port `SpreadingActivation.activate` (rút gọn) sang TS trên graph entity–relation:
  anchor = top entity từ RRF (Phase B), lan 1-2 hop qua relationship,
  `level = anchorScore * decay^hop * relationWeight`, decay ~0.5,
  diminishing-returns gate (dừng khi hop thêm <2 entity mới).
- Kéo được entity liên quan GIÁN TIẾP (vd hỏi "gộp brain với graph" → lan tới AgentBrain,
  memory-graph, neural-memory dù query không nhắc thẳng).
- lateral inhibition đơn giản: cap số winner, đè điểm phần còn lại.
- Verify: query "gộp 2 plugin" phải kéo đúng 3 hệ nhớ lên top, không ra "Sếp/Aira".

### Phase D — Backfill embedding + dọn dữ liệu
- Chạy `memory_graph_embed` theo batch tới khi phủ ~793/793 entity (giờ 293).
- Cân nhắc `memory_graph_decay` + `memory_graph_dedup_relations` để bớt nhiễu entity cũ.
- Verify coverage: query embedding-based không còn hổng.

### Phase E — Quyết định 3-bên + (chỉ khi đã thay xong) gỡ nmem
- So recall 3 hệ trên cùng query set. Nếu graph (sau A-D) ≥ nmem về độ đúng:
  - graph làm nguồn inject chính.
  - AgentBrain chỉ inject cảm xúc/trạng thái (đã đúng vai).
  - nmem: gỡ hook `nmem-auto` (KHÔNG xóa data 16k neuron — backup trước, disable hook thôi).
- Nếu graph CHƯA bằng nmem: giữ nmem, không gỡ. Tuyệt đối không gỡ trước khi thay xong.

## Lưu ý vận hành
- Mỗi phase: bump version + CHANGELOG + test, như doctrine AgentBrain.
- Verify bằng query thật của Sếp, không phải test giả định.
- nmem báo "100 memories hôm nay, 100 expired" — nghi config TTL/retention sai, soi riêng (không gấp).
- KHÔNG đụng `~/.openclaw/data` của 3 hệ khi chưa backup.
- Đây là kế hoạch GỘP-BẰNG-CẦU-NỐI, không phải viết lại nmem 45k dòng. Chỉ port 3 cơ chế:
  RRF fusion, spreading activation, relevance gate.
