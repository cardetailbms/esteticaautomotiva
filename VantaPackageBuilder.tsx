import * as React from "react";
import {useEffect, useRef, useState} from "react";
import {addPropertyControls, ControlType, useIsStaticRenderer} from "framer";

// ---------------------------------------------------------------------------------------------------------------
// Vanta Package Builder — build a detail and watch the price add up, by Buster Studios.
// Pick a vehicle size (it scales every price), a package, then any extras. The total rolls to its new value like a
// trip meter, and the button links to your booking (e.g. #contact for a pop-up form).
// ---------------------------------------------------------------------------------------------------------------

type Size = {label: string; factor: number};
type Pack = {name: string; price: number; note: string; sizePrices?: string};
type Extra = {name: string; price: number};

interface Props {
  sizes: Size[];
  packages: Pack[];
  extras: Extra[];
  currency: string;
  sizeTitle: string;
  packageTitle: string;
  extrasTitle: string;
  totalLabel: string;
  buttonLabel: string;
  link: string;
  footnote: string;
  showSizes: boolean;
  showExtras: boolean;
  pricePrefix: string;
  radius: number;
  panel: string;
  textColor: string;
  mutedColor: string;
  accent: string;
  lineColor: string;
  headingFont: React.CSSProperties;
  bodyFont: React.CSSProperties;
  metaFont: React.CSSProperties;
  totalFont: React.CSSProperties;
  style?: React.CSSProperties;
}

const EASE = "cubic-bezier(.16,1,.3,1)";
const money = (c: string, v: number, pre = "") => pre + c + Math.round(v).toLocaleString("en-US");

// eases the shown total toward the real one, so changes roll rather than jump
function useRolling(target: number, still: boolean) {
  const [v, setV] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    if (still) {
      cur.current = target;
      setV(target);
      return;
    }
    let raf = 0;
    const from = cur.current,
      t0 = performance.now(),
      dur = 700;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur),
        e = 1 - Math.pow(1 - k, 4);
      cur.current = from + (target - from) * e;
      setV(cur.current);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, still]);
  return v;
}

/**
 * Vanta Package Builder — interactive price builder.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 */
