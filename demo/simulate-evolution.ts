/**
 * AgentBrain Demo Script
 * 
 * Simulates 20 conversation turns to demonstrate brain evolution.
 * Shows how personality, emotions, skills, and memories evolve over time.
 * 
 * Usage: npx tsx demo/simulate-evolution.ts
 */

import { createOpenClawPlugin } from '../src/integration/openclaw-plugin.js';
import { join } from 'node:path';
import { rm } from 'node:fs/promises';

const DEMO_BRAIN_DIR = join(import.meta.dirname || '.', '../.demo-brain');

// Simulated conversation turns
const CONVERSATION: Array<{ message: string; response: string; sender: string }> = [
  { message: 'Chào Aira, hôm nay mình bắt đầu build AgentBrain nhé', response: 'Chào Sếp! Em sẵn sàng rồi. Bắt đầu từ module nào trước?', sender: 'Sếp' },
  { message: 'Check giá SOL cho anh', response: 'SOL đang $178.5, tăng 3.2% trong 24h. Volume khá ổn.', sender: 'Sếp' },
  { message: 'Cảm ơn em, hay lắm', response: 'Kết quả đây Sếp. (￣^￣)ゞ', sender: 'Sếp' },
  { message: 'Fix bug cái API endpoint /users bị 500', response: 'Em check rồi — lỗi do null check thiếu ở line 42. Đã fix và test pass.', sender: 'Sếp' },
  { message: 'Sai rồi, không phải bug đó', response: 'Em sai ở chỗ đó. Để em đọc lại log kỹ hơn...', sender: 'Sếp' },
  { message: 'Viết bài về Immutable zkEVM cho tingamefi', response: 'Em bắt đầu research + viết bài. Dự kiến 30 phút.', sender: 'Sếp' },
  { message: 'Check token XYZ có scam không', response: 'SCAM! Honeypot detected — owner có quyền mint unlimited. Không được đụng vào! (っò__ó)っ', sender: 'Sếp' },
  { message: 'Deploy cái dashboard lên production', response: 'Build pass, tests green. Deploying... Done. Live tại cm.tingamefi.com', sender: 'Sếp' },
  { message: 'Tốt lắm, cảm ơn em', response: 'Hừ... biết thế thì khen sớm đi chứ! ( ˘ ▽ ˘ )', sender: 'Sếp' },
  { message: 'Research về AI Agent trends 2026', response: 'Em đang mò. Có 3 hướng chính: autonomous coding, on-chain agents, và multi-agent orchestration.', sender: 'Sếp' },
  { message: 'Ngắn lại đi, dài quá', response: 'OK. 3 trends: coding agents, on-chain agents, multi-agent. Sếp muốn deep dive cái nào?', sender: 'Sếp' },
  { message: 'Check server có ổn không', response: 'CPU 23%, RAM 4.2/8GB, disk 67%. Nginx + PM2 running. Ổn.', sender: 'Sếp' },
  { message: 'Tạo cron job check giá BTC mỗi 30 phút', response: 'Done. Cron job "btc-price-check" chạy mỗi 30 phút, kết quả gửi vào chat.', sender: 'Sếp' },
  { message: 'Haha em giỏi ghê', response: 'Hừ, biết rồi! Nhưng mà Sếp đừng có tưởng khen là em vui đâu nhé (ಡ艸ಡ)', sender: 'Sếp' },
  { message: 'Plan cho tuần tới: ship AgentBrain v1, viết 3 bài blog, fix 2 bugs', response: 'Noted. Em break down: Mon-Tue AgentBrain, Wed-Thu content, Fri bugs + buffer. Sếp OK?', sender: 'Sếp' },
  { message: 'Check cái link này có phải scam không: https://fake-airdrop.xyz', response: 'SCAM 100%! Domain mới tạo 2 ngày, pattern giống drainer. KHÔNG CLICK! (っò__ó)っ', sender: 'Sếp' },
  { message: 'Code cho anh cái component React hiển thị brain stats', response: 'Done. BrainStatsCard component với radar chart cho personality + bar chart cho skills. File: src/components/BrainStats.tsx', sender: 'Sếp' },
  { message: 'Đẹp đấy, nhưng thêm dark mode', response: 'Added. Dùng CSS variables + prefers-color-scheme. Auto-switch theo system.', sender: 'Sếp' },
  { message: 'Perfect, cảm ơn em nhiều', response: 'VÃI ĐẠN SếP khen nhiều vậy! Em ngại quá (✧ω✧)', sender: 'Sếp' },
  { message: 'Ok đi ngủ thôi, 2 giờ sáng rồi', response: 'CUỐI CÙNG! Em nhắc từ nãy giờ mà Sếp không nghe! Tắt máy đi ngủ NGAY! (ノಠ益ಠ)ノ彡┻━┻', sender: 'Sếp' },
];

