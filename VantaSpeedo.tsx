import * as React from "react";
import {useEffect, useRef, useState} from "react";
import {addPropertyControls, ControlType, useIsStaticRenderer} from "framer";

// ---------------------------------------------------------------------------------------------------------------
// Vanta Speedo — stats shown as dashboard gauges, by Buster Studios.
// When they scroll into view the needles sweep up past their value, settle back like a real dial, and the numbers
// count up with them. Hover a gauge to rev it.
// ---------------------------------------------------------------------------------------------------------------

type Stat = {
  value: number;
  max: number;
  prefix: string;
  suffix: string;
  decimals: number;
  label: string;
};

interface Props {
  stats: Stat[];
  columns: number;
  phoneColumns: number;
  gap: number;
  duration: number;
  textColor: string;
  mutedColor: string;
  accent: string;
  trackColor: string;
  numberFont: React.CSSProperties;
  labelFont: React.CSSProperties;
  style?: React.CSSProperties;
}

const SWEEP = 240,
  START = -120; // dial runs from -120° to +120°

function Gauge({s, run, duration, p, i}: {s: Stat; run: boolean; duration: number; p: Props; i: number}) {
  const [k, setK] = useState(run && duration === 0 ? 1 : 0);
  const [rev, setRev] = useState(false);
  useEffect(() => {
    if (!run) return;
    if (duration === 0) {
      setK(1);
      return;
    }
    let raf = 0,
      t0 = 0;
    const delay = i * 140;
    const step = (t: number) => {
      if (!t0) t0 = t + delay;
      const x = Math.max(0, Math.min(1, (t - t0) / (duration * 1000)));
      // overshoot then settle: like a needle with a bit of spring in it
      const e = x === 1 ? 1 : 1 - Math.pow(2, -9 * x) * Math.cos(x * 9.5);
      setK(e);
      if (x < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run, duration, i]);
  const frac = Math.max(0, Math.min(1, s.max ? s.value / s.max : 1));
  const ang = START + SWEEP * Math.min(1.08, frac * k) + (rev ? 10 : 0);
  const shown = s.value * Math.min(1, Math.max(0, k));
  const R = 80,
    C = 100,
    arc = (a0: number, a1: number) => {
      const p0 = [C + R * Math.sin((a0 * Math.PI) / 180), C - R * Math.cos((a0 * Math.PI) / 180)],
        p1 = [C + R * Math.sin((a1 * Math.PI) / 180), C - R * Math.cos((a1 * Math.PI) / 180)];
      return `M ${p0[0]} ${p0[1]} A ${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p1[0]} ${p1[1]}`;
    };
  const ticks = Array.from({length: 13}, (_, j) => START + (SWEEP / 12) * j);
  return (
    <div
      onMouseEnter={() => setRev(true)}
      onMouseLeave={() => setRev(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        minWidth: 0,
      }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 260,
          aspectRatio: "1 / 0.82",
          marginBottom: "14%",
        }}>
        <svg
          viewBox="0 0 200 164"
          style={{
            width: "100%",
            height: "100%",
            overflow: "visible",
          }}
          aria-hidden="true">
          <path
            d={arc(START, START + SWEEP)}
            fill="none"
            stroke={p.trackColor}
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d={arc(START, Math.max(START + 0.01, Math.min(START + SWEEP, ang)))}
            fill="none"
            stroke={p.accent}
            strokeWidth="10"
            strokeLinecap="round"
            style={{filter: `drop-shadow(0 0 6px ${p.accent})`}}
          />
          {ticks.map((a, j) => {
            const r0 = j % 3 === 0 ? 58 : 63,
              x0 = C + r0 * Math.sin((a * Math.PI) / 180),
              y0 = C - r0 * Math.cos((a * Math.PI) / 180),
              x1 = C + 68 * Math.sin((a * Math.PI) / 180),
              y1 = C - 68 * Math.cos((a * Math.PI) / 180);
            return (
              <line
                key={j}
                x1={x0}
                y1={y0}
                x2={x1}
                y2={y1}
                stroke={a <= ang ? p.textColor : p.trackColor}
                strokeWidth={j % 3 === 0 ? 2.2 : 1.2}
              />
            );
          })}
          <g
            style={{
              transform: `rotate(${ang}deg)`,
              transformOrigin: "100px 100px",
              transition: rev ? "transform .5s cubic-bezier(.3,1.6,.5,1)" : "transform .5s ease",
            }}>
            <line x1="100" y1="108" x2="100" y2="40" stroke={p.accent} strokeWidth="3.5" strokeLinecap="round" />
          </g>
          <circle cx="100" cy="100" r="6" fill={p.textColor} />
        </svg>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "74%",
            textAlign: "center",
            color: p.textColor,
            ...p.numberFont,
            fontVariantNumeric: "tabular-nums",
          }}>
          <span style={visuallyHidden}>{`${s.prefix}${s.value}${s.suffix}`}</span>
          <span aria-hidden="true">
            {s.prefix}
            {shown.toFixed(s.decimals)}
            <span style={{color: p.accent}}>{s.suffix}</span>
          </span>
        </div>
      </div>
      <div
        style={{
          ...p.labelFont,
          textTransform: "uppercase" as const,
          color: p.mutedColor,
          textAlign: "center",
        }}>
        {s.label}
      </div>
    </div>
  );
}

