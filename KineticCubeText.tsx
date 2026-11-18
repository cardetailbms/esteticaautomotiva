import * as React from "react";
import {useEffect, useLayoutEffect, useRef, useState} from "react";
import {addPropertyControls, ControlType, useIsStaticRenderer} from "framer";

// ---------------------------------------------------------------------------------------------------------------
// Kinetic Cube Text — a word built from 3D letter blocks that turn like a Rubik's cube row, by Buster Studios.
// Every letter is a block with a front face and a side face. On scroll the row turns in from the right (last
// letter first); each hover spins the row one full turn, letter by letter, flashing the accent side as it goes.
// "Fit Width" sizes the word to fill its container exactly, so a giant footer wordmark never wraps.
// ---------------------------------------------------------------------------------------------------------------

type Dir = "From Right" | "From Left";

interface Props {
  text: string;
  fit: boolean;
  size: number;
  font: React.CSSProperties;
  tracking: number;
  color: string;
  sideColor: string;
  sideFill: string;
  direction: Dir;
  duration: number;
  stagger: number;
  hoverTwist: boolean;
  perspective: number;
  replay: boolean;
  style?: React.CSSProperties;
}

const EASE = "cubic-bezier(.65,0,.2,1)";

/**
 * Kinetic Cube Text — 3D letter blocks that turn in like a cube row.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 */
