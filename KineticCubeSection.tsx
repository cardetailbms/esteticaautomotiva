import * as React from "react";
import {useEffect, useRef, useState} from "react";
import {addPropertyControls, ControlType, RenderTarget} from "framer";

// ---------------------------------------------------------------------------------------------------------------
// Kinetic Cube Section — turn any section (a footer, a CTA…) in like a face of a Rubik's cube, by Buster Studios.
// Connect a layer to Content. It becomes the front face of a 3D block; the side face is the same layer with its
// colours inverted. As the section scrolls into view the block turns from its side face round to the front,
// scrubbed to your scroll (or played once). Hover gives it a little nudge. Renders flat for reduced motion.
// ---------------------------------------------------------------------------------------------------------------

type Mode = "Scroll" | "Once";
type Dir = "From Right" | "From Left";

interface Props {
  content?: React.ReactNode;
  mode: Mode;
  direction: Dir;
  startAngle: number;
  distance: number;
  delay: number;
  runway: number;
  duration: number;
  perspective: number;
  invert: boolean;
  sideFilter: string;
  shade: number;
  nudge: number;
  style?: React.CSSProperties;
}

const filled = (n: React.ReactNode) => (Array.isArray(n) ? n.length > 0 : !!n);
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Kinetic Cube Section — a section that turns in like a cube face.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 600
 */
