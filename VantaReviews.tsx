import * as React from "react";
import {useEffect, useRef} from "react";
import {addPropertyControls, ControlType, useIsStaticRenderer} from "framer";

// ---------------------------------------------------------------------------------------------------------------
// Vanta Reviews — a slow conveyor of customer reviews, by Buster Studios.
// One or two rows drift in opposite directions; hovering a row pauses it so a review can be read. Each card has
// a star rating, the quote, the customer and what they drive. Holds still for reduced motion and static renders.
// ---------------------------------------------------------------------------------------------------------------

type Review = {quote: string; name: string; car: string; rating: number};

interface Props {
  reviews: Review[];
  rows: number;
  speed: number;
  cardWidth: number;
  gap: number;
  radius: number;
  cardFill: string;
  textColor: string;
  mutedColor: string;
  accent: string;
  lineColor: string;
  quoteFont: React.CSSProperties;
  metaFont: React.CSSProperties;
  style?: React.CSSProperties;
}

function Stars({n, color, off}: {n: number; color: string; off: string}) {
  return (
    <span role="img" aria-label={`${n} out of 5 stars`} style={{display: "inline-flex", gap: 3}}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z"
            fill={i < Math.round(n) ? color : off}
          />
        </svg>
      ))}
    </span>
  );
}