export default function VantaPackageBuilder(props: Props) {
  const p = props;
  const sizes = p.sizes?.length ? p.sizes : DEFAULT_SIZES;
  const packs = p.packages?.length ? p.packages : DEFAULT_PACKS;
  const extras = p.extras?.length ? p.extras : DEFAULT_EXTRAS;
  const isStatic = useIsStaticRenderer();
  const reduce =
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(1200);
  const [size, setSize] = useState(Math.min(1, sizes.length - 1));
  const [pack, setPack] = useState(Math.min(1, packs.length - 1));
  const [picked, setPicked] = useState<number[]>([]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const f = sizes[Math.min(size, sizes.length - 1)]?.factor ?? 1;
  // a package can list exact prices per vehicle size ("99, 110, 121"); otherwise its price is multiplied by the size factor
  const priceOf = (k: Pack | undefined) => {
    if (!k) return 0;
    const exact = (k.sizePrices || "").split(",").map((x) => parseFloat(x.replace(/[^0-9.]/g, "")));
    const v = exact[Math.min(size, sizes.length - 1)];
    return Number.isFinite(v) ? v : k.price * f;
  };
  const total =
    priceOf(packs[Math.min(pack, packs.length - 1)]) +
    (p.showExtras ? picked.reduce((a, i) => a + (extras[i]?.price ?? 0), 0) : 0);
  const shown = useRolling(total, isStatic || reduce);
  const narrow = w < 820;
  const label = (t: string) => (
    <div
      style={{
        ...p.metaFont,
        textTransform: "uppercase" as const,
        color: p.mutedColor,
      }}>
      {t}
    </div>
  );
  const chip = (on: boolean): React.CSSProperties => ({
    cursor: "pointer",
    borderRadius: Math.max(8, p.radius - 6),
    border: `1px solid ${on ? p.accent : p.lineColor}`,
    background: on ? `color-mix(in srgb, ${p.accent} 14%, transparent)` : "transparent",
    color: p.textColor,
    transition: "border-color .3s ease, background .3s ease, transform .3s ease",
    textAlign: "left",
  });

  return (
    <div
      ref={root}
      style={{
        ...p.style,
        width: "100%",
        display: "grid",
        gridTemplateColumns: narrow ? "1fr" : "1.5fr 1fr",
        gap: 16,
      }}>
      <div
        style={{
          background: p.panel,
          borderRadius: p.radius,
          padding: narrow ? 20 : 32,
          display: "flex",
          flexDirection: "column",
          gap: 28,
          border: `1px solid ${p.lineColor}`,
        }}>
        {p.showSizes ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}>
            {label(`01 · ${p.sizeTitle}`)}
            <div
              role="radiogroup"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}>
              {sizes.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={size === i}
                  onClick={() => setSize(i)}
                  style={{
                    ...chip(size === i),
                    ...p.bodyFont,
                    padding: "12px 18px",
                    borderRadius: 999,
                    fontWeight: 600,
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}>
          {label(`${p.showSizes ? "02" : "01"} · ${p.packageTitle}`)}
          <div
            role="radiogroup"
            style={{
              display: "grid",
              gridTemplateColumns: narrow
                ? "1fr"
                : `repeat(${Math.min(packs.length > 3 && w < 1600 ? 2 : 4, packs.length)}, minmax(0,1fr))`,
              gap: 8,
            }}>
            {packs.map((k, i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={pack === i}
                onClick={() => setPack(i)}
                style={{
                  ...chip(pack === i),
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  transform: pack === i ? "translateY(-3px)" : "none",
                }}>
                <span
                  style={{
                    ...p.headingFont,
                    color: pack === i ? p.accent : p.textColor,
                  }}>
                  {k.name}
                </span>
                <span
                  style={{
                    ...p.metaFont,
                    textTransform: "uppercase" as const,
                    color: p.textColor,
                  }}>
                  {money(p.currency, priceOf(k), p.pricePrefix)}
                </span>
                <span
                  style={{
                    ...p.bodyFont,
                    color: p.mutedColor,
                  }}>
                  {k.note}
                </span>
              </button>
            ))}
          </div>
        </div>
        {p.showExtras ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}>
            {label(`${p.showSizes ? "03" : "02"} · ${p.extrasTitle}`)}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
                gap: 8,
              }}>
              {extras.map((x, i) => {
                const on = picked.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => setPicked((a) => (on ? a.filter((j) => j !== i) : [...a, i]))}
                    style={{
                      ...chip(on),
                      ...p.bodyFont,
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 20,
                        height: 20,
                        flex: "none",
                        borderRadius: 6,
                        border: `1.5px solid ${on ? p.accent : p.lineColor}`,
                        background: on ? p.accent : "transparent",
                        display: "grid",
                        placeItems: "center",
                        color: "#0b0b0c",
                        fontSize: 13,
                        transition: "background .25s ease",
                      }}>
                      {on ? "✓" : ""}
                    </span>
                    <span style={{flex: 1}}>{x.name}</span>
                    <span
                      style={{
                        ...p.metaFont,
                        textTransform: "uppercase" as const,
                        color: p.mutedColor,
                      }}>
                      +{money(p.currency, x.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      <div
        style={{
          background: p.accent,
          color: "#0b0b0c",
          borderRadius: p.radius,
          padding: narrow ? 24 : 36,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 28,
          minHeight: narrow ? 0 : 360,
          position: "relative",
          overflow: "hidden",
        }}>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: -60,
            bottom: -60,
            width: 260,
            height: 260,
            borderRadius: "50%",
            border: "28px solid rgba(11,11,12,.08)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            position: "relative",
          }}>
          <div
            style={{
              ...p.metaFont,
              textTransform: "uppercase" as const,
            }}>
            {p.totalLabel}
          </div>
          <div
            aria-live="polite"
            style={{
              ...p.totalFont,
              fontSize: narrow
                ? Math.min(parseFloat(String(p.totalFont?.fontSize ?? 88)) || 88, w * 0.15)
                : p.totalFont?.fontSize,
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
            }}>
            {money(p.currency, shown, p.pricePrefix)}
          </div>
          <div
            style={{
              ...p.bodyFont,
              opacity: 0.75,
            }}>{`${p.showSizes ? `${sizes[size]?.label ?? ""} · ` : ""}${packs[pack]?.name ?? ""}${p.showExtras && picked.length ? ` · ${picked.length} extra${picked.length > 1 ? "s" : ""}` : ""}`}</div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            position: "relative",
          }}>
          <a
            href={p.link || "#contact"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 10px 10px 22px",
              borderRadius: 999,
              background: "#0b0b0c",
              color: "#F4F1EC",
              textDecoration: "none",
              ...p.bodyFont,
              fontWeight: 600,
              transition: `transform .4s ${EASE}`,
            }}>
            {p.buttonLabel}
            <span
              aria-hidden="true"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: p.accent,
                color: "#0b0b0c",
                display: "grid",
                placeItems: "center",
              }}>
              →
            </span>
          </a>
          {p.footnote ? (
            <div
              style={{
                ...p.bodyFont,
                fontSize: 12,
                opacity: 0.7,
              }}>
              {p.footnote}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const DEFAULT_SIZES: Size[] = [
  {label: "Hatch / Coupe", factor: 0.9},
  {label: "Sedan / Wagon", factor: 1},
  {label: "SUV / Ute", factor: 1.2},
  {label: "Van / 7-seat", factor: 1.4},
];
const DEFAULT_PACKS: Pack[] = [
  {
    name: "Refresh",
    price: 149,
    note: "Hand wash, interior vacuum and wipe-down, glass.",
  },
  {
    name: "Showroom",
    price: 349,
    note: "Full decon, one-step polish, sealant and a deep interior.",
  },
  {
    name: "Concours",
    price: 890,
    note: "Multi-stage correction and a 3-year ceramic coating.",
  },
];
const DEFAULT_EXTRAS: Extra[] = [
  {name: "Engine bay detail", price: 79},
  {name: "Pet hair removal", price: 59},
  {name: "Headlight restore", price: 99},
  {name: "Wheels-off clean", price: 129},
];

VantaPackageBuilder.defaultProps = {
  sizes: DEFAULT_SIZES,
  packages: DEFAULT_PACKS,
  extras: DEFAULT_EXTRAS,
  currency: "$",
  sizeTitle: "Your vehicle",
  packageTitle: "Package",
  extrasTitle: "Extras",
  totalLabel: "Your estimate",
  buttonLabel: "Book this detail",
  link: "#contact",
  footnote: "Estimate only. Final price confirmed after we see the car.",
  showSizes: true,
  showExtras: true,
  pricePrefix: "",
  radius: 22,
  panel: "#121214",
  textColor: "#F4F1EC",
  mutedColor: "rgba(244,241,236,0.6)",
  accent: "#FF5A1F",
  lineColor: "rgba(244,241,236,0.12)",
};

addPropertyControls(VantaPackageBuilder, {
  sizes: {
    type: ControlType.Array,
    title: "Vehicle Sizes",
    maxCount: 6,
    control: {
      type: ControlType.Object,
      controls: {
        label: {
          type: ControlType.String,
          title: "Label",
          defaultValue: "Sedan",
        },
        factor: {
          type: ControlType.Number,
          title: "Price ×",
          defaultValue: 1,
          min: 0.5,
          max: 3,
          step: 0.05,
          description: "Multiplies the package price.",
        },
      },
    },
    defaultValue: DEFAULT_SIZES,
  },
  packages: {
    type: ControlType.Array,
    title: "Packages",
    maxCount: 6,
    control: {
      type: ControlType.Object,
      controls: {
        name: {
          type: ControlType.String,
          title: "Name",
          defaultValue: "Package",
        },
        price: {
          type: ControlType.Number,
          title: "Price",
          defaultValue: 199,
          min: 0,
          max: 20000,
          step: 1,
        },
        note: {
          type: ControlType.String,
          title: "Includes",
          defaultValue: "",
          displayTextArea: true,
        },
        sizePrices: {
          type: ControlType.String,
          title: "Size Prices",
          defaultValue: "",
          placeholder: "99, 110, 121",
          description: "Optional exact price for each vehicle size, in order. Overrides Price ×.",
        },
      },
    },
    defaultValue: DEFAULT_PACKS,
  },
  extras: {
    type: ControlType.Array,
    title: "Extras",
    maxCount: 10,
    control: {
      type: ControlType.Object,
      controls: {
        name: {
          type: ControlType.String,
          title: "Name",
          defaultValue: "Extra",
        },
        price: {
          type: ControlType.Number,
          title: "Price",
          defaultValue: 49,
          min: 0,
          max: 5000,
          step: 1,
        },
      },
    },
    defaultValue: DEFAULT_EXTRAS,
  },
  currency: {
    type: ControlType.String,
    title: "Currency",
    defaultValue: "$",
  },
  sizeTitle: {
    type: ControlType.String,
    title: "Step 1",
    defaultValue: "Your vehicle",
  },
  packageTitle: {
    type: ControlType.String,
    title: "Step 2",
    defaultValue: "Package",
  },
  extrasTitle: {
    type: ControlType.String,
    title: "Step 3",
    defaultValue: "Extras",
  },
  totalLabel: {
    type: ControlType.String,
    title: "Total Label",
    defaultValue: "Your estimate",
  },
  buttonLabel: {
    type: ControlType.String,
    title: "Button",
    defaultValue: "Book this detail",
  },
  link: {type: ControlType.Link, title: "Link"},
  footnote: {
    type: ControlType.String,
    title: "Footnote",
    defaultValue: "Estimate only. Final price confirmed after we see the car.",
  },
  showSizes: {
    type: ControlType.Boolean,
    title: "Size Step",
    defaultValue: true,
  },
  showExtras: {
    type: ControlType.Boolean,
    title: "Extras Step",
    defaultValue: true,
  },
  pricePrefix: {
    type: ControlType.String,
    title: "Price Prefix",
    defaultValue: "",
    description: "e.g. From ",
  },
  radius: {
    type: ControlType.Number,
    title: "Radius",
    defaultValue: 22,
    min: 0,
    max: 40,
    unit: "px",
  },
  panel: {type: ControlType.Color, title: "Panel", defaultValue: "#121214"},
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
  headingFont: {
    type: ControlType.Font,
    title: "Heading Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: {
      fontSize: 22,
      letterSpacing: "-0.01em",
      lineHeight: "1.1em",
    },
  },
  bodyFont: {
    type: ControlType.Font,
    title: "Body Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: {fontSize: 15, lineHeight: "1.5em"},
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
  totalFont: {
    type: ControlType.Font,
    title: "Total Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: {
      fontSize: 88,
      letterSpacing: "-0.04em",
      lineHeight: "1em",
    },
  },
});
