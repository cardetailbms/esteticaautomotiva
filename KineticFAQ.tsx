import * as React from "react";
import {useEffect, useRef, useState} from "react";
import {addPropertyControls, ControlType} from "framer";

// ---------------------------------------------------------------------------------------------------------------
// Kinetic FAQ — an accordion that glides, by Buster Studios.
// Each answer opens with a measured height spring (no jumpy max-height tricks), the plus turns into a minus, the
// index counts in mono, and the question nudges across on hover. Native <button>s with aria-expanded /
// aria-controls, so it works with keyboard and screen readers. One-at-a-time or many-at-once.
// ---------------------------------------------------------------------------------------------------------------

type QA = {question: string; answer: string};

interface Props {
  items: QA[];
  single: boolean;
  firstOpen: boolean;
  showIndex: boolean;
  textColor: string;
  mutedColor: string;
  lineColor: string;
  accent: string;
  accentInk: string;
  hoverFill: string;
  rowPadding: number;
  radius: number;
  duration: number;
  questionFont: React.CSSProperties;
  answerFont: React.CSSProperties;
  indexFont: React.CSSProperties;
  style?: React.CSSProperties;
}

const EASE = "cubic-bezier(.22,1,.36,1)";
let uid = 0;

function Row({
  qa,
  i,
  open,
  onToggle,
  p,
  id,
  reduce,
  narrow,
}: {
  qa: QA;
  i: number;
  open: boolean;
  onToggle: () => void;
  p: Props;
  id: string;
  reduce: boolean;
  narrow: boolean;
}) {
  const inner = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(0);
  const [hover, setHover] = useState(false);
  useEffect(() => {
    const el = inner.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setH(el.offsetHeight));
    ro.observe(el);
    setH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);
  const t = reduce ? "none" : `${p.duration}s ${EASE}`;
  const bid = `${id}-q${i}`,
    pid = `${id}-a${i}`;
  return (
    <div style={{borderBottom: `1px solid ${p.lineColor}`}}>
      <h3 style={{margin: 0}}>
        <button
          type="button"
          id={bid}
          aria-expanded={open}
          aria-controls={pid}
          onClick={onToggle}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className="kfaq-q"
          style={{
            ...p.questionFont,
            fontSize: narrow
              ? (parseFloat(String(p.questionFont?.fontSize ?? 22)) || 22) * 0.8
              : p.questionFont?.fontSize,
            width: "100%",
            display: "grid",
            gridTemplateColumns: p.showIndex ? "auto 1fr auto" : "1fr auto",
            alignItems: "center",
            columnGap: narrow ? 12 : 20,
            textAlign: "left",
            padding: `${p.rowPadding}px ${p.rowPadding * 0.6}px`,
            margin: 0,
            border: 0,
            cursor: "pointer",
            color: p.textColor,
            borderRadius: p.radius,
            background: hover || open ? p.hoverFill : "transparent",
            transition: reduce ? "none" : `background-color .35s ease`,
          }}>
          {p.showIndex ? (
            <span
              aria-hidden="true"
              style={{
                ...p.indexFont,
                color: open ? p.accent : p.mutedColor,
                transition: "color .3s ease",
                minWidth: narrow ? "auto" : "2.4em",
              }}>
              {String(i + 1).padStart(2, "0")}
            </span>
          ) : null}
          <span
            style={{
              transform: hover && !open ? "translateX(6px)" : "none",
              transition: reduce ? "none" : `transform .5s ${EASE}`,
            }}>
            {qa.question}
          </span>
          <span
            aria-hidden="true"
            style={{
              position: "relative",
              width: 34,
              height: 34,
              borderRadius: 999,
              border: `1px solid ${open ? p.accent : p.lineColor}`,
              background: open ? p.accent : "transparent",
              color: open ? p.accentInk : p.textColor,
              transition: reduce ? "none" : `all .4s ${EASE}`,
              flexShrink: 0,
            }}>
            <span
              style={{
                position: "absolute",
                left: 10,
                right: 10,
                top: 16,
                height: 1.5,
                background: "currentColor",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: 10,
                right: 10,
                top: 16,
                height: 1.5,
                background: "currentColor",
                transform: open ? "rotate(0deg) scaleX(0)" : "rotate(90deg)",
                transition: t === "none" ? "none" : `transform ${t}`,
              }}
            />
          </span>
        </button>
      </h3>
      <div
        id={pid}
        role="region"
        aria-labelledby={bid}
        style={{
          height: open ? h : 0,
          overflow: "hidden",
          transition: t === "none" ? "none" : `height ${t}`,
        }}>
        <div
          ref={inner}
          style={{
            padding: `0 ${p.rowPadding * 0.6}px ${p.rowPadding * 1.1}px`,
            paddingLeft: p.showIndex && !narrow ? `calc(${p.rowPadding * 0.6}px + 2.4em + 20px)` : p.rowPadding * 0.6,
            boxSizing: "border-box",
            opacity: open ? 1 : 0,
            transform: open ? "none" : "translateY(-8px)",
            transition: reduce
              ? "none"
              : `opacity ${p.duration * 0.8}s ${EASE} ${open ? p.duration * 0.15 : 0}s, transform ${p.duration}s ${EASE}`,
          }}>
          <p
            style={{
              ...p.answerFont,
              color: p.mutedColor,
              margin: 0,
              maxWidth: "62ch",
              whiteSpace: "pre-line",
            }}>
            {qa.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Kinetic FAQ — a smooth, accessible accordion.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 880
 */
export default function KineticFAQ(props: Props) {
  const {items, single, firstOpen, lineColor, accent} = props;
  const list = items && items.length ? items : DEFAULT_ITEMS;
  const [open, setOpen] = useState<number[]>(firstOpen ? [0] : []);
  const id = useRef(`kfaq${++uid}`).current;
  const reduce =
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(880);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const toggle = (i: number) => setOpen((o) => (o.includes(i) ? o.filter((x) => x !== i) : single ? [i] : [...o, i]));
  return (
    <div
      ref={box}
      style={{
        ...props.style,
        width: "100%",
        borderTop: `1px solid ${lineColor}`,
      }}>
      <style>{`.kfaq-q:focus-visible{outline:2px solid ${accent};outline-offset:-2px}`}</style>
      {list.map((qa, i) => (
        <Row
          key={i}
          qa={qa}
          i={i}
          open={open.includes(i)}
          onToggle={() => toggle(i)}
          p={props}
          id={id}
          reduce={reduce}
          narrow={w < 520}
        />
      ))}
    </div>
  );
}

const DEFAULT_ITEMS: QA[] = [
  {
    question: "Preciso levar o carro até vocês?",
    answer:
      "Não necessariamente. Oferecemos atendimento no nosso estúdio em Jaboticabal e também na sua casa ou empresa, dependendo do serviço. Fale com a gente para combinar.",
  },
  {
    question: "Quanto tempo leva cada serviço?",
    answer:
      "Uma lavagem completa leva em torno de 1h30. Polimento técnico ou correção de pintura pode levar de 1 a 2 dias. Revestimento cerâmico, 2 dias. Confirmamos o prazo na avaliação.",
  },
  {
    question: "O carro precisa estar sujo para agendar?",
    answer:
      "Não. Mas recomendamos não lavar antes de uma inspeção de pintura, para conseguirmos avaliar o estado real da superfície.",
  },
  {
    question: "Vocês trabalham com motos?",
    answer:
      "Sim. Atendemos carros e motos com os mesmos padrões de acabamento.",
  },
  {
    question: "Como faço para agendar?",
    answer:
      "Pelo WhatsApp. É a forma mais rápida. Respondemos em até dois dias úteis com disponibilidade e orientações.",
  },
];

KineticFAQ.defaultProps = {
  items: DEFAULT_ITEMS,
  single: true,
  firstOpen: true,
  showIndex: true,
  textColor: "#EDEAE4",
  mutedColor: "rgba(237,234,228,0.6)",
  lineColor: "rgba(237,234,228,0.14)",
  accent: "#FF5A1F",
  accentInk: "#0E0F11",
  hoverFill: "rgba(237,234,228,0.04)",
  rowPadding: 24,
  radius: 14,
  duration: 0.65,
};

addPropertyControls(KineticFAQ, {
  items: {
    type: ControlType.Array,
    title: "Questions",
    control: {
      type: ControlType.Object,
      controls: {
        question: {
          type: ControlType.String,
          title: "Question",
          defaultValue: "Question",
        },
        answer: {
          type: ControlType.String,
          title: "Answer",
          defaultValue: "Answer",
          displayTextArea: true,
        },
      },
    },
    defaultValue: DEFAULT_ITEMS,
  },
  single: {
    type: ControlType.Boolean,
    title: "Open",
    defaultValue: true,
    enabledTitle: "One",
    disabledTitle: "Many",
  },
  firstOpen: {
    type: ControlType.Boolean,
    title: "First Open",
    defaultValue: true,
  },
  showIndex: {
    type: ControlType.Boolean,
    title: "Numbers",
    defaultValue: true,
  },
  textColor: {
    type: ControlType.Color,
    title: "Question",
    defaultValue: "#EDEAE4",
  },
  mutedColor: {
    type: ControlType.Color,
    title: "Answer",
    defaultValue: "rgba(237,234,228,0.6)",
  },
  accent: {
    type: ControlType.Color,
    title: "Accent",
    defaultValue: "#FF5A1F",
  },
  accentInk: {
    type: ControlType.Color,
    title: "Icon on Accent",
    defaultValue: "#0E0F11",
  },
  lineColor: {
    type: ControlType.Color,
    title: "Lines",
    defaultValue: "rgba(237,234,228,0.14)",
  },
  hoverFill: {
    type: ControlType.Color,
    title: "Hover Fill",
    defaultValue: "rgba(237,234,228,0.04)",
  },
  rowPadding: {
    type: ControlType.Number,
    title: "Row Padding",
    defaultValue: 24,
    min: 8,
    max: 64,
    unit: "px",
  },
  radius: {
    type: ControlType.Number,
    title: "Radius",
    defaultValue: 14,
    min: 0,
    max: 40,
    unit: "px",
  },
  duration: {
    type: ControlType.Number,
    title: "Duration",
    defaultValue: 0.65,
    min: 0.1,
    max: 2,
    step: 0.05,
    unit: "s",
  },
  questionFont: {
    type: ControlType.Font,
    title: "Question Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: {
      fontSize: 22,
      lineHeight: "1.3em",
      letterSpacing: "-0.01em",
    },
  },
  answerFont: {
    type: ControlType.Font,
    title: "Answer Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: {fontSize: 16, lineHeight: "1.6em"},
  },
  indexFont: {
    type: ControlType.Font,
    title: "Number Font",
    controls: "extended",
    defaultFontType: "monospace",
    defaultValue: {fontSize: 12, letterSpacing: "0.12em"},
  },
});
