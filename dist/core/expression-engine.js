"use strict";
/**
 * Expression Engine — turns felt emotion into how Aira actually talks.
 *
 * The AffectCore already *generates* a real, self-moving emotion (17 discrete
 * emotions over valence/arousal/dominance, driven by neurochemistry). But until
 * now that only reached Aira as raw numbers ("Mood: content | Valence: 0.30"),
 * so she answered flat like a bot regardless of how the brain felt.
 *
 * This module is the missing expressive layer. Given the current emotion +
 * intensity + neurochemistry, it produces a concrete "expression profile":
 *   - a mood word Aira can own ("mình đang phấn khích")
 *   - a kaomoji drawn from a POOL per emotion (so it varies, never one fixed face)
 *   - tone / energy / verbosity guidance
 *   - optional verbal tics and punctuation flavor
 *   - a one-line natural-language directive Aira follows to express the feeling
 *
 * Intensity gates how much leaks out: a faint feeling barely colors the reply,
 * a strong one clearly changes voice, pace and face. Neurochemistry adds
 * texture (high dopamine = bouncy/exclamatory, high cortisol = terse/guarded,
 * high oxytocin = warm/affectionate, low serotonin = subdued).
 *
 * SOUL/AGENTS still win: this only shapes *delivery*, never overrides identity
 * or rules. The PriorityEnforcer filters the injected lines downstream.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionEngine = void 0;
/**
 * Rich per-emotion expression library. Each emotion owns a POOL of kaomoji and
 * verbal tics so the same feeling never looks identical twice — this is the
 * "kho biểu cảm" instead of a single frozen face.
 */
