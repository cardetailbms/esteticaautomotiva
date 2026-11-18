import * as React from "react";
import {useEffect, useRef, useState} from "react";
import {addPropertyControls, ControlType, RenderTarget} from "framer";

// ---------------------------------------------------------------------------------------------------------------
// Kinetic Nav — a discreet navigation bar with animated link text, by Buster Studios.
// Links roll, scramble or slide on hover/focus. The bar slides away as you scroll down and returns when you scroll
// up, frosting over content. Below the breakpoint it becomes a menu button that opens a full-screen menu with a
// staggered reveal. Links to "#contact" (etc.) still work with Kinetic Pop-up and Kinetic Smooth Scroll.
// ---------------------------------------------------------------------------------------------------------------

type Effect = "Roll" | "Scramble" | "Slide";
type Item = {label: string; link: string; newTab?: boolean};

interface Props {
  logo: string;
  logoImage?: {src: string; alt?: string};
  logoMark: string;
  items: Item[];
  effect: Effect;
  hideOnScroll: boolean;
  frost: boolean;
  barColor: string;
  textColor: string;
  accent: string;
  barHeight: number;
  gutter: number;
  gap: number;
  collapseAt: number;
  logoFont: React.CSSProperties;
  font: React.CSSProperties;
  menuFont: React.CSSProperties;
  menuColor: string;
  style?: React.CSSProperties;
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/_+";
const EASE = "cubic-bezier(.65,0,.15,1)";

function Scramble({text, active, reduce}: {text: string; active: boolean; reduce: boolean}) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (!active || reduce) {
      setOut(text);
      return;
    }
    let frame = 0,
      raf = 0;
    const total = text.length * 2 + 6;
    const tick = () => {
      frame++;
      const done = Math.floor((frame / total) * text.length);
      setOut(
        text
          .split("")
          .map((c, i) => (c === " " || i < done ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
          .join(""),
      );
      if (frame < total) raf = requestAnimationFrame(tick);
      else setOut(text);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, text, reduce]);
  return <span aria-hidden="true">{out}</span>;
}

function LinkText({
  text,
  effect,
  active,
  accent,
  reduce,
}: {
  text: string;
  effect: Effect;
  active: boolean;
  accent: string;
  reduce: boolean;
}) {
  if (effect === "Scramble")
    return (
      <>
        <span style={srOnly}>{text}</span>
        <Scramble text={text} active={active} reduce={reduce} />
      </>
    );
  if (effect === "Slide") {
    return (
      <span style={{position: "relative", display: "inline-block"}}>
        {text}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -3,
            height: 1.5,
            background: accent,
            transform: `scaleX(${active ? 1 : 0})`,
            transformOrigin: active ? "left" : "right",
            transition: reduce ? "none" : `transform .45s ${EASE}`,
          }}
        />
      </span>
    );
  }
  // Roll: each letter rolls up to a copy of itself, staggered
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        overflow: "hidden",
        height: "1.2em",
        lineHeight: "1.2em",
        verticalAlign: "top",
      }}>
      <span style={srOnly}>{text}</span>
      {text.split("").map((c, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            display: "inline-flex",
            flexDirection: "column",
            lineHeight: "1.2em",
            transform: active ? "translateY(-50%)" : "none",
            transition: reduce ? "none" : `transform .5s ${EASE} ${i * 0.022}s`,
          }}>
          <span>{c === " " ? " " : c}</span>
          <span style={{color: accent}}>{c === " " ? " " : c}</span>
        </span>
      ))}
    </span>
  );
}

/**
 * Kinetic Nav — discreet nav bar with rolling / scrambling link text and a full-screen phone menu.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 */
