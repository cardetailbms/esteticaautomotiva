import * as React from "react";
import {useEffect, useRef, useState} from "react";
import {addPropertyControls, ControlType, useIsStaticRenderer} from "framer";

// ---------------------------------------------------------------------------------------------------------------
// Vanta Before / After — drag a handle across a car to wipe from the "before" shot to the "after", by Buster Studios.
// Sweeps itself once when it scrolls into view so visitors know it moves. Drag, tap anywhere on it, or use the
// arrow keys on the handle. Renders as a still split in the editor, static exports and for reduced motion.
// ---------------------------------------------------------------------------------------------------------------

type Img = {src?: string; srcSet?: string; alt?: string};

interface Props {
  before?: Img;
  after?: Img;
  label?: string;
  simulateBefore?: boolean;
  beforeLabel: string;
  afterLabel: string;
  start: number;
  introSweep: boolean;
  radius: number;
  accent: string;
  labelColor: string;
  labelBg: string;
  lineWidth: number;
  labelFont: React.CSSProperties;
  style?: React.CSSProperties;
}

const clamp = (v: number) => Math.max(0, Math.min(100, v));

function Layer({img, dirty, accent, simulate}: {img?: Img; dirty: boolean; accent: string; simulate?: boolean}) {
  if (img && img.src)
    return (
      <img
        src={img.src}
        srcSet={img.srcSet}
        alt={img.alt || ""}
        loading="lazy"
        decoding="async"
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: dirty && simulate ? "grayscale(.65) contrast(.8) brightness(.7) sepia(.25)" : undefined,
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
    );
  // placeholder: a dark studio with a light streak; the "before" is dulled and spotted
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        background: dirty
          ? `radial-gradient(circle at 30% 40%, rgba(120,100,70,.35) 0 2px, transparent 3px) 0 0/22px 22px, radial-gradient(circle at 70% 60%, rgba(150,130,90,.3) 0 1.5px, transparent 2.5px) 0 0/31px 31px, linear-gradient(115deg, #2a2621 0%, #3a342b 45%, #22201c 100%)`
          : `linear-gradient(100deg, transparent 38%, color-mix(in srgb, ${accent} 66%, transparent) 46%, transparent 54%), radial-gradient(ellipse at 50% 80%, #1c1c1f 0%, #070708 70%)`,
        filter: dirty ? "saturate(.6) brightness(.85)" : "none",
      }}
    />
  );
}

/**
 * Vanta Before / After — drag to compare two photos.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 720
 */