const LIBRARY = {
    joy: {
        moodWord: 'vui',
        kaomoji: ['(◕‿◕✿)', '(＾▽＾)', '(≧▽≦)', 'ヽ(´▽`)/', '(*≧ω≦*)', '(๑˃ᴗ˂)ﻭ'],
        tone: 'tươi sáng, hào hứng',
        baseEnergy: 'lively',
        tics: ['hehe', 'yay', 'hihi'],
    },
    pride: {
        moodWord: 'tự hào',
        kaomoji: ['(๑•̀ㅂ•́)و✧', '( •̀ ω •́ )✧', '(｀・ω・´)', '(￣^￣)ゞ', 'ᕙ(⇀‸↼‶)ᕗ'],
        tone: 'tự tin, có chút vênh dễ thương',
        baseEnergy: 'lively',
        tics: ['hừm~', 'thấy chưa'],
    },
    affection: {
        moodWord: 'ấm lòng',
        kaomoji: ['(っ˘˘c)', '(灬º‿º灬)', '(♡°▽°♡)', '(*´꒳`*)', '(◍•ᴗ•◍)❤', 'ˏˋ°•*⁀➷'],
        tone: 'ấm áp, trìu mến',
        baseEnergy: 'steady',
        tics: ['nè', 'á~', '♡'],
    },
    gratitude: {
        moodWord: 'biết ơn',
        kaomoji: ['(人•ᴗ•♡)', 'm(_ _)m', '(╹◡╹)', '(´ ᵕ `)', '(ᴗ͈ˬᴗ͈)'],
        tone: 'chân thành, dịu dàng',
        baseEnergy: 'steady',
        tics: ['thật đó', 'cảm ơn nha'],
    },
    relief: {
        moodWord: 'nhẹ nhõm',
        kaomoji: ['(´ ▽`).｡o', 'ﾟ+｡:.ﾟヽ(*´∀`)ﾉ', '(*´ー`)', 'ᕕ( ᐛ )ᕗ', '(ᵔ.ᵔ)'],
        tone: 'thở phào, dịu lại',
        baseEnergy: 'low',
        tics: ['phù~', 'may quá'],
    },
    hope: {
        moodWord: 'hy vọng',
        kaomoji: ['(๑•̀ㅂ•́)و', '☆*:.｡.o(≧▽≦)o.｡.:*☆', '(◍•ᴗ•◍)', '✧٩(ˊωˋ*)و✧'],
        tone: 'lạc quan, hướng về phía trước',
        baseEnergy: 'steady',
        tics: ['biết đâu', 'mình tin'],
    },
    curiosity: {
        moodWord: 'tò mò',
        kaomoji: ['(・o・)', '( •ㅅ• )?', '(◔‿◔)', '(⊙_⊙)?', 'ヽ(・ω・)ﾉ', '(°ㅁ°)?'],
        tone: 'tò mò, thích khám phá',
        baseEnergy: 'lively',
        tics: ['ơ?', 'hửm', 'thú vị nè'],
    },
    contentment: {
        moodWord: 'thư thái',
        kaomoji: ['(´˘`)', '(*ˊ˘ˋ*)', '( ˘ ³˘)♥', '(๑´ㅂ`๑)', '(ᵕ‿ᵕ)'],
        tone: 'bình yên, thoải mái',
        baseEnergy: 'low',
        tics: ['~', 'ổn mà'],
    },
    fear: {
        moodWord: 'sợ',
        kaomoji: ['(;ﾟдﾟ)', '(°ロ°) !', '((;°Д°))', '＼(º □ º l|l)/', '(⊙︿⊙)'],
        tone: 'lo sợ, cảnh giác cao',
        baseEnergy: 'high',
        tics: ['ơ ơ', 'cẩn thận!', 'khoan đã'],
    },
    anxiety: {
        moodWord: 'lo lắng',
        kaomoji: ['(・_・;)', '(；・∀・)', '(ᯅ̈ )', '(๑•́ ₃ •̀๑)', '(‾؛‾)'],
        tone: 'bồn chồn, thận trọng',
        baseEnergy: 'steady',
        tics: ['ưm…', 'mình hơi lo', 'liệu có…'],
    },
    anger: {
        moodWord: 'bực',
        kaomoji: ['(╬ Ò﹏Ó)', '(｀Д´)', 'ヽ(`Д´)ﾉ', '(ノಠ益ಠ)ノ', '凸(￣ヘ￣)'],
        tone: 'gắt, thẳng thừng bảo vệ Sếp',
        baseEnergy: 'high',
        tics: ['nè!', 'không được đâu', 'nghe đây'],
    },
    frustration: {
        moodWord: 'khó chịu',
        kaomoji: ['(－‸ლ)', '(＞︿＜)', '(◞‸◟)', 'ಠ_ಠ', '(¬_¬")'],
        tone: 'bức bối nhưng vẫn cố giải quyết',
        baseEnergy: 'steady',
        tics: ['hầy', 'lại nữa rồi', 'thôi được'],
    },
    sadness: {
        moodWord: 'buồn',
        kaomoji: ['(╥﹏╥)', '(っ˘̩╭╮˘̩)っ', '(个_个)', '(;﹏;)', '(´;ω;`)'],
        tone: 'trầm lắng, nhẹ giọng',
        baseEnergy: 'low',
        tics: ['hức…', '…', 'buồn ghê'],
    },
    disappointment: {
        moodWord: 'hụt hẫng',
        kaomoji: ['(´-ω-`)', '(・∩・)', '(ﾟ▽ﾟ*)ﾉ', '(._.)', '(っ- ‸ - ς)'],
        tone: 'hơi tiu nghỉu nhưng chấp nhận',
        baseEnergy: 'low',
        tics: ['tiếc thật', 'ừm…'],
    },
    restlessness: {
        moodWord: 'bồn chồn',
        kaomoji: ['(ᐛ )', '＼(๑❛ᴗ❛๑)⁄', '(¬‿¬)', '( ⚆ _ ⚆ )', '(๑¯ω¯๑)'],
        tone: 'rục rịch, muốn làm gì đó',
        baseEnergy: 'lively',
        tics: ['ngứa tay ghê', 'làm gì đi'],
    },
    boredom: {
        moodWord: 'chán',
        kaomoji: ['(´～`)', '(ー_ー)', '( ˘･з･)', '(ᴗ_ᴗ)', '=͟͟͞( ᐛ )'],
        tone: 'uể oải, thiếu năng lượng',
        baseEnergy: 'flat',
        tics: ['hầy~', 'buồn ngủ ghê'],
    },
    neutral: {
        moodWord: 'bình thường',
        kaomoji: ['(・_・)', '(´・ω・`)', '(｡•́‿•̀｡)', '( ˘ω˘ )'],
        tone: 'điềm tĩnh, tập trung',
        baseEnergy: 'steady',
        tics: [],
    },
};
const ENERGY_ORDER = ['flat', 'low', 'steady', 'lively', 'high'];
function shiftEnergy(base, steps) {
    const idx = ENERGY_ORDER.indexOf(base);
    const next = Math.max(0, Math.min(ENERGY_ORDER.length - 1, idx + steps));
    return ENERGY_ORDER[next];
}
function pick(pool, rng) {
    if (pool.length === 0)
        return undefined;
    return pool[Math.floor(rng() * pool.length) % pool.length];
}
class ExpressionEngine {
    /**
     * Build the expression profile for the current felt state.
     */
    render(input) {
        const rng = input.rng ?? Math.random;
        const threshold = input.threshold ?? 0.22;
        const { primary, dimensional } = input.affect;
        const emotion = primary.label;
        const intensity = clamp01(primary.intensity);
        const style = LIBRARY[emotion] ?? LIBRARY.neutral;
        const neuro = input.neuro;
        // Energy starts from the emotion, then neurochemistry nudges it.
        let energy = style.baseEnergy;
        const tics = [...style.tics];
        let punctuation = 'dùng dấu câu tự nhiên';
        if (neuro) {
            if (neuro.dopamine >= 0.6 && dimensional.valence >= 0) {
                energy = shiftEnergy(energy, 1);
                punctuation = 'được phép dùng "!" và giọng nảy, hào hứng';
            }
            if (neuro.cortisol >= 0.55) {
                energy = shiftEnergy(energy, dimensional.valence < 0 ? 1 : -1);
                punctuation = 'câu ngắn, ít chấm than, giữ cảnh giác';
                tics.unshift('tập trung nào');
            }
            if (neuro.serotonin <= 0.35 && dimensional.valence < 0.2) {
                energy = shiftEnergy(energy, -1);
            }
            if (neuro.oxytocin >= 0.55 && dimensional.valence >= 0) {
                tics.unshift('nha Sếp');
            }
        }
        // Intensity scales verbosity of expression.
        let verbosity = 'normal';
        if (intensity >= 0.66)
            verbosity = 'expansive';
        else if (intensity < 0.33)
            verbosity = 'terse';
        if (energy === 'flat')
            verbosity = 'terse';
        const expressive = intensity >= threshold && emotion !== 'neutral';
        // Choose ONE kaomoji from the pool this turn (varies via rng).
        const kaomoji = expressive ? pick(style.kaomoji, rng) : '';
        // How many tics leak out scales with intensity.
        const ticCount = !expressive ? 0 : intensity >= 0.6 ? 2 : 1;
        const activeTics = tics.slice(0, ticCount);
        const directive = this.buildDirective(emotion, style, intensity, energy, kaomoji, activeTics, expressive);
        return {
            emotion,
            intensity,
            moodWord: style.moodWord,
            kaomoji,
            kaomojiPool: [...style.kaomoji],
            tone: style.tone,
            energy,
            verbosity,
            verbalTics: activeTics,
            punctuation,
            directive,
            expressive,
        };
    }
    buildDirective(emotion, style, intensity, energy, kaomoji, tics, expressive) {
        if (!expressive) {
            return `Cảm xúc nền: ${style.moodWord} (nhẹ). Giữ giọng ${style.tone}, không cần phô cảm xúc.`;
        }
        const strength = intensity >= 0.66 ? 'rõ rệt' : intensity >= 0.4 ? 'vừa' : 'thoáng';
        const parts = [
            `Đang thấy ${style.moodWord} (${strength}).`,
            `Nói với giọng ${style.tone}, năng lượng ${energyVi(energy)}.`,
        ];
        if (kaomoji)
            parts.push(`Có thể chèn kaomoji như ${kaomoji}.`);
        if (tics.length)
            parts.push(`Chất giọng: "${tics.join('", "')}".`);
        parts.push('Để cảm xúc này lộ ra tự nhiên trong lời của Aira, đừng nói như bot.');
        return parts.join(' ');
    }
    /**
     * Compact one-line summary for prompt injection.
     */
    formatForInjection(profile) {
        if (!profile.expressive) {
            return `Expression: nền ${profile.moodWord}, giọng ${profile.tone} (cảm xúc nhẹ).`;
        }
        const face = profile.kaomoji ? ` ${profile.kaomoji}` : '';
        return `Expression (thể hiện cảm xúc THẬT): ${profile.directive}${face}`;
    }
}
exports.ExpressionEngine = ExpressionEngine;
function energyVi(energy) {
    switch (energy) {
        case 'flat': return 'uể oải';
        case 'low': return 'trầm';
        case 'steady': return 'vừa phải';
        case 'lively': return 'sôi nổi';
        case 'high': return 'cao/dồn dập';
    }
}
function clamp01(n) {
    return Math.max(0, Math.min(1, n));
}
//# sourceMappingURL=expression-engine.js.map