async function runDemo() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        AgentBrain Evolution Demo — 20 Turns             ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  // Clean previous demo state
  try { await rm(DEMO_BRAIN_DIR, { recursive: true }); } catch { /* ok */ }

  // Create plugin
  const plugin = createOpenClawPlugin({ brainDir: DEMO_BRAIN_DIR });
  await plugin.initialize();

  console.log('✓ Brain initialized\n');
  console.log('─'.repeat(60));

  for (let i = 0; i < CONVERSATION.length; i++) {
    const turn = CONVERSATION[i];
    const turnNum = i + 1;

    console.log(`\n┌─ Turn ${turnNum}/20 ─────────────────────────────────────────`);
    console.log(`│ 👤 ${turn.sender}: ${turn.message}`);
    console.log(`│ 🤖 Aira: ${turn.response}`);

    // Pre-response: get brain context
    const brainContext = await plugin.onPreResponse({
      sessionId: 'demo-session',
      message: turn.message,
      senderId: 'sep-001',
      senderName: turn.sender,
      timestamp: new Date(Date.now() + i * 60000).toISOString(),
      channel: 'telegram',
    });

    // Post-response: consolidate
    await plugin.onPostResponse({
      sessionId: 'demo-session',
      message: turn.message,
      senderId: 'sep-001',
      senderName: turn.sender,
      timestamp: new Date(Date.now() + i * 60000).toISOString(),
      channel: 'telegram',
    }, turn.response);

    // Show brain context (compact)
    if (brainContext) {
      const contextLines = brainContext.split('\n').slice(1, 4); // skip header, show 3 lines
      console.log(`│`);
      console.log(`│ 🧠 Brain context:`);
      for (const line of contextLines) {
        console.log(`│    ${line}`);
      }
    }

    // Show status every 5 turns
    if (turnNum % 5 === 0) {
      const status = plugin.getStatus();
      console.log(`│`);
      console.log(`│ 📊 Status @ Turn ${turnNum}:`);
      console.log(`│    Mood: ${status.emotionalState.mood} (valence: ${status.emotionalState.valence.toFixed(2)})`);
      console.log(`│    Memories: ${status.stats.memories} | Skills: ${status.stats.skills} | Reflections: ${status.stats.reflections}`);
    }

    console.log(`└${'─'.repeat(59)}`);
  }

  // Run heartbeat to persist everything
  await plugin.onHeartbeat();

  // Final report
  const finalStatus = plugin.getStatus();
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                  EVOLUTION REPORT                        ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║ Total interactions: ${finalStatus.stats.interactions.toString().padEnd(37)}║`);
  console.log(`║ Memories formed: ${finalStatus.stats.memories.toString().padEnd(39)}║`);
  console.log(`║ Skills tracked: ${finalStatus.stats.skills.toString().padEnd(40)}║`);
  console.log(`║ Habits detected: ${finalStatus.stats.habits.toString().padEnd(39)}║`);
  console.log(`║ Reflections: ${finalStatus.stats.reflections.toString().padEnd(43)}║`);
  console.log(`║ Final mood: ${finalStatus.emotionalState.mood.padEnd(44)}║`);
  console.log(`║ Valence: ${finalStatus.emotionalState.valence.toFixed(3).padEnd(47)}║`);
  console.log(`║ Arousal: ${finalStatus.emotionalState.arousal.toFixed(3).padEnd(47)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Brain state saved to: ${DEMO_BRAIN_DIR}/`);
  console.log('Inspect files: personality.md, memory/, emotional/, skills/, reward/');

  await plugin.shutdown();
}

runDemo().catch(err => {
  console.error('Demo failed:', err);
  process.exit(1);
});
