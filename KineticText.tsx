import * as React from "react";
import {useEffect, useRef, useState} from "react";
import {addPropertyControls, ControlType, useIsStaticRenderer} from "framer";

// ---------------------------------------------------------------------------------------------------------------
// Kinetic Text — headings and links that move, by Buster Studios.
// Scroll in: each line slides in from the side (or rises) out of its own mask, line after line.
// Hover: a colour wave runs through the letters, one after another, each lifting slightly as it changes, and runs
// back out when you leave. Works as a link too. Size is a number control so it can differ per breakpoint.
// ---------------------------------------------------------------------------------------------------------------

type From = "Left" | "Right" | "Bottom" | "None";
type Tag = "h1" | "h2" | "h3" | "h4" | "p" | "span";

interface Props {
  text: string;
  tag: Tag;
  size: number;
  maxVw: number;
  lineHeight: number;
  tracking: number;
  uppercase: boolean;
  font: React.CSSProperties;
  color: string;
  hoverColor: string;
  hoverLift: number;
  stagger: number;
  from: From;
  revealDuration: number;
  lineDelay: number;
  replay: boolean;
  underline: boolean;
  link?: string;
  newTab: boolean;
  align: "left" | "center" | "right";
  style?: React.CSSProperties;
}

const EASE = "cubic-bezier(.22,1,.36,1)";

/**
 * Kinetic Text — scroll-reveal lines and a letter-by-letter hover colour wave.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 900
 */
export default function KineticText(props: Props) {
  const {
    text,
    tag,
    size,
    maxVw,
    lineHeight,
    tracking,
    uppercase,
    font,
    color,
    hoverColor,
    hoverLift,
    stagger,
    from,
    revealDuration,
    lineDelay,
    replay,
    underline,
    link,
    newTab,
    align,
  } = props;
  const isStatic = useIsStaticRenderer();
  const reduce =
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(isStatic || from === "None");
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (isStatic || from === "None" || reduce) {
      setSeen(true);
      return;
    }
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (es) => {
        const e = es[0];
        if (e?.isIntersecting) {
          setSeen(true);
          if (!replay) io.disconnect();
        } else if (replay && e && e.boundingClientRect.top > 0) setSeen(false);
      },
      {threshold: 0.2, rootMargin: "0px 0px -6% 0px"},
    );
    io.observe(el);
    // fallback for environments where IntersectionObserver is throttled (hidden tabs, thumbnail capture):
    // at most one position read per frame, and it detaches as soon as the text has revealed
    let raf = 0,
      done = false;
    const stop = () => {
      done = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
    const check = () => {
      raf = 0;
      if (done) return;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.94 && r.bottom > 0) {
        setSeen(true);
        if (!replay) stop();
      }
    };
    const onScroll = () => {
      if (!raf && !done) raf = requestAnimationFrame(check);
    };
    const t = window.setTimeout(check, 1500);
    window.addEventListener("scroll", onScroll, {passive: true});
    return () => {
      io.disconnect();
      window.clearTimeout(t);
      stop();
    };
  }, [isStatic, from, reduce, replay]);

  const lines = (text || "").split(/\n|<br\s*\/?>/i);
  const total = lines.reduce((n, l) => n + l.length, 0);
  const off =
    from === "Left"
      ? "translate3d(-105%,0,0)"
      : from === "Right"
        ? "translate3d(105%,0,0)"
        : from === "Bottom"
          ? "translate3d(0,105%,0)"
          : "none";
  let k = 0;
  const Tag = tag as "h2";
  const body = (
    <Tag
      ref={root as React.RefObject<HTMLHeadingElement>}
      aria-label={link ? undefined : text.replace(/<br\s*\/?>/gi, " ")}
      style={{
        ...font,
        fontSize: maxVw > 0 ? `min(${size}px, ${maxVw}vw)` : size,
        lineHeight: `${lineHeight}em`,
        letterSpacing: `${tracking}em`,
        textTransform: uppercase ? "uppercase" : "none",
        color,
        margin: 0,
        textAlign: align,
        width: "100%",
      }}>
      {lines.map((line, li) => (
        <span
          key={li}
          style={{
            display: "block",
            overflow: "hidden",
            paddingBottom: "0.08em",
            marginBottom: "-0.08em",
          }}>
          <span
            aria-hidden="true"
            style={{
              display: "block",
              transform: seen ? "none" : off,
              opacity: seen || from === "Bottom" ? 1 : 0,
              transition:
                reduce || isStatic
                  ? "none"
                  : `transform ${revealDuration}s ${EASE} ${li * lineDelay}s, opacity ${revealDuration * 0.6}s ease ${li * lineDelay}s`,
            }}>
            {line.split(" ").map((word, wi, words) => (
              <React.Fragment key={wi}>
                <span
                  style={{
                    display: "inline-block",
                    whiteSpace: "nowrap",
                  }}>
                  {word.split("").map((ch, ci) => {
                    const i = k++;
                    const d = hover ? i * stagger : (total - 1 - i) * stagger * 0.5;
                    return (
                      <span
                        key={ci}
                        style={{
                          display: "inline-block",
                          color: hover ? hoverColor : color,
                          transform: hover && hoverLift ? `translateY(${-hoverLift / 100}em)` : "none",
                          transition: reduce ? "none" : `color .35s ease ${d}s, transform .5s ${EASE} ${d}s`,
                        }}>
                        {ch}
                      </span>
                    );
                  })}
                </span>
                {wi < words.length - 1 ? " " : null}
              </React.Fragment>
            ))}
          </span>
        </span>
      ))}
      {underline ? (
        <span
          aria-hidden="true"
          style={{
            display: "block",
            height: "max(1px, 0.06em)",
            marginTop: "0.1em",
            background: hoverColor,
            transform: `scaleX(${hover ? 1 : 0})`,
            transformOrigin: hover ? "left" : "right",
            transition: reduce ? "none" : `transform .6s ${EASE}`,
          }}
        />
      ) : null}
    </Tag>
  );
  const events = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onFocus: () => setHover(true),
    onBlur: () => setHover(false),
  };
  return link ? (
    <a
      href={link}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      aria-label={text.replace(/<br\s*\/?>/gi, " ")}
      {...events}
      className="ktx-a"
      style={{
        ...props.style,
        display: "block",
        textDecoration: "none",
        color: "inherit",
        width: "100%",
      }}>
      <style>{`.ktx-a:focus-visible{outline:2px solid ${hoverColor};outline-offset:4px;border-radius:4px}`}</style>
      {body}
    </a>
  ) : (
    <div {...events} style={{...props.style, width: "100%"}}>
      {body}
    </div>
  );
}

