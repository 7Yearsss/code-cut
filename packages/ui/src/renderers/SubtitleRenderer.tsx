import { motion } from "framer-motion";
import type { SubtitleLayer } from "../types.ts";

const ANIM_OUT_DUR = 0.4;

// ── animation variant sets ───────────────────────────────────────────────────

const wordSpringVariants = {
  container: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.02 } },
  },
  item: {
    hidden: { opacity: 0, y: 28, scale: 0.82 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { type: "spring" as const, stiffness: 420, damping: 26 },
    },
  },
};

const cinematicVariants = {
  container: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
  },
  item: {
    hidden: { y: "108%", opacity: 0 },
    visible: {
      y: "0%", opacity: 1,
      transition: { type: "spring" as const, stiffness: 260, damping: 28 },
    },
  },
};

const typewriterVariants = {
  container: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.038, delayChildren: 0.0 } },
  },
  item: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.01 } },
  },
};

const fadeVariants = {
  container: {
    hidden: {},
    visible: { transition: { duration: 0.5 } },
  },
  item: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
  },
};

// ── helpers ──────────────────────────────────────────────────────────────────

function WordSpring({ text, color, fontSize }: { text: string; color: string; fontSize: number }) {
  const words = text.split(" ");
  return (
    <motion.div
      variants={wordSpringVariants.container}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `0 ${fontSize * 0.28}px` }}
    >
      {words.map((w, i) => (
        <motion.span key={i} variants={wordSpringVariants.item} style={{ color, fontSize, fontWeight: 800, lineHeight: 1.2, textShadow: "0 2px 16px rgba(0,0,0,0.7)" }}>
          {w}
        </motion.span>
      ))}
    </motion.div>
  );
}

function Cinematic({ text, color, fontSize }: { text: string; color: string; fontSize: number }) {
  const words = text.split(" ");
  return (
    <motion.div
      variants={cinematicVariants.container}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `0 ${fontSize * 0.28}px` }}
    >
      {words.map((w, i) => (
        <span key={i} style={{ display: "inline-block", overflow: "hidden", lineHeight: 1.2 }}>
          <motion.span
            variants={cinematicVariants.item}
            style={{ display: "inline-block", color, fontSize, fontWeight: 700, textShadow: "0 4px 24px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.5)", letterSpacing: "0.04em" }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </motion.div>
  );
}

function Typewriter({ text, color, fontSize }: { text: string; color: string; fontSize: number }) {
  const chars = text.split("");
  return (
    <motion.div
      variants={typewriterVariants.container}
      initial="hidden"
      animate="visible"
      style={{ color, fontSize, fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.8)", lineHeight: 1.3, textAlign: "center", fontFamily: "monospace" }}
    >
      {chars.map((c, i) => (
        <motion.span key={i} variants={typewriterVariants.item}>
          {c === " " ? " " : c}
        </motion.span>
      ))}
    </motion.div>
  );
}

function Fade({ text, color, fontSize }: { text: string; color: string; fontSize: number }) {
  return (
    <motion.div
      variants={fadeVariants.container}
      initial="hidden"
      animate="visible"
    >
      <motion.span
        variants={fadeVariants.item}
        style={{ color, fontSize, fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.8)", lineHeight: 1.3, textAlign: "center", display: "block" }}
      >
        {text}
      </motion.span>
    </motion.div>
  );
}

// ── main export ──────────────────────────────────────────────────────────────

export function SubtitleRenderer({ layer, currentTime }: { layer: SubtitleLayer; currentTime: number }) {
  const { style, text, animation = "word-spring", timeStart, duration } = layer;

  const remaining = timeStart + duration - currentTime;
  const exitOpacity = remaining <= 0 ? Math.max(0, 1 - Math.abs(remaining) / ANIM_OUT_DUR) : 1;

  const justifyContent =
    style.position === "bottom" ? "flex-end" : style.position === "top" ? "flex-start" : "center";
  const paddingBottom = style.position === "bottom" ? "8%" : "0";
  const paddingTop = style.position === "top" ? "8%" : "0";

  const props = { text, color: style.color, fontSize: style.fontSize };

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      justifyContent, alignItems: "center",
      padding: `${paddingTop} 5% ${paddingBottom}`,
      pointerEvents: "none",
      opacity: exitOpacity,
    }}>
      {animation === "word-spring" && <WordSpring {...props} />}
      {animation === "cinematic"   && <Cinematic  {...props} />}
      {animation === "typewriter"  && <Typewriter {...props} />}
      {animation === "fade"        && <Fade       {...props} />}
    </div>
  );
}
