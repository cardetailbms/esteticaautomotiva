import * as React from "react";
import {useEffect, useRef} from "react";
import {addPropertyControls, ControlType, useIsStaticRenderer} from "framer";

// ---------------------------------------------------------------------------------------------------------------
// Vanta Tread — a tyre-tread divider that rolls as you scroll, by Buster Studios.
// The pattern travels with the page (faster or slower with the Speed control) and can carry a running line of text,
// like the writing on a tyre wall. Holds still in the editor, static exports and for reduced motion.
// ---------------------------------------------------------------------------------------------------------------

type Pattern = "Chevron" | "Blocks" | "Grooves";

interface Props {
  pattern: Pattern;
  text: string;
  speed: number;
  reverse: boolean;
  rubber: string;
  groove: string;
  textColor: string;
  font: React.CSSProperties;
  style?: React.CSSProperties;
}

function tile(pattern: Pattern, h: number, rubber: string, groove: string): [string, number] {
  const w = pattern === "Grooves" ? h * 0.5 : h * 0.9;
  let shapes = "";
  if (pattern === "Chevron")
    shapes = `<path d="M0 0 L${w * 0.5} ${h * 0.5} L0 ${h} M${w * 0.5} 0 L${w} ${h * 0.5} L${w * 0.5} ${h}" fill="none" stroke="${groove}" stroke-width="${h * 0.12}"/>`;
  if (pattern === "Blocks")
    shapes = `<rect x="${w * 0.08}" y="${h * 0.1}" width="${w * 0.36}" height="${h * 0.34}" rx="${h * 0.04}" fill="${groove}"/><rect x="${w * 0.56}" y="${h * 0.56}" width="${w * 0.36}" height="${h * 0.34}" rx="${h * 0.04}" fill="${groove}"/>`;
  if (pattern === "Grooves")
    shapes = `<rect x="${w * 0.4}" y="0" width="${w * 0.2}" height="${h}" fill="${groove}" transform="skewX(-20)"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${rubber}"/>${shapes}</svg>`;
  return [`url("data:image/svg+xml,${encodeURIComponent(svg)}")`, w];
}

/**
 * Vanta Tread — scroll-driven tyre tread divider.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 56
 */
export default function VantaTread(props: Props) {
  const {pattern, text, speed, reverse, rubber, groove, textColor, font} = props;
  const isStatic = useIsStaticRenderer();
  const reduce =
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const box = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const words = useRef<HTMLDivElement>(null);
  const h = 56;

  useEffect(() => {
    const el = box.current;
    if (!el || isStatic || reduce) return;
    let raf = 0,
      near = false,
      last = NaN;
    const tick = () => {
      raf = 0;
      if (!near) return;
      const off = (window.scrollY || 0) * speed * (reverse ? -1 : 1);
      if (off === last) return;
      last = off;
      if (band.current) band.current.style.backgroundPosition = `${off}px 0`;
      if (words.current) words.current.style.transform = `translateX(${(-off * 0.5) % 1000}px)`;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (es) => {
        near = !!es[0]?.isIntersecting;
        if (near) kick();
      },
      {rootMargin: "50% 0px 50% 0px"},
    );
    io.observe(el);
    window.addEventListener("scroll", kick, {passive: true});
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("scroll", kick);
    };
  }, [isStatic, reduce, speed, reverse]);

  const [bg, tw] = tile(pattern, h, rubber, groove);
  const line = text ? Array.from({length: 12}, () => text).join("   ·   ") : "";
  return (
    <div
      ref={box}
      aria-hidden="true"
      style={{
        ...props.style,
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: rubber,
      }}>
      <div
        ref={band}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: bg,
          backgroundSize: `${tw}px 100%`,
          backgroundRepeat: "repeat-x",
        }}
      />
      {line ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
          }}>
          <div
            ref={words}
            style={{
              whiteSpace: "nowrap",
              padding: "4px 0",
              background: rubber,
              color: textColor,
              ...font,
              textTransform: "uppercase",
            }}>
            {line}
          </div>
        </div>
      ) : null}
    </div>
  );
}

VantaTread.defaultProps = {
  pattern: "Chevron",
  text: "",
  speed: 0.6,
  reverse: false,
  rubber: "#0b0b0c",
  groove: "#1c1c1f",
  textColor: "#FF5A1F",
};

addPropertyControls(VantaTread, {
  pattern: {
    type: ControlType.Enum,
    title: "Pattern",
    options: ["Chevron", "Blocks", "Grooves"],
    defaultValue: "Chevron",
    displaySegmentedControl: true,
  },
  text: {
    type: ControlType.String,
    title: "Sidewall Text",
    defaultValue: "",
    description: "Optional running text, like the writing on a tyre.",
  },
  speed: {
    type: ControlType.Number,
    title: "Speed",
    defaultValue: 0.6,
    min: 0.1,
    max: 3,
    step: 0.1,
  },
  reverse: {
    type: ControlType.Boolean,
    title: "Reverse",
    defaultValue: false,
  },
  rubber: {
    type: ControlType.Color,
    title: "Rubber",
    defaultValue: "#0b0b0c",
  },
  groove: {
    type: ControlType.Color,
    title: "Groove",
    defaultValue: "#1c1c1f",
  },
  textColor: {
    type: ControlType.Color,
    title: "Text",
    defaultValue: "#FF5A1F",
    hidden: (p: Partial<Props>) => !p.text,
  },
  font: {
    type: ControlType.Font,
    title: "Font",
    controls: "extended",
    defaultFontType: "monospace",
    defaultValue: {
      fontSize: 12,
      letterSpacing: "0.3em",
      lineHeight: "1em",
    },
    hidden: (p: Partial<Props>) => !p.text,
  },
});
