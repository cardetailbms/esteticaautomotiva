import * as React from "react";
import {useEffect, useRef} from "react";
import {addPropertyControls, ControlType, useIsStaticRenderer} from "framer";

// ---------------------------------------------------------------------------------------------------------------
// Kinetic Scroll Fill — a paragraph that lights up word by word as you scroll, by Buster Studios.
// Words start dim and fill to full colour as the reading line passes them; wrap a word in *asterisks* to make it
// light up in the accent colour. Each word also rises slightly into place. Fully readable without JS.
// ---------------------------------------------------------------------------------------------------------------

interface Props {
  text: string;
  size: number;
  lineHeight: number;
  tracking: number;
  font: React.CSSProperties;
  dimColor: string;
  color: string;
  accent: string;
  start: number;
  end: number;
  rise: number;
  style?: React.CSSProperties;
}

/**
 * Kinetic Scroll Fill — word-by-word scroll-lit paragraph.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1100
 */
export default function KineticScrollFill(props: Props) {
  const {text, size, lineHeight, tracking, font, dimColor, color, accent, start, end, rise} = props;
  const isStatic = useIsStaticRenderer();
  const reduce =
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = useRef<HTMLParagraphElement>(null);
  const words = (text || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => ({
      hot: /^\*.*\*[.,!?;:]*$/.test(w),
      t: w.replace(/\*/g, ""),
    }));

  useEffect(() => {
    const el = root.current;
    if (isStatic || reduce || !el) return;
    const spans = Array.from(el.querySelectorAll<HTMLSpanElement>("[data-w]"));
    let raf = 0;
    const tick = () => {
      raf = 0;
      const r = el.getBoundingClientRect(),
        vh = window.innerHeight || 800;
      // progress 0 when the top reaches `start`% of the screen, 1 when the bottom reaches `end`%
      const a = vh * (start / 100),
        b = vh * (end / 100);
      const p = Math.max(0, Math.min(1, (a - r.top) / Math.max(1, r.height + (a - b))));
      const n = spans.length,
        lit = p * n;
      spans.forEach((s, i) => {
        const f = Math.max(0, Math.min(1, lit - i));
        const op = (0.18 + f * 0.82).toFixed(3);
        if (s.style.opacity === op) return; // only touch words whose state changed
        s.style.opacity = op;
        s.style.transform = rise ? `translateY(${(((1 - f) * rise) / 100).toFixed(3)}em)` : "";
      });
    };
    let near = true;
    const kick = () => {
      if (!raf && near) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (es) => {
        near = !!es[0]?.isIntersecting;
        kick();
      },
      {rootMargin: "50% 0px 50% 0px"},
    );
    io.observe(el);
    window.addEventListener("scroll", kick, {passive: true});
    window.addEventListener("resize", kick);
    kick();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
    };
  }, [isStatic, reduce, text, start, end, rise]);

  return (
    <p
      ref={root}
      style={{
        ...props.style,
        ...font,
        fontSize: size,
        lineHeight: `${lineHeight}em`,
        letterSpacing: `${tracking}em`,
        margin: 0,
        width: "100%",
        color: dimColor,
      }}>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span
            data-w=""
            style={{
              display: "inline-block",
              color: w.hot ? accent : color,
              opacity: isStatic || reduce ? 1 : 0.18,
              willChange: "opacity, transform",
            }}>
            {w.t}
          </span>
          {i < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </p>
  );
}

KineticScrollFill.defaultProps = {
  text: "We design robots for the one place they've never been welcome: *home.* Soft where people touch them, honest about what they're doing, and quiet enough to forget about. Every robot we ship has to earn its place by the *second week,* or it goes back to the workshop.",
  size: 56,
  lineHeight: 1.12,
  tracking: -0.025,
  dimColor: "rgba(237,234,228,0.2)",
  color: "#EDEAE4",
  accent: "#FF5A1F",
  start: 85,
  end: 35,
  rise: 18,
};

addPropertyControls(KineticScrollFill, {
  text: {
    type: ControlType.String,
    title: "Text",
    defaultValue: KineticScrollFill.defaultProps.text,
    displayTextArea: true,
    description: "Wrap words in *asterisks* to light them in the accent colour.",
  },
  size: {
    type: ControlType.Number,
    title: "Size",
    defaultValue: 56,
    min: 12,
    max: 200,
    unit: "px",
    description: "Set a different size on each breakpoint.",
  },
  lineHeight: {
    type: ControlType.Number,
    title: "Line Height",
    defaultValue: 1.12,
    min: 0.8,
    max: 2,
    step: 0.01,
    unit: "em",
  },
  tracking: {
    type: ControlType.Number,
    title: "Letter Spacing",
    defaultValue: -0.025,
    min: -0.1,
    max: 0.2,
    step: 0.005,
    unit: "em",
  },
  font: {
    type: ControlType.Font,
    title: "Font",
    controls: "basic",
    defaultFontType: "sans-serif",
  },
  color: {type: ControlType.Color, title: "Lit", defaultValue: "#EDEAE4"},
  accent: {
    type: ControlType.Color,
    title: "Accent",
    defaultValue: "#FF5A1F",
  },
  dimColor: {
    type: ControlType.Color,
    title: "Unlit",
    defaultValue: "rgba(237,234,228,0.2)",
  },
  start: {
    type: ControlType.Number,
    title: "Start",
    defaultValue: 85,
    min: 0,
    max: 100,
    unit: "%",
    description: "Starts lighting when the top reaches this far down the screen.",
  },
  end: {
    type: ControlType.Number,
    title: "End",
    defaultValue: 35,
    min: 0,
    max: 100,
    unit: "%",
  },
  rise: {
    type: ControlType.Number,
    title: "Rise",
    defaultValue: 18,
    min: 0,
    max: 60,
    unit: "%",
  },
});