export default function KineticCubeText(props: Props) {
  const {
    text,
    fit,
    size,
    font,
    tracking,
    color,
    sideColor,
    sideFill,
    direction,
    duration,
    stagger,
    hoverTwist,
    perspective,
    replay,
  } = props;
  const isStatic = useIsStaticRenderer();
  const reduce =
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const box = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const cells = useRef<(HTMLSpanElement | null)[]>([]);
  const [fs, setFs] = useState(size);
  const [widths, setWidths] = useState<number[]>([]);
  const [inView, setInView] = useState(isStatic || reduce);
  const [turns, setTurns] = useState(0); // each hover adds one full turn, so the row always lands on its front face
  const [twisting, setTwisting] = useState(false);
  const [revealing, setRevealing] = useState(false);
  // side faces only exist while blocks are turning; at rest perspective would show slivers of them
  useEffect(() => {
    if (!inView || isStatic || reduce) return;
    setRevealing(true);
    const t = window.setTimeout(
      () => setRevealing(false),
      (duration + stagger * Math.max(1, (text || "").length)) * 1000 + 100,
    );
    return () => window.clearTimeout(t);
  }, [inView]);
  const moving = revealing || twisting;
  const letters = (text || "").split("");

  // fit the word to the container width, and measure each letter for its block depth
  useLayoutEffect(() => {
    const el = box.current,
      pr = probe.current;
    if (!el || !pr) return;
    const measure = () => {
      const natural = pr.offsetWidth; // probe is rendered at 100px; offsetWidth ignores 3D transforms on ancestors (getBoundingClientRect is foreshortened)
      const next = fit && natural > 0 ? Math.max(8, (el.clientWidth / natural) * 100 * 0.995) : size;
      setFs(next);
      requestAnimationFrame(() => setWidths(cells.current.map((c) => (c ? c.offsetWidth : 0))));
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    const fonts = (document as Document & {fonts?: {ready: Promise<unknown>}}).fonts;
    fonts?.ready.then(measure);
    return () => ro?.disconnect();
  }, [fit, size, text, tracking, font?.fontFamily, font?.fontWeight]);

  useEffect(() => {
    if (isStatic || reduce) {
      setInView(true);
      return;
    }
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (es) => {
        const e = es[0];
        if (e?.isIntersecting) {
          setInView(true);
          if (!replay) io.disconnect();
        } else if (replay) setInView(false);
      },
      {threshold: 0.25},
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isStatic, reduce, replay]);

  const n = letters.length;
  const sign = direction === "From Right" ? -1 : 1;
  const textStyle: React.CSSProperties = {
    ...font,
    fontSize: fs,
    letterSpacing: `${tracking}em`,
    lineHeight: 0.8,
    whiteSpace: "nowrap",
  };
  return (
    <div
      ref={box}
      role="img"
      aria-label={text}
      onPointerEnter={(ev) => {
        if (ev.pointerType === "mouse" && hoverTwist && inView && !twisting) {
          setTwisting(true);
          setTurns((t) => t + 1);
          window.setTimeout(() => setTwisting(false), (duration + stagger * letters.length) * 1000);
        }
      }}
      style={{
        ...props.style,
        position: "relative",
        width: "100%",
        perspective: `${Math.max(perspective, fs * 7)}px`,
        overflow: "visible",
        userSelect: "none",
      }}>
      <span
        ref={probe}
        aria-hidden="true"
        style={{
          ...textStyle,
          fontSize: 100,
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          left: 0,
          top: 0,
        }}>
        {text}
      </span>
      <div
        aria-hidden="true"
        style={{
          ...textStyle,
          display: "flex",
          width: "100%",
          transformStyle: "preserve-3d",
        }}>
        {letters.map((ch, i) => {
          const w = widths[i] || fs * 0.6;
          // reveal order: from the right means the last letter turns first
          const order = direction === "From Right" ? n - 1 - i : i;
          const angle = !inView ? 90 * sign : turns * 360 * sign;
          const delay = !inView ? 0 : turns > 0 ? i * stagger * 0.6 : order * stagger;
          return (
            <span
              key={i}
              ref={(c) => {
                cells.current[i] = c;
              }}
              style={{
                position: "relative",
                display: "inline-block",
                transformStyle: moving || !inView ? "preserve-3d" : undefined,
                transform: `translateZ(${moving || !inView ? -w / 2 : 0}px) rotateY(${angle}deg)`,
                opacity: inView ? 1 : 0, // same function list always, so the spin interpolates
                transition: reduce
                  ? "none"
                  : `transform ${duration}s ${EASE} ${delay}s, opacity ${duration * 0.4}s ease ${delay}s`,
              }}>
              <span
                style={{
                  display: "block",
                  color,
                  transform: `translateZ(${moving || !inView ? w / 2 : 0}px)`,
                  backfaceVisibility: "hidden",
                }}>
                {ch === " " ? " " : ch}
              </span>
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "block",
                  color: sideColor,
                  background: sideFill,
                  transform: `rotateY(${-90 * sign}deg) translateZ(${w / 2}px)`,
                  backfaceVisibility: "hidden",
                  opacity: moving ? 1 : 0,
                  transition: moving ? "none" : "opacity .25s ease",
                }}>
                {ch === " " ? " " : ch}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

KineticCubeText.defaultProps = {
  text: "KYBRE",
  fit: true,
  size: 200,
  tracking: -0.06,
  color: "#EDEAE4",
  sideColor: "#FF5A1F",
  sideFill: "transparent",
  direction: "From Right",
  duration: 1.1,
  stagger: 0.09,
  hoverTwist: true,
  perspective: 1600,
  replay: false,
};

addPropertyControls(KineticCubeText, {
  text: {type: ControlType.String, title: "Text", defaultValue: "KYBRE"},
  fit: {
    type: ControlType.Boolean,
    title: "Fit Width",
    defaultValue: true,
    description: "Scale the word to fill the full width.",
  },
  size: {
    type: ControlType.Number,
    title: "Size",
    defaultValue: 200,
    min: 12,
    max: 1200,
    unit: "px",
    hidden: (p: Partial<Props>) => !!p.fit,
  },
  font: {
    type: ControlType.Font,
    title: "Font",
    controls: "basic",
    defaultFontType: "sans-serif",
  },
  tracking: {
    type: ControlType.Number,
    title: "Letter Spacing",
    defaultValue: -0.06,
    min: -0.2,
    max: 0.4,
    step: 0.005,
    unit: "em",
  },
  color: {type: ControlType.Color, title: "Front", defaultValue: "#EDEAE4"},
  sideColor: {
    type: ControlType.Color,
    title: "Side",
    defaultValue: "#FF5A1F",
  },
  sideFill: {
    type: ControlType.Color,
    title: "Side Fill",
    defaultValue: "transparent",
    description: "Optional block colour behind the side face.",
  },
  direction: {
    type: ControlType.Enum,
    title: "Turn",
    options: ["From Right", "From Left"],
    defaultValue: "From Right",
    displaySegmentedControl: true,
  },
  duration: {
    type: ControlType.Number,
    title: "Duration",
    defaultValue: 1.1,
    min: 0.2,
    max: 3,
    step: 0.05,
    unit: "s",
  },
  stagger: {
    type: ControlType.Number,
    title: "Stagger",
    defaultValue: 0.09,
    min: 0,
    max: 0.4,
    step: 0.01,
    unit: "s",
  },
  hoverTwist: {
    type: ControlType.Boolean,
    title: "Hover Twist",
    defaultValue: true,
    description: "Each hover turns the row one full revolution, letter by letter.",
  },
  perspective: {
    type: ControlType.Number,
    title: "Perspective",
    defaultValue: 1600,
    min: 300,
    max: 5000,
    step: 50,
    unit: "px",
  },
  replay: {type: ControlType.Boolean, title: "Replay", defaultValue: false},
});
