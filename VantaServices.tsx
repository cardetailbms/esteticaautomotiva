import * as React from "react";
import {useEffect, useMemo, useRef, useState} from "react";
import {addPropertyControls, ControlType, useIsStaticRenderer} from "framer";

// ---------------------------------------------------------------------------------------------------------------
// Vanta Services — a service menu that shops like a marketplace, by Buster Studios.
// Filter tabs are built from each service's category. Cards rise in as they enter the screen, a streak of light
// sweeps across the photo on hover (like a reflection travelling down fresh paint), and each card's button links
// wherever you point it, e.g. #contact to open a booking pop-up.
// ---------------------------------------------------------------------------------------------------------------

type Img = {src?: string; srcSet?: string; alt?: string};
type Service = {
  image?: Img;
  category: string;
  title: string;
  price: string;
  duration: string;
  blurb: string;
  link: string;
  badge: string;
};

interface Props {
  services: Service[];
  allLabel: string;
  buttonLabel: string;
  columns: number;
  tabletColumns: number;
  phoneColumns: number;
  gap: number;
  radius: number;
  imageRatio: number;
  background: string;
  cardFill: string;
  textColor: string;
  mutedColor: string;
  accent: string;
  lineColor: string;
  titleFont: React.CSSProperties;
  bodyFont: React.CSSProperties;
  metaFont: React.CSSProperties;
  style?: React.CSSProperties;
}

const EASE = "cubic-bezier(.16,1,.3,1)";

function Card({s, i, p, shown, isStatic}: {s: Service; i: number; p: Props; shown: boolean; isStatic: boolean}) {
  const [hover, setHover] = useState(false);
  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minWidth: 0,
        background: p.cardFill,
        borderRadius: p.radius,
        padding: 12,
        border: `1px solid ${hover ? p.accent : p.lineColor}`,
        opacity: shown ? 1 : 0,
        transform: shown ? (hover ? "translateY(-6px)" : "none") : "translateY(48px)",
        transition: isStatic
          ? "none"
          : `opacity .9s ${EASE} ${shown && !hover ? i * 0.07 : 0}s, transform .9s ${EASE} ${shown && !hover ? i * 0.07 : 0}s, border-color .35s ease`,
      }}>
      <div
        style={{
          position: "relative",
          borderRadius: Math.max(0, p.radius - 6),
          overflow: "hidden",
          aspectRatio: String(p.imageRatio),
          background: "#0c0c0d",
        }}>
        {s.image?.src ? (
          <img
            src={s.image.src}
            srcSet={s.image.srcSet}
            alt={s.image.alt || s.title}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transform: hover ? "scale(1.06)" : "scale(1)",
              transition: `transform 1.1s ${EASE}`,
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse at 50% 85%, #222226 0%, #070708 70%)`,
            }}
          />
        )}
        {/* the gloss sweep: a soft bright band that crosses the photo once per hover */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: "-20%",
            background:
              "linear-gradient(105deg, transparent 40%, rgba(255,255,255,.28) 48%, rgba(255,255,255,.05) 52%, transparent 60%)",
            transform: hover ? "translateX(70%)" : "translateX(-70%)",
            transition: hover && !isStatic ? `transform 1s ${EASE}` : "none",
            pointerEvents: "none",
          }}
        />
        {s.badge ? (
          <span
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              padding: "6px 10px",
              borderRadius: 0,
              background: p.accent,
              color: "#fff",
              ...p.metaFont,
              textTransform: "uppercase" as const,
            }}>
            {s.badge}
          </span>
        ) : null}
        <span
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            padding: "8px 12px",
            borderRadius: 0,
            background: "rgba(8,8,9,.72)",
            color: p.textColor,
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            ...p.metaFont,
            fontSize: 10,
            textTransform: "uppercase" as const,
          }}>
          {s.duration}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "0 6px",
        }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 12,
          }}>
          <span
            style={{
              ...p.metaFont,
              textTransform: "uppercase" as const,
              color: p.textColor,
              fontWeight: 700,
            }}>
            {s.category}
          </span>
          {s.price && p.buttonLabel ? (
            <span
              style={{
                ...p.titleFont,
                color: p.textColor,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}>
              {s.price}
            </span>
          ) : null}
        </div>
        <h3
          style={{
            ...p.titleFont,
            color: hover ? p.accent : p.textColor,
            margin: 0,
            transition: "color .3s ease",
          }}>
          {s.title}
        </h3>
        <p style={{...p.bodyFont, color: p.mutedColor, margin: 0}}>{s.blurb}</p>
      </div>
      {p.buttonLabel ? (
        <a
          href={s.link || "#contact"}
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 12px 12px 18px",
            borderRadius: 0,
            background: hover ? p.accent : "transparent",
            border: `1px solid ${hover ? p.accent : p.lineColor}`,
            color: p.textColor,
            textDecoration: "none",
            transition: "background .3s ease, color .3s ease, border-color .3s ease",
            ...p.bodyFont,
            fontWeight: 600,
          }}>
          {p.buttonLabel}
          <span
            aria-hidden="true"
            style={{
              width: 30,
              height: 30,
              borderRadius: 0,
              display: "grid",
              placeItems: "center",
              background: hover ? "#0b0b0c" : p.accent,
              color: "#fff",
              transform: hover ? "rotate(-45deg)" : "none",
              transition: `transform .4s ${EASE}`,
            }}>
            →
          </span>
        </a>
      ) : null}
    </article>
  );
}

