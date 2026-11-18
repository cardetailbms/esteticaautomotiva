import * as React from "react";
import {useEffect} from "react";
import {addPropertyControls, ControlType, RenderTarget} from "framer";

// ---------------------------------------------------------------------------------------------------------------
// Kinetic Smooth Scroll — inertia page scrolling for Framer sites, by Buster Studios.
// Wheel / trackpad input is eased towards its target instead of jumping, so the whole page glides.
// Touch is native by default; switch Touch Devices to Smooth and the page follows the finger with a soft glide and
// coasts to a stop on release (sideways swipes stay native). Keyboard and scrollbar dragging stay native, and anything with
// "prefers-reduced-motion" gets plain scrolling. Nested scroll areas (menus, code blocks, textareas) scroll on their
// own, and any element with data-kinetic-scroll="off" is left alone. Same-page anchor links glide to their target.
// Other components can pause it (e.g. a pop-up):  window.dispatchEvent(new CustomEvent("kinetic-scroll", { detail: "stop" }))
// ---------------------------------------------------------------------------------------------------------------

interface Props {
  smoothness: number;
  wheelSpeed: number;
  anchorDuration: number;
  anchorOffset: number;
  onPhones: boolean;
  touchFollow: number;
  touchMomentum: number;
}

type Engine = {
  target: number;
  current: number;
  raf: number;
  paused: boolean;
  anim: null | {from: number; to: number; t0: number; ms: number};
};

const ease = (t: number) => 1 - Math.pow(1 - t, 4);
const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
const clamp = (v: number) => Math.max(0, Math.min(maxScroll(), v));

// true when an element between the event target and the page can still scroll in that direction
function scrollsItself(el: Element | null, dy: number): boolean {
  for (let n = el; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
    if (n instanceof HTMLElement) {
      if (n.dataset.kineticScroll === "off") return true;
      const s = getComputedStyle(n);
      if (/(auto|scroll)/.test(s.overflowY) && n.scrollHeight > n.clientHeight + 1) {
        if (dy > 0 && n.scrollTop + n.clientHeight < n.scrollHeight - 1) return true;
        if (dy < 0 && n.scrollTop > 0) return true;
      }
    }
  }
  return false;
}

/**
 * Kinetic Smooth Scroll — drop one anywhere on a page (it renders nothing) and the whole page glides.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 160
 * @framerIntrinsicHeight 40
 */
