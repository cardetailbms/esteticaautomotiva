import * as React from "react";
import {useCallback, useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {addPropertyControls, ControlType, RenderTarget} from "framer";

// ---------------------------------------------------------------------------------------------------------------
// Kinetic Pop-up — a button that opens any Framer layer (e.g. a native Framer Form) in a full-screen pop-up,
// by Buster Studios. The pop-up content is a slot, so forms keep Framer's own Send To (email, Sheets, webhooks).
// Opens from: its own trigger button, any link to "#<Link ID>" anywhere on the page (e.g. a nav item), or
//   window.dispatchEvent(new CustomEvent("kinetic-popup", { detail: { id: "contact", open: true } }))
// Closes with the close button, Escape, a click outside, or the browser Back button. Focus is trapped inside
// while open and handed back afterwards; page scroll is locked (and Kinetic Smooth Scroll paused).
// ---------------------------------------------------------------------------------------------------------------

type Motion = "Rise" | "Scale" | "Drop" | "Fade";

interface Props {
  content?: React.ReactNode;
  trigger?: React.ReactNode;
  label: string;
  linkId: string;
  motion: Motion;
  duration: number;
  maxWidth: number;
  radius: number;
  padding: number;
  cardColor: string;
  backdropColor: string;
  blur: number;
  closeColor: string;
  showButton: boolean;
  buttonColor: string;
  buttonText: string;
  font: React.CSSProperties;
  animateContent: boolean;
  accent: string;
  style?: React.CSSProperties;
}

const SPRING = "cubic-bezier(.2,.9,.25,1.12)";
const OUT = "cubic-bezier(.4,0,.2,1)";
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function hiddenTransform(m: Motion) {
  if (m === "Scale") return "scale(.9)";
  if (m === "Drop") return "translateY(-48px) scale(.98)";
  if (m === "Fade") return "none";
  return "translateY(56px) scale(.98)";
}

let uid = 0;
// Framer passes an empty array for an unconnected slot, so test for real content
const filled = (n: React.ReactNode) => (Array.isArray(n) ? n.length > 0 : !!n);
// slot layers arrive with their canvas position/size; put them in normal flow, full width, natural height
function inFlow(n: React.ReactNode, fill: boolean): React.ReactNode {
  return React.Children.map(n, (child) => {
    if (!React.isValidElement<{style?: React.CSSProperties}>(child)) return child;
    const st = child.props.style || {};
    return React.cloneElement(child, {
      style: {
        ...st,
        position: "relative",
        left: "auto",
        top: "auto",
        right: "auto",
        bottom: "auto",
        transform: "none",
        ...(fill ? {width: "100%", height: "auto"} : {}),
      },
    });
  });
}

/**
 * Kinetic Pop-up — open any layer (like a Framer Form) in a smooth pop-up.
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function KineticPopup(props: Props) {
  const {
    content,
    trigger,
    label,
    linkId,
    motion,
    duration,
    maxWidth: width,
    radius,
    padding,
    cardColor,
    backdropColor,
    blur,
    closeColor,
    showButton,
    buttonColor,
    buttonText,
    font,
    animateContent,
    accent,
  } = props;
  const onCanvas = RenderTarget.current() === RenderTarget.canvas;
  const [mounted, setMounted] = useState(false); // in the DOM
  const [shown, setShown] = useState(false); // animated in
  const card = useRef<HTMLDivElement>(null);
  const self = useRef<HTMLDivElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const titleId = useRef(`kpop-${++uid}`);
  const reduce =
    typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ms = reduce ? 0 : Math.max(0, duration * 1000);
  const id = (linkId || "").replace(/^#/, "").trim();

  const open = useCallback(() => {
    if (typeof document === "undefined") return;
    // Framer scopes each layer's CSS under the page root, so slotted layers (e.g. a Form) only get their styles
    // inside it: portal to the top-most ancestor below <body> / #main rather than to <body> itself.
    let t: HTMLElement | null = self.current;
    while (t && t.parentElement && t.parentElement !== document.body && t.parentElement.id !== "main")
      t = t.parentElement;
    setHost(t && t !== self.current ? t : document.body);
    returnTo.current = document.activeElement as HTMLElement | null;
    setMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
  }, []);
  const close = useCallback(() => {
    setShown(false);
    window.setTimeout(() => setMounted(false), ms);
  }, [ms]);

  // open from "#id" links and from the global event
  useEffect(() => {
    if (onCanvas || !id) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (href === `#${id}` || href.endsWith(`/#${id}`) || href.endsWith(`#${id}`)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        open();
      }
    };
    const onEvent = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d && d.id === id) d.open === false ? close() : open();
    };
    // window capture phase: claim "#id" links before Framer's hash-link router or Kinetic Smooth Scroll see them
    window.addEventListener("click", onClick, true);
    window.addEventListener("kinetic-popup", onEvent);
    if (location.hash === `#${id}`) open();
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("kinetic-popup", onEvent);
    };
  }, [onCanvas, id, open, close]);

  // while open: lock scroll, pause smooth scroll, trap focus, Escape / Back to close
  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    const prev = {
      overflow: html.style.overflow,
      pad: html.style.paddingRight,
    };
    const bar = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    if (bar > 0) html.style.paddingRight = `${bar}px`;
    window.dispatchEvent(new CustomEvent("kinetic-scroll", {detail: "stop"}));
    history.pushState({kineticPopup: titleId.current}, "");
    const first = window.setTimeout(() => {
      const el = card.current?.querySelector<HTMLElement>(FOCUSABLE);
      (el || card.current)?.focus({preventScroll: true});
    }, 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        history.back();
      }
      if (e.key !== "Tab" || !card.current) return;
      const items = Array.from(card.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null,
      );
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const a = items[0],
        z = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };
    const onPop = () => close();
    document.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => {
      window.clearTimeout(first);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      html.style.overflow = prev.overflow;
      html.style.paddingRight = prev.pad;
      window.dispatchEvent(new CustomEvent("kinetic-scroll", {detail: "start"}));
      if (history.state && history.state.kineticPopup === titleId.current) history.back();
      const r = returnTo.current;
      if (r && r.isConnected) r.focus({preventScroll: true});
    };
  }, [mounted, close]);

  const requestClose = () => {
    if (history.state && history.state.kineticPopup === titleId.current) history.back();
    else close();
  };

  const btn = filled(trigger) ? (
    <div
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      aria-expanded={mounted}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      style={{display: "inline-flex", cursor: "pointer"}}>
      {inFlow(trigger, false)}
    </div>
  ) : (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={mounted}
      onClick={open}
      className="kpop-btn"
      style={{
        ...font,
        appearance: "none",
        border: 0,
        cursor: "pointer",
        padding: "8px 8px 8px 24px",
        borderRadius: 999,
        background: buttonColor,
        color: buttonText,
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
      }}>
      <span className="kpop-lbl">{label}</span>
      <span
        aria-hidden="true"
        className="kpop-arr"
        style={{
          width: 38,
          height: 38,
          borderRadius: 999,
          background: buttonText,
          color: buttonColor,
          display: "grid",
          placeItems: "center",
        }}>
        <svg width="15" height="15" viewBox="0 0 16 16">
          <path
            d="M2 8h11M9 4l4 4-4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );

  // canvas: show the button plus a small preview of the card so it can be styled
  if (onCanvas) {
    return (
      <div
        style={{
          ...props.style,
          display: "inline-flex",
          flexDirection: "column",
          gap: 12,
          alignItems: "flex-start",
        }}>
        {showButton ? btn : null}
        <div
          style={{
            width: Math.min(width, 520),
            maxWidth: "100%",
            background: cardColor,
            borderRadius: radius,
            padding: Math.min(padding, 32),
            boxShadow: "0 30px 80px -30px rgba(0,0,0,.45)",
            font: "500 12px/1.4 Inter, system-ui, sans-serif",
            color: closeColor,
          }}>
          {filled(content) ? (
            inFlow(content, true)
          ) : (
            <span style={{opacity: 0.6}}>Connect a layer (e.g. a Form) to Content →</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={self}
      style={{
        ...props.style,
        display: showButton ? "inline-flex" : "contents",
      }}>
      {showButton && !filled(trigger) && !reduce ? (
        <style>{`.kpop-btn{transition:transform .55s cubic-bezier(.22,1,.36,1),box-shadow .55s ease}.kpop-btn:hover{transform:translateY(-3px) scale(1.03);box-shadow:0 18px 40px -14px ${buttonColor}}.kpop-btn:active{transform:scale(.97)}.kpop-btn .kpop-arr{transition:transform .6s cubic-bezier(.22,1,.36,1)}.kpop-btn:hover .kpop-arr{transform:rotate(-45deg) scale(1.08)}.kpop-btn .kpop-lbl{transition:letter-spacing .5s ease}.kpop-btn:hover .kpop-lbl{letter-spacing:.03em}`}</style>
      ) : null}
      {showButton ? btn : null}
      {mounted && typeof document !== "undefined"
        ? createPortal(
            <div
              role="presentation"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) requestClose();
              }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147482000,
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr)",
                placeItems: "center",
                padding: "max(16px, 4vh) 16px",
                overflowY: "auto",
                overscrollBehavior: "contain",
                background: backdropColor,
                backdropFilter: blur ? `blur(${blur}px)` : undefined,
                WebkitBackdropFilter: blur ? `blur(${blur}px)` : undefined,
                opacity: shown ? 1 : 0,
                transition: `opacity ${ms * 0.6}ms ${OUT}`,
              }}>
              <style>
                {`.kpop-close:focus-visible,.kpop-btn:focus-visible{outline:2px solid currentColor;outline-offset:3px}.kpop-slot>*,.kpop-slot>*>*{position:relative!important;inset:auto!important;transform:none!important;width:100%!important;height:auto!important;max-width:none!important}` +
                  (animateContent && !reduce
                    ? `
@keyframes kpopUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}
@keyframes kpopSide{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:none}}
.kpop-on .kpop-slot>*>*>:not(input){animation:kpopSide .9s cubic-bezier(.22,1,.36,1) both}
.kpop-on .kpop-slot>*>*>:not(input):nth-child(2){animation-delay:.08s}.kpop-on .kpop-slot>*>*>:not(input):nth-child(3){animation-delay:.16s}
.kpop-on .kpop-slot form>:not(input){animation:kpopUp .8s cubic-bezier(.22,1,.36,1) both}
.kpop-on .kpop-slot form>:not(input):nth-child(1){animation-delay:.22s}.kpop-on .kpop-slot form>:not(input):nth-child(2){animation-delay:.3s}.kpop-on .kpop-slot form>:not(input):nth-child(3){animation-delay:.38s}.kpop-on .kpop-slot form>:not(input):nth-child(4){animation-delay:.46s}.kpop-on .kpop-slot form>:not(input):nth-child(5){animation-delay:.54s}
.kpop-slot input,.kpop-slot textarea,.kpop-slot select{transition:box-shadow .35s ease,transform .35s cubic-bezier(.22,1,.36,1),background-color .35s ease!important}
.kpop-slot input:hover,.kpop-slot textarea:hover{transform:translateY(-1px)}
.kpop-slot input:focus,.kpop-slot textarea:focus{transform:translateY(-2px);box-shadow:0 0 0 4px ${accent}33,0 12px 30px -16px ${accent}}
.kpop-slot form button{transition:transform .5s cubic-bezier(.22,1,.36,1),box-shadow .5s ease,filter .3s ease!important}
.kpop-slot form button:hover{transform:translateY(-3px) scale(1.03)!important;box-shadow:0 18px 40px -14px ${accent}}
.kpop-slot form button:active{transform:translateY(0) scale(.97)!important}
.kpop-slot form button>*{transition:transform .6s cubic-bezier(.22,1,.36,1),letter-spacing .5s ease!important}
.kpop-slot form button:hover>:first-child{letter-spacing:.04em}
.kpop-slot form button:hover>:last-child{transform:translateX(4px) rotate(-45deg) scale(1.08)}`
                    : "")}
              </style>
              <div
                ref={card}
                role="dialog"
                aria-modal="true"
                aria-label={label || "Dialog"}
                tabIndex={-1}
                className={shown ? "kpop-on" : undefined}
                style={{
                  position: "relative",
                  width: "100%",
                  minWidth: 0,
                  maxWidth: width,
                  background: cardColor,
                  borderRadius: radius,
                  padding: `clamp(20px, 6vw, ${padding}px)`,
                  boxSizing: "border-box",
                  outline: "none", // the grid track + padding can never push the card wider than the screen
                  boxShadow: "0 40px 120px -40px rgba(0,0,0,.6)",
                  transform: shown ? "none" : hiddenTransform(motion),
                  opacity: shown ? 1 : 0,
                  transition: shown
                    ? `transform ${ms}ms ${SPRING}, opacity ${ms * 0.5}ms ${OUT}`
                    : `transform ${ms * 0.6}ms ${OUT}, opacity ${ms * 0.5}ms ${OUT}`,
                }}>
                <button
                  type="button"
                  className="kpop-close"
                  aria-label="Close"
                  onClick={requestClose}
                  style={{
                    position: "absolute",
                    top: Math.max(10, padding * 0.35),
                    right: Math.max(10, padding * 0.35),
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    border: 0,
                    background: "transparent",
                    color: closeColor,
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    zIndex: 2,
                  }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
                <div className="kpop-slot" style={{width: "100%"}}>
                  {inFlow(content, true)}
                </div>
              </div>
            </div>,
            host || document.body,
          )
        : null}
    </div>
  );
}

KineticPopup.defaultProps = {
  label: "Let's talk",
  linkId: "contact",
  motion: "Rise",
  duration: 0.7,
  maxWidth: 980,
  radius: 28,
  padding: 48,
  cardColor: "#EDEAE4",
  backdropColor: "rgba(8,9,11,0.62)",
  blur: 14,
  closeColor: "#0E0F11",
  showButton: true,
  buttonColor: "#FF5A1F",
  buttonText: "#0E0F11",
  animateContent: true,
  accent: "#FF5A1F",
  font: {
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: 600,
    fontSize: 15,
  },
};

addPropertyControls(KineticPopup, {
  content: {
    type: ControlType.ComponentInstance,
    title: "Content",
    description: "Connect any layer, e.g. a frame holding a Framer Form.",
  },
  trigger: {
    type: ControlType.ComponentInstance,
    title: "Custom Button",
    description: "Optional. Use your own button layer instead of the built-in one.",
  },
  showButton: {
    type: ControlType.Boolean,
    title: "Show Button",
    defaultValue: true,
    description: "Off = invisible; open it from links to #Link ID instead.",
  },
  label: {
    type: ControlType.String,
    title: "Label",
    defaultValue: "Let's talk",
  },
  linkId: {
    type: ControlType.String,
    title: "Link ID",
    defaultValue: "contact",
    description: "Any link to #contact (e.g. your nav) opens this pop-up.",
  },
  motion: {
    type: ControlType.Enum,
    title: "Motion",
    options: ["Rise", "Scale", "Drop", "Fade"],
    defaultValue: "Rise",
    displaySegmentedControl: true,
  },
  duration: {
    type: ControlType.Number,
    title: "Duration",
    defaultValue: 0.7,
    min: 0.1,
    max: 2,
    step: 0.05,
    unit: "s",
  },
  maxWidth: {
    type: ControlType.Number,
    title: "Max Width",
    defaultValue: 980,
    min: 280,
    max: 1600,
    step: 10,
    unit: "px",
  },
  padding: {
    type: ControlType.Number,
    title: "Padding",
    defaultValue: 48,
    min: 0,
    max: 120,
    step: 2,
    unit: "px",
  },
  radius: {
    type: ControlType.Number,
    title: "Radius",
    defaultValue: 28,
    min: 0,
    max: 64,
    unit: "px",
  },
  cardColor: {
    type: ControlType.Color,
    title: "Card",
    defaultValue: "#EDEAE4",
  },
  closeColor: {
    type: ControlType.Color,
    title: "Close Icon",
    defaultValue: "#0E0F11",
  },
  backdropColor: {
    type: ControlType.Color,
    title: "Backdrop",
    defaultValue: "rgba(8,9,11,0.62)",
  },
  blur: {
    type: ControlType.Number,
    title: "Backdrop Blur",
    defaultValue: 14,
    min: 0,
    max: 40,
    unit: "px",
  },
  animateContent: {
    type: ControlType.Boolean,
    title: "Animate Content",
    defaultValue: true,
    description:
      "Content cascades in; form fields glow on focus; the submit button lifts and its arrow turns on hover.",
  },
  accent: {
    type: ControlType.Color,
    title: "Accent",
    defaultValue: "#FF5A1F",
    hidden: (p: Partial<Props>) => !p.animateContent,
  },
  buttonColor: {
    type: ControlType.Color,
    title: "Button",
    defaultValue: "#FF5A1F",
    hidden: (p: Partial<Props>) => filled(p.trigger) || !p.showButton,
  },
  buttonText: {
    type: ControlType.Color,
    title: "Button Text",
    defaultValue: "#0E0F11",
    hidden: (p: Partial<Props>) => filled(p.trigger) || !p.showButton,
  },
  font: {
    type: ControlType.Font,
    title: "Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: {fontSize: 15},
    hidden: (p: Partial<Props>) => filled(p.trigger) || !p.showButton,
  },
});