/**
 * Vanta Services — filterable service menu with prices and booking links.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 */
export default function VantaServices(props: Props) {
  const p = props;
  const list = p.services && p.services.length ? p.services : DEFAULT_SERVICES;
  const isStatic = useIsStaticRenderer();
  const reduce =
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(1200);
  const [cat, setCat] = useState("");
  const [shown, setShown] = useState(isStatic || reduce);
  const cats = useMemo(() => [...new Set(list.map((s) => s.category).filter(Boolean))], [list]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    if (isStatic || reduce) {
      setShown(true);
      return () => ro.disconnect();
    }
    // threshold 0 + bottom margin: a ratio threshold never fires when the grid is taller than the screen (10 cards stacked on a phone)
    const io = new IntersectionObserver(
      (es) => {
        if (es[0]?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      {threshold: 0, rootMargin: "0px 0px -15% 0px"},
    );
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, [isStatic, reduce]);

  const n = Math.max(1, w < 600 ? p.phoneColumns : w < 1000 ? p.tabletColumns : p.columns);
  const visible = cat ? list.filter((s) => s.category === cat) : list;
  const tab = (label: string, value: string) => {
    const on = cat === value;
    return (
      <button
        key={label}
        type="button"
        onClick={() => setCat(value)}
        aria-pressed={on}
        style={{
          ...p.metaFont,
          textTransform: "uppercase" as const,
          padding: "10px 16px",
          borderRadius: 0,
          cursor: "pointer",
          border: `1px solid ${on ? p.accent : p.lineColor}`,
          background: on ? p.accent : "transparent",
          color: p.textColor,
          transition: "background .3s ease, color .3s ease, border-color .3s ease",
        }}>
        {label}
      </button>
    );
  };
  return (
    <div
      ref={root}
      style={{
        ...p.style,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: p.gap * 1.4,
        background: p.background,
      }}>
      {cats.length > 1 ? (
        <div role="toolbar" aria-label="Filter services" style={{display: "flex", flexWrap: "wrap", gap: 8}}>
          {tab(p.allLabel, "")}
          {cats.map((c) => tab(c, c))}
        </div>
      ) : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
          gap: p.gap,
        }}>
        {visible.map((s, i) => (
          <Card key={s.title + i} s={s} i={i} p={p} shown={shown} isStatic={isStatic} />
        ))}
      </div>
    </div>
  );
}

const DEFAULT_SERVICES: Service[] = [
  {
    category: "Exterior",
    title: "Signature Wash",
    price: "$89",
    duration: "1.5 hrs",
    blurb: "Snow foam, two-bucket hand wash, wheels, tyres and a spray sealant that beads for weeks.",
    link: "#contact",
    badge: "",
  },
  {
    category: "Interior",
    title: "Interior Reset",
    price: "$149",
    duration: "3 hrs",
    blurb: "Vacuum, steam, leather clean and condition, glass and every vent and seam.",
    link: "#contact",
    badge: "",
  },
  {
    category: "Correction",
    title: "Paint Correction",
    price: "From $450",
    duration: "1–2 days",
    blurb: "Machine polishing that removes swirls and haze so the paint reads like a mirror again.",
    link: "#contact",
    badge: "Popular",
  },
  {
    category: "Protection",
    title: "Ceramic Coating",
    price: "From $890",
    duration: "2 days",
    blurb: "A hard, glossy layer that sheds water and dirt for years, applied after full correction.",
    link: "#contact",
    badge: "",
  },
  {
    category: "Protection",
    title: "Paint Protection Film",
    price: "Quote",
    duration: "2–3 days",
    blurb: "Clear film on the front end and high-impact areas to stop stone chips before they start.",
    link: "#contact",
    badge: "",
  },
  {
    category: "Fleet",
    title: "Fleet Program",
    price: "Quote",
    duration: "On site",
    blurb: "Scheduled washes and protection for work fleets, done at your depot.",
    link: "#contact",
    badge: "",
  },
];

VantaServices.defaultProps = {
  services: DEFAULT_SERVICES,
  allLabel: "All",
  buttonLabel: "Book this",
  columns: 3,
  tabletColumns: 2,
  phoneColumns: 1,
  gap: 16,
  radius: 20,
  imageRatio: 1.25,
  background: "rgba(0,0,0,0)",
  cardFill: "#121214",
  textColor: "#F4F1EC",
  mutedColor: "rgba(244,241,236,0.6)",
  accent: "#FF5A1F",
  lineColor: "rgba(244,241,236,0.12)",
};

addPropertyControls(VantaServices, {
  services: {
    type: ControlType.Array,
    title: "Services",
    maxCount: 18,
    control: {
      type: ControlType.Object,
      controls: {
        image: {type: ControlType.ResponsiveImage, title: "Image"},
        category: {
          type: ControlType.String,
          title: "Category",
          defaultValue: "Exterior",
          description: "Filter tabs are made from these.",
        },
        title: {
          type: ControlType.String,
          title: "Title",
          defaultValue: "Service",
        },
        price: {
          type: ControlType.String,
          title: "Price",
          defaultValue: "$99",
        },
        duration: {
          type: ControlType.String,
          title: "Duration",
          defaultValue: "2 hrs",
        },
        blurb: {
          type: ControlType.String,
          title: "Blurb",
          defaultValue: "",
          displayTextArea: true,
        },
        badge: {
          type: ControlType.String,
          title: "Badge",
          defaultValue: "",
        },
        link: {type: ControlType.Link, title: "Link"},
      },
    },
    defaultValue: DEFAULT_SERVICES,
  },
  allLabel: {
    type: ControlType.String,
    title: "All Tab",
    defaultValue: "All",
  },
  buttonLabel: {
    type: ControlType.String,
    title: "Button",
    defaultValue: "Book this",
  },
  columns: {
    type: ControlType.Number,
    title: "Columns",
    defaultValue: 3,
    min: 1,
    max: 5,
    step: 1,
    displayStepper: true,
  },
  tabletColumns: {
    type: ControlType.Number,
    title: "Tablet Cols",
    defaultValue: 2,
    min: 1,
    max: 4,
    step: 1,
    displayStepper: true,
  },
  phoneColumns: {
    type: ControlType.Number,
    title: "Phone Cols",
    defaultValue: 1,
    min: 1,
    max: 2,
    step: 1,
    displayStepper: true,
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
  imageRatio: {
    type: ControlType.Number,
    title: "Image Ratio",
    defaultValue: 1.25,
    min: 0.6,
    max: 2,
    step: 0.05,
    description: "Width ÷ height.",
  },
  background: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "rgba(0,0,0,0)",
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
    defaultValue: "rgba(244,241,236,0.6)",
  },
  accent: {
    type: ControlType.Color,
    title: "Accent",
    defaultValue: "#FF5A1F",
  },
  lineColor: {
    type: ControlType.Color,
    title: "Line",
    defaultValue: "rgba(244,241,236,0.12)",
  },
  titleFont: {
    type: ControlType.Font,
    title: "Title Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: {
      fontSize: 24,
      letterSpacing: "-0.01em",
      lineHeight: "1.15em",
    },
  },
  bodyFont: {
    type: ControlType.Font,
    title: "Body Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: {fontSize: 15, lineHeight: "1.55em"},
  },
  metaFont: {
    type: ControlType.Font,
    title: "Meta Font",
    controls: "extended",
    defaultFontType: "monospace",
    defaultValue: {
      fontSize: 11,
      letterSpacing: "0.14em",
      lineHeight: "1.2em",
    },
  },
});