function Row({items, dir, p, still}: {items: Review[]; dir: 1 | -1; p: Props; still: boolean}) {
  const track = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  useEffect(() => {
    const el = track.current;
    if (!el || still) return;
    let raf = 0,
      x = 0,
      last = 0,
      visible = false;
    const io = new IntersectionObserver((es) => {
      visible = !!es[0]?.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(step);
    });
    const step = (t: number) => {
      raf = 0;
      if (!visible) {
        last = 0;
        return;
      }
      const dt = last ? Math.min(64, t - last) : 16;
      last = t;
      const half = el.scrollWidth / 2;
      if (!paused.current) {
        x -= ((p.speed * dt) / 16) * dir;
        if (x <= -half) x += half;
        if (x > 0) x -= half;
      }
      el.style.transform = `translateX(${x}px)`;
      raf = requestAnimationFrame(step);
    };
    if (dir < 0) x = -el.scrollWidth / 4;
    io.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [still, p.speed, dir]);
  const card = (r: Review, i: number) => (
    <figure
      key={i}
      style={{
        flex: "none",
        width: p.cardWidth,
        margin: 0,
        padding: 24,
        borderRadius: p.radius,
        background: p.cardFill,
        border: `1px solid ${p.lineColor}`,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
      <Stars n={r.rating} color={p.accent} off={p.lineColor} />
      <blockquote style={{margin: 0, ...p.quoteFont, color: p.textColor}}>{`“${r.quote}”`}</blockquote>
      <figcaption
        style={{
          marginTop: "auto",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          ...p.metaFont,
          textTransform: "uppercase" as const,
        }}>
        <span style={{color: p.textColor}}>{r.name}</span>
        <span style={{color: p.mutedColor}}>{r.car}</span>
      </figcaption>
    </figure>
  );
  const set = still ? items : [...items, ...items];
  return (
    <div
      onMouseEnter={() => {
        paused.current = true;
      }}
      onMouseLeave={() => {
        paused.current = false;
      }}
      style={{overflow: still ? "auto" : "hidden", width: "100%"}}>
      <div
        ref={track}
        style={{
          display: "flex",
          gap: p.gap,
          width: "max-content",
          willChange: still ? undefined : "transform",
        }}>
        {set.map((r, i) => card(r, i))}
      </div>
    </div>
  );
}

/**
 * Vanta Reviews — drifting review conveyor.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function VantaReviews(props: Props) {
  const p = props;
  const list = p.reviews?.length ? p.reviews : DEFAULT_REVIEWS;
  const isStatic = useIsStaticRenderer();
  const reduce =
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const still = isStatic || reduce;
  const half = Math.ceil(list.length / 2);
  const rows: Review[][] = p.rows > 1 && list.length > 3 ? [list.slice(0, half), list.slice(half)] : [list];
  return (
    <div
      style={{
        ...p.style,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: p.gap,
        maskImage: still ? undefined : "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
        WebkitMaskImage: still ? undefined : "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
      }}>
      {rows.map((r, i) => (
        <Row key={i} items={r} dir={i % 2 ? -1 : 1} p={p} still={still} />
      ))}
    </div>
  );
}

const DEFAULT_REVIEWS: Review[] = [
  {
    quote: "Peguei o carro e juro que achei que tinham trocado pelo zero km.",
    name: "Jordan P.",
    car: "SUV preto",
    rating: 5,
  },
  {
    quote: "Dez anos de riscos de espiral sumidos num fim de semana. A água escorrega como espelho agora.",
    name: "Amira K.",
    car: "Sedan cinza",
    rating: 5,
  },
  {
    quote: "Fizeram toda a nossa frota no depósito antes do turno da manhã. Sem parar nada.",
    name: "Lewis T.",
    car: "Vans de trabalho",
    rating: 5,
  },
  {
    quote: "O interior não cheira a nada — depois de dois filhos e um cachorro, isso é milagre.",
    name: "Priya S.",
    car: "Familiar",
    rating: 5,
  },
  {
    quote: "Explicaram direto o que a pintura precisava, sem empurrar extra. O resultado para o trânsito.",
    name: "Marco D.",
    car: "Coupé clássico",
    rating: 5,
  },
  {
    quote: "Agendei online, vieram até mim, pronto antes do almoço.",
    name: "Hannah W.",
    car: "Hatch branco",
    rating: 4,
  },
];

VantaReviews.defaultProps = {
  reviews: DEFAULT_REVIEWS,
  rows: 2,
  speed: 0.6,
  cardWidth: 380,
  gap: 16,
  radius: 20,
  cardFill: "#121214",
  textColor: "#F4F1EC",
  mutedColor: "rgba(244,241,236,0.55)",
  accent: "#FF5A1F",
  lineColor: "rgba(244,241,236,0.12)",
};

addPropertyControls(VantaReviews, {
  reviews: {
    type: ControlType.Array,
    title: "Reviews",
    maxCount: 24,
    control: {
      type: ControlType.Object,
      controls: {
        quote: {
          type: ControlType.String,
          title: "Quote",
          defaultValue: "",
          displayTextArea: true,
        },
        name: {
          type: ControlType.String,
          title: "Name",
          defaultValue: "Customer",
        },
        car: {
          type: ControlType.String,
          title: "Car",
          defaultValue: "",
        },
        rating: {
          type: ControlType.Number,
          title: "Stars",
          defaultValue: 5,
          min: 1,
          max: 5,
          step: 1,
          displayStepper: true,
        },
      },
    },
    defaultValue: DEFAULT_REVIEWS,
  },
  rows: {
    type: ControlType.Number,
    title: "Rows",
    defaultValue: 2,
    min: 1,
    max: 2,
    step: 1,
    displayStepper: true,
  },
  speed: {
    type: ControlType.Number,
    title: "Speed",
    defaultValue: 0.6,
    min: 0.1,
    max: 3,
    step: 0.1,
  },
  cardWidth: {
    type: ControlType.Number,
    title: "Card Width",
    defaultValue: 380,
    min: 240,
    max: 600,
    unit: "px",
  },
  gap: {
    type: ControlType.Number,
    title: "Gap",
    defaultValue: 16,
    min: 0,
    max: 64,
    unit: "px",
  },
  radius: {
    type: ControlType.Number,
    title: "Radius",
    defaultValue: 20,
    min: 0,
    max: 40,
    unit: "px",
  },
  cardFill: {
    type: ControlType.Color,
    title: "Card",
    defaultValue: "#121214",
  },
  textColor: {
    type: ControlType.Color,
    title: "Text",
    defaultValue: "#F4F1EC",
  },
  mutedColor: {
    type: ControlType.Color,
    title: "Muted",
    defaultValue: "rgba(244,241,236,0.55)",
  },
  accent: {
    type: ControlType.Color,
    title: "Stars",
    defaultValue: "#FF5A1F",
  },
  lineColor: {
    type: ControlType.Color,
    title: "Line",
    defaultValue: "rgba(244,241,236,0.12)",
  },
  quoteFont: {
    type: ControlType.Font,
    title: "Quote Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: {
      fontSize: 18,
      letterSpacing: "-0.01em",
      lineHeight: "1.45em",
    },
  },
  metaFont: {
    type: ControlType.Font,
    title: "Meta Font",
    controls: "extended",
    defaultFontType: "monospace",
    defaultValue: {
      fontSize: 11,
      letterSpacing: "0.12em",
      lineHeight: "1.3em",
    },
  },
});