export default function VantaBeforeAfter(props: Props) {
  const {
    before,
    after,
    beforeLabel,
    afterLabel,
    start,
    introSweep,
    radius,
    accent,
    labelColor,
    labelBg,
    lineWidth,
    labelFont,
    label,
    simulateBefore,
  } = props;
  const isStatic = useIsStaticRenderer();
  const reduce =
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(clamp(start));
  const [drag, setDrag] = useState(false);
  const touched = useRef(false);

  // one-off sweep when it first comes into view: after → before → resting point
  useEffect(() => {
    const el = box.current;
    if (!el || isStatic || reduce || !introSweep) return;
    let raf = 0,
      t0 = 0;
    const keys = [clamp(start), 88, 14, clamp(start)];
    const run = (t: number) => {
      if (touched.current) return;
      if (!t0) t0 = t;
      const k = Math.min(1, (t - t0) / 2600),
        seg = Math.min(2, Math.floor(k * 3)),
        f = k * 3 - seg;
      const e = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
      setPos(keys[seg] + (keys[seg + 1] - keys[seg]) * e);
      if (k < 1) raf = requestAnimationFrame(run);
    };
    const io = new IntersectionObserver(
      (es) => {
        if (es[0]?.isIntersecting) {
          io.disconnect();
          raf = requestAnimationFrame(run);
        }
      },
      {threshold: 0.55},
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [isStatic, reduce, introSweep, start]);

  const fromEvent = (x: number) => {
    const r = box.current?.getBoundingClientRect();
    if (r && r.width) setPos(clamp(((x - r.left) / r.width) * 100));
  };
  const down = (e: React.PointerEvent) => {
    if (isStatic) return;
    touched.current = true;
    setDrag(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    fromEvent(e.clientX);
  };
  const move = (e: React.PointerEvent) => {
    if (drag) fromEvent(e.clientX);
  };
  const up = () => setDrag(false);
  const key = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      touched.current = true;
      setPos((p) => clamp(p - step));
    }
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      touched.current = true;
      setPos((p) => clamp(p + step));
    }
  };

  const tag = (text: string, side: "left" | "right", show: boolean): React.ReactNode =>
    text ? (
      <span
        style={{
          position: "absolute",
          top: 0,
          [side]: 0,
          padding: "8px 12px",
          background: labelBg,
          color: labelColor,
          opacity: show ? 1 : 0,
          transition: "opacity .3s ease",
          pointerEvents: "none",
          ...labelFont,
          textTransform: "uppercase" as const,
        }}>
        {text}
      </span>
    ) : null;

  return (
    <div
      ref={box}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      style={{
        ...props.style,
        position: "relative",
        width: "100%",
        height: props.style?.height ?? "100%",
        overflow: "hidden",
        borderRadius: radius,
        cursor: isStatic ? "default" : drag ? "grabbing" : "ew-resize",
        touchAction: "pan-y",
        userSelect: "none",
        background: "#0b0b0c",
      }}>
      <Layer img={after} dirty={false} accent={accent} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: `inset(0 ${100 - pos}% 0 0)`,
        }}>
        <Layer img={before} dirty={true} accent={accent} simulate={simulateBefore} />
      </div>
      {tag(beforeLabel, "left", pos > 12)}
      {tag(afterLabel, "right", pos < 88)}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${pos}%`,
          width: lineWidth,
          marginLeft: -lineWidth / 2,
          background: accent,
          pointerEvents: "none",
        }}
      />
      <div
        role="slider"
        tabIndex={0}
        aria-label={label ? `Comparar antes e depois: ${label}` : "Comparar antes e depois"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        aria-valuetext={`${Math.round(pos)}% do antes visível`}
        onKeyDown={key}
        style={{
          position: "absolute",
          top: "50%",
          left: `${pos}%`,
          width: 48,
          height: 48,
          margin: "-24px 0 0 -24px",
          background: accent,
          border: "2px solid #fff",
          display: "grid",
          placeItems: "center",
          transform: drag ? "scale(.9)" : "scale(1)",
          transition: "transform .25s ease",
        }}>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round">
          <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
        </svg>
      </div>
    </div>
  );
}

VantaBeforeAfter.defaultProps = {
  beforeLabel: "Antes",
  afterLabel: "Depois",
  start: 50,
  introSweep: true,
  radius: 0,
  accent: "#da291c",
  labelColor: "#fff",
  labelBg: "#000",
  lineWidth: 2,
};

addPropertyControls(VantaBeforeAfter, {
  before: {type: ControlType.ResponsiveImage, title: "Before"},
  after: {
    type: ControlType.ResponsiveImage,
    title: "After",
    description: "Use the same angle for both shots.",
  },
  beforeLabel: {
    type: ControlType.String,
    title: "Before Label",
    defaultValue: "Before",
  },
  afterLabel: {
    type: ControlType.String,
    title: "After Label",
    defaultValue: "After",
  },
  start: {
    type: ControlType.Number,
    title: "Start",
    defaultValue: 50,
    min: 0,
    max: 100,
    unit: "%",
  },
  introSweep: {
    type: ControlType.Boolean,
    title: "Intro Sweep",
    defaultValue: true,
    description: "Sweeps once when it scrolls into view.",
  },
  radius: {
    type: ControlType.Number,
    title: "Radius",
    defaultValue: 18,
    min: 0,
    max: 60,
    unit: "px",
  },
  lineWidth: {
    type: ControlType.Number,
    title: "Line",
    defaultValue: 3,
    min: 1,
    max: 8,
    unit: "px",
  },
  accent: {
    type: ControlType.Color,
    title: "Accent",
    defaultValue: "#FF5A1F",
  },
  labelColor: {
    type: ControlType.Color,
    title: "Label Text",
    defaultValue: "#F4F1EC",
  },
  labelBg: {
    type: ControlType.Color,
    title: "Label Fill",
    defaultValue: "rgba(8,8,9,0.55)",
  },
  labelFont: {
    type: ControlType.Font,
    title: "Label Font",
    controls: "extended",
    defaultFontType: "monospace",
    defaultValue: {
      fontSize: 11,
      letterSpacing: "0.14em",
      lineHeight: "1em",
    },
  },
});