export default function KineticNav(props: Props) {
  const {
    logo,
    logoImage,
    logoMark,
    items,
    effect,
    hideOnScroll,
    frost,
    barColor,
    textColor,
    accent,
    barHeight: height,
    gutter,
    gap,
    collapseAt,
    logoFont,
    font,
    menuFont,
    menuColor,
  } = props;
  const onCanvas = RenderTarget.current() === RenderTarget.canvas;
  const reduce =
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const box = useRef<HTMLElement>(null);
  const [w, setW] = useState(1200);
  const [measured, setMeasured] = useState(false); // until measured (server render + first paint), a CSS media query picks links vs menu button, so phones never flash the desktop links
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hover, setHover] = useState(-1);
  const [open, setOpen] = useState(false);
  const compact = w < collapseAt;
  const touch = typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(hover: none)").matches;
  const blur = frost && !touch; // live backdrop blur is costly while scrolling on phones

  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    setMeasured(true);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (onCanvas || typeof window === "undefined") return;
    let last = window.scrollY,
      raf = 0;
    const read = () => {
      raf = 0;
      const y = window.scrollY;
      setScrolled(y > 8);
      if (hideOnScroll && Math.abs(y - last) > 6) {
        setHidden(y > last && y > height * 2);
        last = y;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    window.addEventListener("scroll", onScroll, {passive: true});
    read();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [onCanvas, hideOnScroll, height]);

  // phone menu: lock scroll, Escape closes, close when a link is followed
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent("kinetic-scroll", {detail: "stop"}));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prev;
      window.dispatchEvent(new CustomEvent("kinetic-scroll", {detail: "start"}));
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  useEffect(() => {
    if (!compact) setOpen(false);
  }, [compact]);

  const showBar = !hidden || open;
  const list = (items && items.length ? items : DEFAULT_ITEMS).map((it, i) => ({
    ...it,
    link: it.link || (DEFAULT_ITEMS[i] && DEFAULT_ITEMS[i].label === it.label ? DEFAULT_ITEMS[i].link : ""),
  }));
  const logoEl =
    logoImage && logoImage.src ? (
      <img
        src={logoImage.src}
        alt={logoImage.alt || logo}
        style={{
          height: Math.round(height * 0.42),
          width: "auto",
          display: "block",
        }}
      />
    ) : (
      <span
        style={{
          ...logoFont,
          color: textColor,
          display: "inline-flex",
          alignItems: "flex-start",
          gap: 2,
          whiteSpace: "nowrap",
        }}>
        {logo}
        {logoMark ? (
          <sup
            style={{
              fontSize: "0.5em",
              color: accent,
              lineHeight: 1,
            }}>
            {logoMark}
          </sup>
        ) : null}
      </span>
    );

  return (
    <header
      ref={box}
      style={{
        ...props.style,
        position: "relative",
        width: "100%",
        height,
        zIndex: 50,
        color: textColor,
      }}>
      <style>{`.knav a:focus-visible,.knav button:focus-visible{outline:1.5px solid ${accent};outline-offset:4px;border-radius:4px}@media (max-width:${collapseAt - 1}px){.knav-pre-links{display:none!important}}@media (min-width:${collapseAt}px){.knav-pre-burger{display:none!important}}`}</style>
      <div
        className="knav"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `0 ${gutter}px`,
          boxSizing: "border-box",
          background: scrolled || open ? barColor : "transparent",
          backdropFilter: blur && (scrolled || open) ? "blur(16px) saturate(140%)" : undefined,
          WebkitBackdropFilter: blur && (scrolled || open) ? "blur(16px) saturate(140%)" : undefined,
          transform: showBar ? "none" : "translateY(-110%)",
          transition: reduce ? "none" : `transform .6s ${EASE}, background-color .4s ease`,
        }}>
        <a
          href="/"
          aria-label={`${logo} home`}
          style={{
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            position: "relative",
            zIndex: 2,
          }}>
          {logoEl}
        </a>
        {!measured || !compact ? (
          <nav
            aria-label="Main"
            className={measured ? undefined : "knav-pre-links"}
            style={{display: "flex", alignItems: "center", gap}}>
            {list.map((it, i) => (
              <a
                key={i}
                href={it.link || "#"}
                target={it.newTab ? "_blank" : undefined}
                rel={it.newTab ? "noopener noreferrer" : undefined}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(-1)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(-1)}
                style={{
                  ...font,
                  color: textColor,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}>
                <LinkText text={it.label} effect={effect} active={hover === i} accent={accent} reduce={reduce} />
              </a>
            ))}
          </nav>
        ) : null}
        {!measured || compact ? (
          <button
            type="button"
            className={measured ? undefined : "knav-pre-burger"}
            aria-expanded={open}
            aria-controls="knav-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
            style={{
              position: "relative",
              zIndex: 2,
              width: 44,
              height: 44,
              marginRight: -10,
              border: 0,
              background: "transparent",
              color: textColor,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}>
            <span
              aria-hidden="true"
              style={{
                position: "relative",
                width: 22,
                height: 10,
              }}>
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: open ? 4 : 0,
                  height: 1.6,
                  background: "currentColor",
                  transform: open ? "rotate(45deg)" : "none",
                  transition: `all .4s ${EASE}`,
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: open ? 0 : 6,
                  top: open ? 4 : 8,
                  height: 1.6,
                  background: "currentColor",
                  transform: open ? "rotate(-45deg)" : "none",
                  transition: `all .4s ${EASE}`,
                }}
              />
            </span>
          </button>
        ) : null}
      </div>
      {measured && compact ? (
        <div
          id="knav-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          aria-hidden={!open}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1,
            background: menuColor,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: `${height + 24}px ${gutter}px ${gutter + 16}px`,
            boxSizing: "border-box",
            clipPath: open ? "inset(0 0 0 0)" : "inset(0 0 100% 0)",
            visibility: open ? "visible" : "hidden",
            transition: reduce ? "none" : `clip-path .7s ${EASE}, visibility 0s linear ${open ? 0 : 0.7}s`,
          }}>
          <nav
            aria-label="Mobile"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}>
            {list.map((it, i) => (
              <a
                key={i}
                href={it.link || "#"}
                tabIndex={open ? 0 : -1}
                target={it.newTab ? "_blank" : undefined}
                rel={it.newTab ? "noopener noreferrer" : undefined}
                onClick={() => setOpen(false)}
                style={{
                  ...menuFont,
                  color: textColor,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "baseline",
                  gap: 14,
                  overflow: "hidden",
                  borderTop: `1px solid ${textColor}22`,
                  paddingTop: 10,
                }}>
                <span
                  style={{
                    fontFamily: "'Geist Mono', ui-monospace, monospace",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    color: accent,
                    transform: open ? "none" : "translateY(120%)",
                    transition: reduce ? "none" : `transform .7s ${EASE} ${0.15 + i * 0.06}s`,
                  }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  style={{
                    display: "inline-block",
                    transform: open ? "none" : "translateY(110%)",
                    transition: reduce ? "none" : `transform .8s ${EASE} ${0.12 + i * 0.06}s`,
                  }}>
                  {it.label}
                </span>
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

const srOnly: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};
const DEFAULT_ITEMS: Item[] = [
  {label: "Work", link: "/work"},
  {label: "Robots", link: "/robots"},
  {label: "Studio", link: "/studio"},
  {label: "Contact", link: "#contact"},
];

KineticNav.defaultProps = {
  logo: "KYBRE",
  logoMark: "®",
  items: DEFAULT_ITEMS,
  effect: "Roll",
  hideOnScroll: true,
  frost: true,
  barColor: "rgba(14,15,17,0.55)",
  textColor: "#EDEAE4",
  accent: "#FF5A1F",
  barHeight: 64,
  gutter: 32,
  gap: 40,
  collapseAt: 810,
  menuColor: "#0E0F11",
};

addPropertyControls(KineticNav, {
  logo: {type: ControlType.String, title: "Logo", defaultValue: "KYBRE"},
  logoMark: {
    type: ControlType.String,
    title: "Logo Mark",
    defaultValue: "®",
    description: "Small superscript after the logo. Leave empty for none.",
  },
  logoImage: {
    type: ControlType.ResponsiveImage,
    title: "Logo Image",
    description: "Optional. Replaces the text logo.",
  },
  items: {
    type: ControlType.Array,
    title: "Links",
    maxCount: 8,
    control: {
      type: ControlType.Object,
      controls: {
        label: {
          type: ControlType.String,
          title: "Label",
          defaultValue: "Link",
        },
        link: {type: ControlType.Link, title: "Link"},
        newTab: {
          type: ControlType.Boolean,
          title: "New Tab",
          defaultValue: false,
        },
      },
    },
    defaultValue: DEFAULT_ITEMS,
  },
  effect: {
    type: ControlType.Enum,
    title: "Hover",
    options: ["Roll", "Scramble", "Slide"],
    defaultValue: "Roll",
    displaySegmentedControl: true,
  },
  hideOnScroll: {
    type: ControlType.Boolean,
    title: "Hide on Scroll",
    defaultValue: true,
    description: "Slides away scrolling down, returns scrolling up. Make the nav Fixed/Sticky in Framer.",
  },
  frost: {type: ControlType.Boolean, title: "Frosted", defaultValue: true},
  barColor: {
    type: ControlType.Color,
    title: "Bar (scrolled)",
    defaultValue: "rgba(14,15,17,0.55)",
  },
  textColor: {
    type: ControlType.Color,
    title: "Text",
    defaultValue: "#EDEAE4",
  },
  accent: {
    type: ControlType.Color,
    title: "Accent",
    defaultValue: "#FF5A1F",
  },
  barHeight: {
    type: ControlType.Number,
    title: "Height",
    defaultValue: 64,
    min: 40,
    max: 120,
    unit: "px",
  },
  gutter: {
    type: ControlType.Number,
    title: "Side Padding",
    defaultValue: 32,
    min: 0,
    max: 120,
    unit: "px",
  },
  gap: {
    type: ControlType.Number,
    title: "Link Gap",
    defaultValue: 40,
    min: 8,
    max: 120,
    unit: "px",
  },
  collapseAt: {
    type: ControlType.Number,
    title: "Menu Below",
    defaultValue: 810,
    min: 0,
    max: 1600,
    step: 10,
    unit: "px",
    description: "Below this width the links become a menu button.",
  },
  logoFont: {
    type: ControlType.Font,
    title: "Logo Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: {fontSize: 18, letterSpacing: "0.32em"},
  },
  font: {
    type: ControlType.Font,
    title: "Link Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: {fontSize: 14},
  },
  menuFont: {
    type: ControlType.Font,
    title: "Menu Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: {
      fontSize: 44,
      lineHeight: "1.1em",
      letterSpacing: "-0.03em",
    },
  },
  menuColor: {
    type: ControlType.Color,
    title: "Menu Background",
    defaultValue: "#0E0F11",
  },
});