export default function KineticCubeSection(props: Props) {
  const {
    content,
    mode,
    direction,
    startAngle,
    distance,
    delay,
    runway,
    duration,
    perspective,
    invert,
    sideFilter,
    shade,
    nudge,
  } = props;
  const onCanvas = RenderTarget.current() === RenderTarget.canvas;
  const reduce =
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const box = useRef<HTMLDivElement>(null);
  const cube = useRef<HTMLDivElement>(null);
  const sideShade = useRef<HTMLDivElement>(null);
  const frontShade = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(1200);
  const [vh, setVh] = useState(800);
  const [active, setActive] = useState(false); // 3D layers only exist while the section is near the screen and turning
  const sign = direction === "From Right" ? -1 : 1;
  const flat = onCanvas || reduce;

  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    let lastW = 0;
    const onR = () => {
      if (window.innerWidth !== lastW) {
        lastW = window.innerWidth;
        setVh(window.innerHeight || 800);
      }
    };
    onR();
    window.addEventListener("resize", onR);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onR);
    };
  }, []);

  // drive the turn: angle goes from startAngle (side face showing) to 0 (front face).
  // Performance: nothing runs unless the section is near the screen; transforms are only written when the value
  // changes; once the turn finishes the block flattens (no 3D, no side-face copy) until it turns again.
  useEffect(() => {
    const el = box.current;
    if (flat || !el) return;
    let raf = 0,
      near = false,
      playing = false,
      t0 = 0,
      hoverBoost = 0,
      current = mode === "Once" ? 0 : -1,
      lastA = NaN,
      done = false;
    const write = (p: number) => {
      current = p;
      const a = (1 - p) * startAngle * sign + hoverBoost * sign;
      const c = cube.current;
      if (!c) return;
      const settled = Math.abs(a) < 0.05;
      if (settled) {
        if (lastA !== 0) {
          c.style.transform = "none";
          lastA = 0;
          setActive(false);
        }
        return;
      }
      setActive(true);
      if (Math.abs(a - lastA) < 0.02) return;
      lastA = a;
      c.style.transform = `translateZ(${-w / 2}px) rotateY(${a.toFixed(2)}deg)`;
      if (sideShade.current) sideShade.current.style.opacity = String((p * (shade / 100)).toFixed(3));
      if (frontShade.current) frontShade.current.style.opacity = String(((1 - p) * (shade / 100)).toFixed(3));
    };
    const scrollProgress = () => {
      const r = el.getBoundingClientRect();
      const face = cube.current ? cube.current.offsetHeight : r.height;
      // wait until `delay`% of a screen of the section is showing, so the side face is seen before it turns,
      // and be finished by the time the whole section is on screen (or it fills the screen) - plus any runway
      const s0 = vh * (delay / 100);
      const end = Math.min(face, vh) * 0.82 + (r.height - face); // lands with the last stretch of scrolling to spare
      const span = Math.max(80, Math.min(vh * (distance / 100), end - s0));
      return Math.max(0, Math.min(1, (vh - r.top - s0) / span));
    };
    const tick = () => {
      raf = 0;
      if (mode === "Scroll") {
        if (!near) return;
        const p = scrollProgress();
        // once it has landed it stays solid: a little scroll jitter at the bottom of the page can't wake it
        if (done && p > 0.97 && !hoverBoost && lastA === 0) return;
        done = p >= 1;
        write(done ? 1 : ease(p));
      } else if (playing) {
        const t = Math.min(1, (performance.now() - t0) / (duration * 1000));
        write(ease(t));
        if (t < 1) raf = requestAnimationFrame(tick);
        else playing = false;
      } else write(current);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      if (near) kick();
    };
    // only listen while the section is within a screen of the viewport
    const io = new IntersectionObserver(
      (es) => {
        near = !!es[0]?.isIntersecting;
        if (!near) {
          setActive(false);
          const c = cube.current;
          if (c) {
            c.style.transform = "none";
            lastA = NaN;
          }
          return;
        }
        if (mode === "Once" && !playing && current === 0) {
          playing = true;
          t0 = performance.now();
        }
        kick();
      },
      {rootMargin: "100% 0px 100% 0px"},
    );
    io.observe(el);
    // real mouse hovers only - a tap on a phone fires mouseenter too, and the footer shouldn't rock when tapped
    const onEnter = (ev: PointerEvent) => {
      if (ev.pointerType !== "mouse") return;
      hoverBoost = nudge;
      kick();
    };
    const onLeave = (ev: PointerEvent) => {
      if (ev.pointerType !== "mouse" || !hoverBoost) return;
      hoverBoost = 0;
      kick();
    };
    window.addEventListener("scroll", onScroll, {passive: true});
    window.addEventListener("resize", kick);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", kick);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [flat, mode, startAngle, distance, delay, duration, w, vh, sign, shade, nudge]);

  const face = (inverted: boolean): React.ReactNode =>
    filled(content) ? (
      <div
        className="kcs-face"
        style={{
          width: "100%",
          filter: inverted && invert ? sideFilter : undefined,
        }}>
        {content}
      </div>
    ) : (
      <div
        style={{
          height: 320,
          display: "grid",
          placeItems: "center",
          background: inverted ? "#EDEAE4" : "#0E0F11",
          color: inverted ? "#0E0F11" : "#EDEAE4",
          font: "600 14px Inter, sans-serif",
        }}>
        Connect a layer to Content
      </div>
    );

  return (
    <div ref={box} style={{...props.style, position: "relative", width: "100%"}}>
      {/* the stage pins to the bottom of the screen through the runway, so the turn plays while the whole section is in view */}
      <div
        style={{
          position: flat || mode !== "Scroll" ? "relative" : "sticky",
          bottom: 0,
          perspective: flat || !active ? undefined : `${Math.max(perspective, w * 1.6)}px`,
          perspectiveOrigin: "50% 50%",
        }}>
        <style>{`.kcs-face>*,.kcs-face>*>*{position:relative!important;inset:auto!important;width:100%!important;height:auto!important;max-width:none!important}`}</style>
        <div
          ref={cube}
          style={{
            position: "relative",
            width: "100%",
            transformStyle: active && !flat ? "preserve-3d" : undefined,
            willChange: active && !flat ? "transform" : undefined,
          }}>
          {/* front face (in normal flow, so the component takes the content's height) */}
          <div
            style={{
              position: "relative",
              transform: flat || !active ? undefined : `translateZ(${w / 2}px)`,
              backfaceVisibility: active && !flat ? "hidden" : undefined,
            }}>
            {face(false)}
            {!flat && active ? (
              <div
                ref={frontShade}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#000",
                  opacity: 0,
                  pointerEvents: "none",
                }}
              />
            ) : null}
          </div>
          {/* side face: same content, colours inverted */}
          {!flat && active ? (
            <div
              aria-hidden="true"
              inert={"" as unknown as boolean}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                overflow: "hidden",
                transform: `rotateY(${-sign * 90}deg) translateZ(${w / 2}px)`,
                backfaceVisibility: "hidden",
              }}>
              {face(true)}
              <div
                ref={sideShade}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#000",
                  opacity: 0,
                  pointerEvents: "none",
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
      {flat || mode !== "Scroll" || runway <= 0 ? null : (
        <div aria-hidden="true" style={{height: Math.round(vh * (runway / 100))}} />
      )}
    </div>
  );
}