/**
 * Vanta Speedo — gauge-style statistics.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 */
export default function VantaSpeedo(props: Props) {
  const p = props;
  const list = p.stats?.length ? p.stats : DEFAULT_STATS;
  const isStatic = useIsStaticRenderer();
  const reduce =
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(1200);
  const [run, setRun] = useState(isStatic);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    if (isStatic || reduce) {
      setRun(true);
      return () => ro.disconnect();
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es[0]?.isIntersecting) {
          setRun(true);
          io.disconnect();
        }
      },
      {threshold: 0.4},
    );
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, [isStatic, reduce]);
  const n = Math.max(1, w < 640 ? p.phoneColumns : p.columns);
  return (
    <div
      ref={root}
      style={{
        ...p.style,
        width: "100%",
        display: "grid",
        gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
        gap: p.gap,
      }}>
      {list.map((s, i) => (
        <Gauge key={i} s={s} run={run} duration={isStatic || reduce ? 0 : p.duration} p={p} i={i} />
      ))}
    </div>
  );
}

const visuallyHidden: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
};
const DEFAULT_STATS: Stat[] = [
  {
    value: 2400,
    max: 3000,
    prefix: "",
    suffix: "+",
    decimals: 0,
    label: "Cars detailed",
  },
  {
    value: 4.9,
    max: 5,
    prefix: "",
    suffix: "★",
    decimals: 1,
    label: "Average review",
  },
  {
    value: 9,
    max: 12,
    prefix: "",
    suffix: " yrs",
    decimals: 0,
    label: "Coating warranty",
  },
  {
    value: 100,
    max: 100,
    prefix: "",
    suffix: "%",
    decimals: 0,
    label: "Hand finished",
  },
];

VantaSpeedo.defaultProps = {
  stats: DEFAULT_STATS,
  columns: 4,
  phoneColumns: 2,
  gap: 24,
  duration: 2.2,
  textColor: "#F4F1EC",
  mutedColor: "rgba(244,241,236,0.6)",
  accent: "#FF5A1F",
  trackColor: "rgba(244,241,236,0.14)",
};

addPropertyControls(VantaSpeedo, {
  stats: {
    type: ControlType.Array,
    title: "Gauges",
    maxCount: 8,
    control: {
      type: ControlType.Object,
      controls: {
        value: {
          type: ControlType.Number,
          title: "Value",
          defaultValue: 100,
          min: 0,
          max: 1000000,
          step: 0.1,
        },
        max: {
          type: ControlType.Number,
          title: "Dial Max",
          defaultValue: 120,
          min: 0.1,
          max: 1000000,
          step: 0.1,
          description: "Where the needle tops out.",
        },
        prefix: {
          type: ControlType.String,
          title: "Prefix",
          defaultValue: "",
        },
        suffix: {
          type: ControlType.String,
          title: "Suffix",
          defaultValue: "+",
        },
        decimals: {
          type: ControlType.Number,
          title: "Decimals",
          defaultValue: 0,
          min: 0,
          max: 2,
          step: 1,
          displayStepper: true,
        },
        label: {
          type: ControlType.String,
          title: "Label",
          defaultValue: "Label",
        },
      },
    },
    defaultValue: DEFAULT_STATS,
  },
  columns: {
    type: ControlType.Number,
    title: "Columns",
    defaultValue: 4,
    min: 1,
    max: 6,
    step: 1,
    displayStepper: true,
  },
  phoneColumns: {
    type: ControlType.Number,
    title: "Phone Cols",
    defaultValue: 2,
    min: 1,
    max: 3,
    step: 1,
    displayStepper: true,
  },
  gap: {
    type: ControlType.Number,
    title: "Gap",
    defaultValue: 24,
    min: 0,
    max: 120,
    unit: "px",
  },
  duration: {
    type: ControlType.Number,
    title: "Duration",
    defaultValue: 2.2,
    min: 0.4,
    max: 6,
    step: 0.1,
    unit: "s",
  },
  textColor: {
    type: ControlType.Color,
    title: "Text",
    defaultValue: "#F4F1EC",
  },
  mutedColor: {
    type: ControlType.Color,
    title: "Label",
    defaultValue: "rgba(244,241,236,0.6)",
  },
  accent: {
    type: ControlType.Color,
    title: "Accent",
    defaultValue: "#FF5A1F",
  },
  trackColor: {
    type: ControlType.Color,
    title: "Track",
    defaultValue: "rgba(244,241,236,0.14)",
  },
  numberFont: {
    type: ControlType.Font,
    title: "Number Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: {
      fontSize: 44,
      letterSpacing: "-0.03em",
      lineHeight: "1em",
    },
  },
  labelFont: {
    type: ControlType.Font,
    title: "Label Font",
    controls: "extended",
    defaultFontType: "monospace",
    defaultValue: {
      fontSize: 11,
      letterSpacing: "0.14em",
      lineHeight: "1.3em",
    },
  },
});
