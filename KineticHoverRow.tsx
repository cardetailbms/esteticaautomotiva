import * as React from "react";
import {useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {addPropertyControls, ControlType, useIsStaticRenderer} from "framer";

// ---------------------------------------------------------------------------------------------------------------
// Kinetic Hover Row — a project-list row with a floating image that follows the cursor, by Buster Studios.
// Stack rows (or bind one to a CMS Collection List). On hover a fill sweeps across the row, the title runs a colour
// wave, the meta slides over and the row's image floats beside the cursor — trailing it smoothly and tilting with
// its speed. Touch devices get an inline image instead. Every field can be bound to CMS.
// ---------------------------------------------------------------------------------------------------------------

type Img = {src: string; alt?: string} | string;
const srcOf = (i?: Img) => (typeof i === "string" ? i : i?.src || "");

interface Props {
  index: string;
  title: string;
  client: string;
  category: string;
  year: string;
  image?: Img;
  link?: string;
  size: number;
  titleFont: React.CSSProperties;
  metaFont: React.CSSProperties;
  textColor: string;
  mutedColor: string;
  hoverText: string;
  fillColor: string;
  lineColor: string;
  previewWidth: number;
  previewRatio: number;
  tilt: number;
  padding: number;
  style?: React.CSSProperties;
}

const EASE = "cubic-bezier(.22,1,.36,1)";

/**
 * Kinetic Hover Row — list row with a cursor-following image preview.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 */
export default function KineticHoverRow(props: Props) {
  const {
    index,
    title,
    client,
    category,
    year,
    image,
    link,
    size,
    titleFont,
    metaFont,
    textColor,
    mutedColor,
    hoverText,
    fillColor,
    lineColor,
    previewWidth,
    previewRatio,
    tilt,
    padding,
  } = props;
  const isStatic = useIsStaticRenderer();
  const reduce =
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(hover: none)").matches;
  const [on, setOn] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [narrow, setNarrow] = useState(false);
  const row = useRef<HTMLAnchorElement>(null);
  const float = useRef<HTMLDivElement>(null);
  const pos = useRef({x: 0, y: 0, tx: 0, ty: 0, raf: 0, vx: 0});
  const src = srcOf(image);
  const ph = previewWidth / Math.max(0.3, previewRatio);

  // find the page root for the portal (Framer scopes CSS under it) and follow the cursor while hovered
  useEffect(() => {
    let t: HTMLElement | null = row.current;
    while (t && t.parentElement && t.parentElement !== document.body && t.parentElement.id !== "main")
      t = t.parentElement;
    setHost(t || document.body);
    // under 560px the meta drops below the title so long titles keep their full width
    const el = row.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setNarrow(el.clientWidth < 560));
    ro.observe(el);
    setNarrow(el.clientWidth < 560);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!on || isStatic || touch || reduce) return;
    const p = pos.current;
    const loop = () => {
      const nx = p.x + (p.tx - p.x) * 0.16,
        ny = p.y + (p.ty - p.y) * 0.16;
      p.vx += (nx - p.x - p.vx) * 0.2;
      p.x = nx;
      p.y = ny;
      const el = float.current;
      if (el)
        el.style.transform = `translate3d(${p.x - previewWidth / 2}px, ${p.y - ph / 2}px, 0) rotate(${Math.max(-1, Math.min(1, p.vx / 30)) * tilt}deg)`;
      p.raf = requestAnimationFrame(loop);
    };
    p.raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(p.raf);
  }, [on, isStatic, touch, reduce, previewWidth, ph, tilt]);

  const move = (e: React.MouseEvent) => {
    const p = pos.current;
    p.tx = e.clientX;
    p.ty = e.clientY;
  };
  const enter = (e: React.MouseEvent) => {
    const p = pos.current;
    p.tx = p.x = e.clientX;
    p.ty = p.y = e.clientY;
    setOn(true);
  };
  const letters = (title || "").split("");
  const Tag = (link ? "a" : "div") as "a";

  return (
    <Tag
      ref={row}
      href={link || undefined}
      onMouseEnter={enter}
      onMouseMove={move}
      onMouseLeave={() => setOn(false)}
      onFocus={() => setOn(true)}
      onBlur={() => setOn(false)}
      className="khr"
      style={{
        ...props.style,
        position: "relative",
        display: "block",
        width: "100%",
        textDecoration: "none",
        color: textColor,
        borderBottom: `1px solid ${lineColor}`,
        overflow: "hidden",
        cursor: link ? "pointer" : "default",
      }}>
      <style>{`.khr:focus-visible{outline:2px solid ${hoverText};outline-offset:-2px}`}</style>
      {/* fill that sweeps up from the bottom */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: fillColor,
          transform: on ? "scaleY(1)" : "scaleY(0)",
          transformOrigin: on ? "bottom" : "top",
          transition: reduce ? "none" : `transform .7s ${EASE}`,
        }}
      />
      <span
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: narrow ? "minmax(28px, auto) 1fr" : "minmax(36px, auto) 1fr auto",
          rowGap: narrow ? 6 : 0,
          alignItems: "center",
          columnGap: "clamp(12px, 3vw, 40px)",
          padding: `${padding}px clamp(8px, 1.5vw, 20px)`,
        }}>
        <span
          style={{
            ...metaFont,
            color: on ? hoverText : mutedColor,
            transition: "color .4s ease",
          }}>
          {index}
        </span>
        <span style={{minWidth: 0}}>
          <span
            aria-label={title}
            style={{
              ...titleFont,
              fontSize: size,
              display: "block",
              lineHeight: 0.95,
              whiteSpace: narrow ? "normal" : "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              transform: on ? "translateX(12px)" : "none",
              transition: reduce ? "none" : `transform .7s ${EASE}`,
            }}>
            {letters.map((ch, i) => (
              <span
                key={i}
                aria-hidden="true"
                style={{
                  display: "inline-block",
                  color: on ? hoverText : textColor,
                  transition: reduce ? "none" : `color .35s ease ${(on ? i : letters.length - i) * 0.015}s`,
                }}>
                {ch === " " ? " " : ch}
              </span>
            ))}
          </span>
          {touch && src ? (
            <img
              src={src}
              alt=""
              loading="lazy"
              style={{
                display: on ? "block" : "none",
                width: "100%",
                aspectRatio: `${previewRatio}`,
                objectFit: "cover",
                borderRadius: 12,
                marginTop: 12,
              }}
            />
          ) : null}
        </span>
        <span
          style={{
            ...metaFont,
            color: on ? hoverText : mutedColor,
            textAlign: narrow ? "left" : "right",
            gridColumn: narrow ? "2" : undefined,
            display: "flex",
            flexDirection: narrow ? "row" : "column",
            flexWrap: "wrap",
            gap: narrow ? 10 : 4,
            transform: on ? "translateX(-8px)" : "none",
            transition: reduce ? "none" : `transform .7s ${EASE}, color .4s ease`,
          }}>
          <span>
            {client}
            {category ? ` · ${category}` : ""}
          </span>
          <span>{year}</span>
        </span>
      </span>
      {/* floating preview, portalled to the page root so it can follow the cursor anywhere on screen */}
      {host && src && !isStatic && !touch && !reduce
        ? createPortal(
            <div
              ref={float}
              aria-hidden="true"
              style={{
                position: "fixed",
                left: 0,
                top: 0,
                width: previewWidth,
                height: ph,
                zIndex: 60,
                pointerEvents: "none",
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 40px 80px -30px rgba(0,0,0,.7)",
                opacity: on ? 1 : 0,
                transition: "opacity .35s ease",
                willChange: "transform",
              }}>
              <img
                src={src}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  transform: on ? "scale(1)" : "scale(1.25)",
                  transition: `transform .9s ${EASE}`,
                }}
              />
            </div>,
            host,
          )
        : null}
    </Tag>
  );
}