KineticCubeSection.defaultProps = {
  mode: "Scroll",
  direction: "From Right",
  startAngle: 90,
  distance: 90,
  delay: 15,
  runway: 25,
  duration: 1.4,
  perspective: 2400,
  invert: true,
  sideFilter: "invert(1) hue-rotate(180deg)",
  shade: 35,
  nudge: 4,
};

addPropertyControls(KineticCubeSection, {
  content: {
    type: ControlType.ComponentInstance,
    title: "Content",
    description: "The section to turn in, e.g. your footer.",
  },
  mode: {
    type: ControlType.Enum,
    title: "Turn",
    options: ["Scroll", "Once"],
    defaultValue: "Scroll",
    displaySegmentedControl: true,
    description: "Scroll = the turn follows your scroll. Once = plays when it enters.",
  },
  direction: {
    type: ControlType.Enum,
    title: "Direction",
    options: ["From Right", "From Left"],
    defaultValue: "From Right",
    displaySegmentedControl: true,
  },
  startAngle: {
    type: ControlType.Number,
    title: "Start Angle",
    defaultValue: 90,
    min: 10,
    max: 90,
    unit: "°",
  },
  distance: {
    type: ControlType.Number,
    title: "Scroll Span",
    defaultValue: 90,
    min: 20,
    max: 200,
    unit: "%",
    hidden: (p: Partial<Props>) => p.mode !== "Scroll",
    description: "How much scrolling (as % of the screen) the turn takes.",
  },
  delay: {
    type: ControlType.Number,
    title: "Start Delay",
    defaultValue: 15,
    min: 0,
    max: 80,
    unit: "%",
    hidden: (p: Partial<Props>) => p.mode !== "Scroll",
    description: "How much of the section (as % of the screen) shows before it starts turning.",
  },
  runway: {
    type: ControlType.Number,
    title: "Runway",
    defaultValue: 25,
    min: 0,
    max: 150,
    unit: "%",
    hidden: (p: Partial<Props>) => p.mode !== "Scroll",
    description: "Extra scroll (as % of the screen) where the section stays pinned while it turns.",
  },
  duration: {
    type: ControlType.Number,
    title: "Duration",
    defaultValue: 1.4,
    min: 0.3,
    max: 4,
    step: 0.1,
    unit: "s",
    hidden: (p: Partial<Props>) => p.mode !== "Once",
  },
  perspective: {
    type: ControlType.Number,
    title: "Perspective",
    defaultValue: 2400,
    min: 600,
    max: 8000,
    step: 100,
    unit: "px",
  },
  invert: {
    type: ControlType.Boolean,
    title: "Invert Side",
    defaultValue: true,
  },
  sideFilter: {
    type: ControlType.String,
    title: "Side Filter",
    defaultValue: "invert(1) hue-rotate(180deg)",
    hidden: (p: Partial<Props>) => !p.invert,
    description: "CSS filter for the side face. The default swaps light and dark but keeps your accent hue.",
  },
  shade: {
    type: ControlType.Number,
    title: "Edge Shade",
    defaultValue: 35,
    min: 0,
    max: 80,
    unit: "%",
  },
  nudge: {
    type: ControlType.Number,
    title: "Hover Nudge",
    defaultValue: 4,
    min: 0,
    max: 20,
    unit: "°",
  },
});