export default function KineticSmoothScroll(props: Props) {
  const {smoothness, wheelSpeed, anchorDuration, anchorOffset, onPhones, touchFollow, touchMomentum} = props;
  const onCanvas = RenderTarget.current() === RenderTarget.canvas || RenderTarget.current() === RenderTarget.thumbnail;

  useEffect(() => {
    if (onCanvas || typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    if (reduce.matches || (coarse.matches && !onPhones)) return;

    const root = document.documentElement;
    const prevBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    const e: Engine = {
      target: window.scrollY,
      current: window.scrollY,
      raf: 0,
      paused: false,
      anim: null,
    };
    const lerp = 1 - Math.min(0.95, Math.max(0.02, smoothness / 100)); // smoothness 0..95 → step 1..0.05
    let writing = false;
    // touch: while the finger is down the page tracks it closely (touchLerp); after release it coasts with `lerp`
    const touchLerp = Math.min(0.9, Math.max(0.12, touchFollow / 100));
    const t = {
      on: false,
      axis: "" as "" | "x" | "y",
      x0: 0,
      y0: 0,
      start: 0,
      lastY: 0,
      lastT: 0,
      v: 0,
      el: null as Element | null,
    };
    const locked = () => {
      const a = getComputedStyle(root).overflowY,
        b = getComputedStyle(document.body).overflowY;
      return a === "hidden" || b === "hidden";
    };

    const write = (y: number) => {
      writing = true;
      window.scrollTo(0, y);
      e.current = y;
    };
    const loop = () => {
      e.raf = 0;
      if (e.paused) return;
      if (e.anim) {
        const t = Math.min(1, (performance.now() - e.anim.t0) / e.anim.ms);
        write(e.anim.from + (e.anim.to - e.anim.from) * ease(t));
        e.target = e.current;
        if (t < 1) e.raf = requestAnimationFrame(loop);
        else e.anim = null;
        return;
      }
      const next = e.current + (e.target - e.current) * (t.on ? touchLerp : lerp);
      if (Math.abs(e.target - next) < 0.5) {
        write(e.target);
        return;
      }
      write(next);
      e.raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!e.raf) e.raf = requestAnimationFrame(loop);
    };

    const onWheel = (ev: WheelEvent) => {
      if (e.paused || ev.ctrlKey || ev.defaultPrevented) return; // ctrl = pinch zoom
      const dy = ev.deltaMode === 1 ? ev.deltaY * 40 : ev.deltaMode === 2 ? ev.deltaY * window.innerHeight : ev.deltaY;
      if (Math.abs(ev.deltaX) > Math.abs(dy)) return; // horizontal gestures stay native
      if (scrollsItself(ev.target as Element, dy)) return;
      ev.preventDefault();
      e.anim = null;
      if (!e.raf) e.current = window.scrollY; // resync after native scrolling (keys, scrollbar, find-in-page)
      e.target = clamp(e.target + dy * (wheelSpeed / 100));
      kick();
    };
    // anything that moved the page natively (keyboard, scrollbar, focus) becomes the new resting point
    const onScroll = () => {
      if (writing) {
        writing = false;
        return;
      }
      if (!e.raf) {
        e.current = e.target = window.scrollY;
      }
    };
    const goTo = (y: number) => {
      e.anim = {
        from: window.scrollY,
        to: clamp(y),
        t0: performance.now(),
        ms: Math.max(1, anchorDuration * 1000),
      };
      kick();
    };
    const onClick = (ev: MouseEvent) => {
      if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      const a = (ev.target as Element).closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!el) return;
      ev.preventDefault();
      history.pushState(null, "", url.hash);
      goTo(el.getBoundingClientRect().top + window.scrollY - anchorOffset);
    };
    const onControl = (ev: Event) => {
      const cmd = (ev as CustomEvent).detail;
      if (cmd === "stop") {
        e.paused = true;
        cancelAnimationFrame(e.raf);
        e.raf = 0;
      } else if (cmd === "start") {
        e.paused = false;
        e.current = e.target = window.scrollY;
      } else if (cmd && typeof cmd === "object" && typeof cmd.to === "number") goTo(cmd.to);
    };
    const onResize = () => {
      e.target = clamp(e.target);
    };
    const onTouchStart = (ev: TouchEvent) => {
      if (e.paused || ev.touches.length !== 1 || locked()) {
        t.on = false;
        return;
      }
      const p = ev.touches[0];
      // fingers that start inside something that scrolls itself (a long menu, a form field) stay native
      if (scrollsItself(ev.target as Element, 1) || scrollsItself(ev.target as Element, -1)) {
        t.on = false;
        return;
      }
      e.anim = null;
      if (!e.raf) e.current = e.target = window.scrollY;
      else e.target = e.current; // catching a coasting page stops it where it is, like native
      Object.assign(t, {
        on: true,
        axis: "",
        x0: p.clientX,
        y0: p.clientY,
        start: e.target,
        lastY: p.clientY,
        lastT: performance.now(),
        v: 0,
        el: ev.target as Element,
      });
    };
    const onTouchMove = (ev: TouchEvent) => {
      if (!t.on || ev.touches.length !== 1) return;
      const p = ev.touches[0],
        dx = p.clientX - t.x0,
        dy = p.clientY - t.y0;
      if (!t.axis) {
        // iOS Safari commits to its own scroll on the FIRST touchmove it isn't told to cancel, so the
        // gesture is claimed straight away and only handed back if it turns out to be sideways
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) {
          if (ev.cancelable) ev.preventDefault();
          return;
        }
        t.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (t.axis === "x") {
          t.on = false;
          return;
        } // sliders get their pointer events as normal
      }
      if (!ev.cancelable) return;
      ev.preventDefault();
      const now = performance.now(),
        dt = Math.max(1, now - t.lastT);
      t.v = t.v * 0.6 + ((p.clientY - t.lastY) / dt) * 0.4; // px per ms, smoothed
      t.lastY = p.clientY;
      t.lastT = now;
      e.target = clamp(t.start - dy);
      kick();
    };
    const onTouchEnd = () => {
      if (!t.on) return;
      t.on = false;
      if (t.axis !== "y") return;
      // a stale velocity (finger held still before lifting) shouldn't fling
      const v = performance.now() - t.lastT > 80 ? 0 : t.v;
      e.target = clamp(e.target - v * 420 * (touchMomentum / 100));
      kick();
    };

    window.addEventListener("wheel", onWheel, {passive: false});
    window.addEventListener("scroll", onScroll, {passive: true});
    window.addEventListener("resize", onResize);
    window.addEventListener("kinetic-scroll", onControl);
    document.addEventListener("click", onClick);
    const touch = onPhones && coarse.matches;
    if (touch) {
      window.addEventListener("touchstart", onTouchStart, {
        passive: true,
      });
      window.addEventListener("touchmove", onTouchMove, {
        passive: false,
      });
      window.addEventListener("touchend", onTouchEnd);
      window.addEventListener("touchcancel", onTouchEnd);
    }
    return () => {
      cancelAnimationFrame(e.raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("kinetic-scroll", onControl);
      document.removeEventListener("click", onClick);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      root.style.scrollBehavior = prevBehavior;
    };
  }, [onCanvas, smoothness, wheelSpeed, anchorDuration, anchorOffset, onPhones, touchFollow, touchMomentum]);

  if (!onCanvas) return <div aria-hidden="true" style={{...hiddenStyle}} />;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: 10,
        border: "1px dashed rgba(127,127,127,0.5)",
        color: "rgba(127,127,127,0.9)",
        font: "500 12px/1 Inter, system-ui, sans-serif",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
        padding: "0 12px",
        boxSizing: "border-box",
      }}>
      <span aria-hidden="true">≋</span> Smooth Scroll · live on the published site
    </div>
  );
}