KineticHoverRow.defaultProps = {
  index: "01",
  title: "Orbit Vacuum",
  client: "Halo Home",
  category: "Cleaning",
  year: "2026",
  size: 96,
  textColor: "#EDEAE4",
  mutedColor: "rgba(237,234,228,0.55)",
  hoverText: "#0E0F11",
  fillColor: "#FF5A1F",
  lineColor: "rgba(237,234,228,0.14)",
  previewWidth: 360,
  previewRatio: 1.33,
  tilt: 8,
  padding: 28,
};

addPropertyControls(KineticHoverRow, {
  index: {type: ControlType.String, title: "Index", defaultValue: "01"},
  title: {
    type: ControlType.String,
    title: "Title",
    defaultValue: "Orbit Vacuum",
  },
  client: {
    type: ControlType.String,
    title: "Client",
    defaultValue: "Halo Home",
  },
  category: {
    type: ControlType.String,
    title: "Category",
    defaultValue: "Cleaning",
  },
  year: {type: ControlType.String, title: "Year", defaultValue: "2026"},
  image: {type: ControlType.ResponsiveImage, title: "Image"},
  link: {type: ControlType.Link, title: "Link"},
  size: {
    type: ControlType.Number,
    title: "Title Size",
    defaultValue: 96,
    min: 16,
    max: 300,
    unit: "px",
    description: "Set a different size on each breakpoint.",
  },
  titleFont: {
    type: ControlType.Font,
    title: "Title Font",
    controls: "basic",
    defaultFontType: "sans-serif",
  },
  metaFont: {
    type: ControlType.Font,
    title: "Meta Font",
    controls: "extended",
    defaultFontType: "monospace",
    defaultValue: {fontSize: 12, letterSpacing: "0.14em"},
  },
  textColor: {
    type: ControlType.Color,
    title: "Text",
    defaultValue: "#EDEAE4",
  },
  mutedColor: {
    type: ControlType.Color,
    title: "Meta",
    defaultValue: "rgba(237,234,228,0.55)",
  },
  hoverText: {
    type: ControlType.Color,
    title: "Hover Text",
    defaultValue: "#0E0F11",
  },
  fillColor: {
    type: ControlType.Color,
    title: "Hover Fill",
    defaultValue: "#FF5A1F",
  },
  lineColor: {
    type: ControlType.Color,
    title: "Line",
    defaultValue: "rgba(237,234,228,0.14)",
  },
  previewWidth: {
    type: ControlType.Number,
    title: "Preview Width",
    defaultValue: 360,
    min: 120,
    max: 800,
    unit: "px",
  },
  previewRatio: {
    type: ControlType.Number,
    title: "Preview Ratio",
    defaultValue: 1.33,
    min: 0.5,
    max: 2.5,
    step: 0.01,
  },
  tilt: {
    type: ControlType.Number,
    title: "Tilt",
    defaultValue: 8,
    min: 0,
    max: 30,
    unit: "°",
  },
  padding: {
    type: ControlType.Number,
    title: "Row Padding",
    defaultValue: 28,
    min: 8,
    max: 80,
    unit: "px",
  },
});
