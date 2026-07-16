# AgentBrain — Tự đo benchmark (teacher) + đo Aira theo chuẩn HumanEval

Ngày 2026-07-13.

## Cách đo (theo chuẩn ngành, search ra rồi làm theo)
Search các benchmark thật: **HumanEval** (OpenAI), **SWE-bench Verified**.
Điểm mấu chốt của HumanEval: KHÔNG so chuỗi — nó CHẠY code sinh ra với unit test
ẩn, chấm **pass@1** = tỷ lệ task mà toàn bộ test pass. SWE-bench thì vá repo thật
+ chạy test (cần hạ tầng nặng, VPS 4GB không kham nổi phiên này).

→ Em dựng harness executable đúng kiểu HumanEval (`bench/run-humaneval.mjs`):
lấy lời giải → trích code Python → chạy với test ẩn trong subprocess → chấm
pass@1. Dùng chung cho cả em (teacher) lẫn Aira. Mỗi task Aira chạy 1 SESSION MỚI.

3 tầng độ khó (19 task): basic (8), hard (6: roman, spiral, LRU, word-break,
median), tricky (5: banker's rounding, truncate-toward-zero, so version, RPN,
group anagrams — nhiều bẫy đặc tả).

## Kết quả pass@1 (chạy code thật với test ẩn)
| Solver | basic | hard | tricky | TỔNG |
|---|---|---|---|---|
| **Em (Opus-4.8, teacher)** | 8/8 | 6/6 | 5/5 | **19/19 = 100%** |
| **Aira (Sonnet + AgentBrain)** | 8/8 | 6/6 | 5/5 | **19/19 = 100%** |

- Aira NGANG teacher trên executable pass@1, kể cả các bẫy đặc tả khó (làm tròn
  banker's, chia truncate-toward-zero ra -3 không phải -4, so '1.10' > '1.9').
- Sau khi train nhẹ, Aira giữ 5/5 tricky (không regression).

## Train tiếp — kiểu "gợi ý nhẹ", mỗi lần 1 session mới
`scripts/aira-train-light.mjs`: prompt MỞ, không cầm tay chỉ việc ("em tự nghĩ 1
bug khó rồi tự debug", "tự thiết kế 1 khối UI em thấy đẹp"...). Mỗi prompt 1
session mới → luyện cross-session memory + để AgentBrain tự đúc kết từ các turn
thành công (self-distill trên heartbeat). Theo đúng ý Sếp: không nói chi tiết quá
để Aira + brain tự tìm đường.

Kết quả: brain lớn lên thật — conversation turns 193 → 267, memories → 120,
facts (active) 62, KnowledgeStore giữ 83 item (dedup chống phình, không bơm rác).

## Kết luận
- Trên thang đo executable pass@1 (chuẩn HumanEval), Aira + AgentBrain đạt 100%,
  ngang teacher Opus-4.8 — năng lực sinh code + xử lý bẫy đặc tả đã rất chắc.
- Bộ task này chưa đủ khó để tách Aira khỏi teacher; muốn thấy khoảng cách cần
  tầng task khó hơn nữa (thuật toán nặng, đa file kiểu SWE-bench) — đề xuất bước sau.
- Train kiểu gợi ý nhẹ + session mới hoạt động: brain tự tích luỹ, không phình.

## Artefacts
- `bench/run-humaneval.mjs`, `bench/humaneval-{lite,hard,tricky}.json`
- `scripts/aira-train-light.mjs`
- Kết quả JSON: /tmp/humaneval-*.json