const hiddenStyle: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  pointerEvents: "none",
  opacity: 0,
};

KineticSmoothScroll.defaultProps = {
  smoothness: 88,
  wheelSpeed: 100,
  anchorDuration: 1.1,
  anchorOffset: 0,
  onPhones: false,
  touchFollow: 35,
  touchMomentum: 100,
};

addPropertyControls(KineticSmoothScroll, {
  smoothness: {
    type: ControlType.Number,
    title: "Smoothness",
    defaultValue: 88,
    min: 0,
    max: 95,
    step: 1,
    description: "Higher = longer, silkier glide. 0 = plain scrolling.",
  },
  wheelSpeed: {
    type: ControlType.Number,
    title: "Wheel Speed",
    defaultValue: 100,
    min: 30,
    max: 250,
    step: 5,
    unit: "%",
  },
  anchorDuration: {
    type: ControlType.Number,
    title: "Anchor Glide",
    defaultValue: 1.1,
    min: 0.2,
    max: 3,
    step: 0.1,
    unit: "s",
    description: "How long same-page links (#section) take to glide there.",
  },
  anchorOffset: {
    type: ControlType.Number,
    title: "Anchor Offset",
    defaultValue: 0,
    min: 0,
    max: 300,
    step: 4,
    unit: "px",
    description: "Stop this far above the target, e.g. the height of a sticky nav.",
  },
  onPhones: {
    type: ControlType.Boolean,
    title: "Touch Devices",
    defaultValue: false,
    enabledTitle: "Smooth",
    disabledTitle: "Native",
    description: "Smooth = the page glides under your finger and coasts on release, matching desktop.",
  },
  touchFollow: {
    type: ControlType.Number,
    title: "Finger Follow",
    defaultValue: 35,
    min: 12,
    max: 90,
    unit: "%",
    hidden: (p: Partial<Props>) => !p.onPhones,
    description: "How tightly the page tracks the finger. Lower = softer, floatier.",
  },
  touchMomentum: {
    type: ControlType.Number,
    title: "Momentum",
    defaultValue: 100,
    min: 0,
    max: 250,
    unit: "%",
    hidden: (p: Partial<Props>) => !p.onPhones,
    description: "How far a flick carries the page after you let go.",
  },
});