KineticText.defaultProps = {
  text: "Robots you'll\nwant to hug",
  tag: "h2",
  size: 112,
  maxVw: 0,
  lineHeight: 0.9,
  tracking: -0.045,
  uppercase: true,
  color: "#EDEAE4",
  hoverColor: "#FF5A1F",
  hoverLift: 4,
  stagger: 0.018,
  from: "Left",
  revealDuration: 1.1,
  lineDelay: 0.09,
  replay: false,
  underline: false,
  newTab: false,
  align: "left",
};

addPropertyControls(KineticText, {
  text: {
    type: ControlType.String,
    title: "Text",
    defaultValue: "Robots you'll\nwant to hug",
    displayTextArea: true,
    description: "New line = new line (each line reveals on its own).",
  },
  tag: {
    type: ControlType.Enum,
    title: "Tag",
    options: ["h1", "h2", "h3", "h4", "p", "span"],
    defaultValue: "h2",
  },
  size: {
    type: ControlType.Number,
    title: "Size",
    defaultValue: 112,
    min: 8,
    max: 600,
    unit: "px",
    description: "Set a different size on each breakpoint.",
  },
  maxVw: {
    type: ControlType.Number,
    title: "Max Width %",
    defaultValue: 0,
    min: 0,
    max: 50,
    step: 0.5,
    unit: "vw",
    description: "Optional. Caps the size to this % of the screen width, so a fixed size still fits phones (0 = off).",
  },
  lineHeight: {
    type: ControlType.Number,
    title: "Line Height",
    defaultValue: 0.9,
    min: 0.6,
    max: 2,
    step: 0.01,
    unit: "em",
  },
  tracking: {
    type: ControlType.Number,
    title: "Letter Spacing",
    defaultValue: -0.045,
    min: -0.2,
    max: 0.5,
    step: 0.005,
    unit: "em",
  },
  uppercase: {
    type: ControlType.Boolean,
    title: "Uppercase",
    defaultValue: true,
  },
  font: {
    type: ControlType.Font,
    title: "Font",
    controls: "basic",
    defaultFontType: "sans-serif",
  },
  align: {
    type: ControlType.Enum,
    title: "Align",
    options: ["left", "center", "right"],
    optionTitles: ["Left", "Center", "Right"],
    defaultValue: "left",
    displaySegmentedControl: true,
  },
  color: {
    type: ControlType.Color,
    title: "Colour",
    defaultValue: "#EDEAE4",
  },
  hoverColor: {
    type: ControlType.Color,
    title: "Hover Colour",
    defaultValue: "#FF5A1F",
  },
  hoverLift: {
    type: ControlType.Number,
    title: "Hover Lift",
    defaultValue: 4,
    min: 0,
    max: 20,
    unit: "%",
  },
  stagger: {
    type: ControlType.Number,
    title: "Letter Stagger",
    defaultValue: 0.018,
    min: 0,
    max: 0.1,
    step: 0.002,
    unit: "s",
  },
  from: {
    type: ControlType.Enum,
    title: "Reveal From",
    options: ["Left", "Right", "Bottom", "None"],
    defaultValue: "Left",
    displaySegmentedControl: true,
  },
  revealDuration: {
    type: ControlType.Number,
    title: "Reveal Time",
    defaultValue: 1.1,
    min: 0.2,
    max: 3,
    step: 0.05,
    unit: "s",
    hidden: (p: Partial<Props>) => p.from === "None",
  },
  lineDelay: {
    type: ControlType.Number,
    title: "Line Delay",
    defaultValue: 0.09,
    min: 0,
    max: 0.6,
    step: 0.01,
    unit: "s",
    hidden: (p: Partial<Props>) => p.from === "None",
  },
  replay: {
    type: ControlType.Boolean,
    title: "Replay",
    defaultValue: false,
    hidden: (p: Partial<Props>) => p.from === "None",
  },
  link: {type: ControlType.Link, title: "Link"},
  newTab: {
    type: ControlType.Boolean,
    title: "New Tab",
    defaultValue: false,
    hidden: (p: Partial<Props>) => !p.link,
  },
  underline: {
    type: ControlType.Boolean,
    title: "Hover Underline",
    defaultValue: false,
  },
});
