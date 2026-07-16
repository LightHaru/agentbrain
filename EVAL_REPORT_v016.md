# AgentBrain v0.16 — Đánh giá thực chiến với Aira (cross-session)

Ngày: 2026-07-13. Chạy qua `openclaw agent` thật (Gateway path → AgentBrain
llm_output/agent_end fire). Model: krouter/claude-sonnet-4.5 (xpiki/opus fallback).
AgentBrain nạp từ `/root/agentbrain` (bản v0.16.0).

## Cách đánh giá
Dạy Aira vài dữ kiện ở MỘT session, rồi mở session HOÀN TOÀN MỚI hỏi lại. Session
mới không có history native, nên nếu Aira nhớ được thì đó CHỈ có thể đến từ
AgentBrain — đo trực tiếp việc "bộ não có giúp Aira không".

## Kết quả then chốt (before → after fix)

### Phát hiện bug quan trọng (nhờ đánh giá)
- Lần đầu: dạy "TinGameFi chạy trên Solana" ở session daily. Sang session MỚI hỏi
  lại → Aira nhớ tên **TinGameFi** ✅ nhưng trả lời sai chain: **"BNB Chain"** ❌.
- Điều tra: fact ĐÚNG ("TinGameFi runs_on Solana") CÓ được inject, nhưng bị chôn
  giữa hàng loạt fact rác (subject là cả câu lảm nhảm) + fact-change notes rác.
  Aira mất tin vào memory → đoán bừa.

### Sửa (làm Aira sắc sảo hơn thật sự)
1. `cleanSubject`: bỏ liên từ/filler đầu câu ("và dự án chính của anh tên" → "dự án chính của anh").
2. `isCleanFact` (dùng ở facts + graph + tracker): loại fact có subject/object là
   câu dài, đa dòng, dạng câu hỏi → không inject rác.
3. `FactChangeTracker`: chỉ báo đổi giá trị cho quan hệ "gọn" (is/uses/runs_on/costs/balance),
   giá trị ≤6 từ → hết note rác kiểu "User prefers <cả câu>".
4. `scripts/clean-facts.mjs`: dọn 21/78 fact rác đã tồn trong brain thật.

### Sau khi sửa — session MỚI, hỏi lại:
- "dự án tên gì, chạy chain nào, deploy bằng gì?"
  → **"TinGameFi — chạy Solana — deploy bằng pm2"** ✅ (đúng cả 3, hết hallucinate)

## Bằng chứng AgentBrain giúp Aira, qua các loại session
| Loại session | Kịch bản | Kết quả |
|---|---|---|
| Daily → Fresh | Dạy dự án/chain/deploy, hỏi lại ở session mới | ✅ nhớ đúng TinGameFi + Solana + pm2 (cross-session) |
| Code (fresh) | "chạy app Node nền, tự restart" | ✅ dùng `pm2` (đúng sở thích đã dạy ở session khác), không systemd |
| Research (fresh) | "giá Bitcoin bao nhiêu?" | ✅ search-first: tra live + dẫn nguồn CoinMarketCap + timestamp, không đoán từ memory |
| Time awareness | mọi turn | ✅ luôn biết "04:30 khuya", nhắc Sếp đi ngủ |

## Kết luận
- AgentBrain THỰC SỰ giúp Aira: nhớ xuyên session (điều session-native không làm
  được), áp dụng sở thích đã học sang task code, và ép kỷ luật search-first cho
  câu hỏi dữ liệu sống.
- Đánh giá còn bắt được 1 lỗi thật (nhiễu injection gây hallucinate) và đã sửa;
  sau sửa Aira trả lời chính xác. Đây là minh chứng vòng lặp "đánh giá → sửa →
  giỏi hơn" hoạt động.

## Còn cải thiện được (đề xuất tiếp)
- Vài fact cũ vẫn còn subject chưa thật gọn (do lưu trước khi sửa `cleanSubject`);
  các fact mới đã sạch. Có thể chạy `clean-facts.mjs` định kỳ.
- Extractor vẫn theo regex; nếu sau này có model local nhẹ, tách chủ-vị sẽ sạch hơn.
