import * as React from "react";

type Size = {label: string};
type Pack = {name: string; prices: number[]; note: string};

type Props = {
  sizes: Size[];
  packages: Pack[];
  whatsapp: string;
  footnote: string;
};

const money = (v: number) => `R$\u00A0${Math.round(v).toLocaleString("pt-BR")}`;

function useRolling(target: number, still: boolean) {
  const [value, setValue] = React.useState(target);
  const current = React.useRef(target);

  React.useEffect(() => {
    if (still) {
      current.current = target;
      setValue(target);
      return;
    }

    let frame = 0;
    const from = current.current;
    const start = performance.now();
    const duration = 700;
    const step = (time: number) => {
      const progress = Math.min(1, (time - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      current.current = from + (target - from) * eased;
      setValue(current.current);
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, still]);

  return value;
}

export default function PricingBuilder({sizes, packages, whatsapp, footnote}: Props) {
  const id = React.useId();
  const [size, setSize] = React.useState(1);
  const [pack, setPack] = React.useState(0);
  const total = packages[pack].prices[size];
  const [reduceMotion, setReduceMotion] = React.useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const shown = useRolling(total, reduceMotion);
  const text = `Olá! Quero um orçamento: ${packages[pack].name} (${sizes[size].label}). Estimativa: ${money(total)}.`;
  const href = `${whatsapp}?text=${encodeURIComponent(text)}`;

  return (
    <div className="pb">
      <div className="pb-main">
        <fieldset className="pb-step">
          <legend className="pb-legend">01 · Seu veículo</legend>
          <div className="pb-sizes">
            {sizes.map((s, i) => (
              <label className="pb-size" key={s.label}>
                <input className="pb-radio" type="radio" name={`${id}-size`} checked={size === i} onChange={() => setSize(i)} />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="pb-step">
          <legend className="pb-legend">02 · Serviço</legend>
          <div className="pb-list">
            {packages.map((k, i) => (
              <label className="pb-row" key={k.name}>
                <input className="pb-radio" type="radio" name={`${id}-pack`} checked={pack === i} onChange={() => setPack(i)} />
                <span>
                  <span className="pb-row-name">{k.name}</span>
                  <span className="pb-row-note">{k.note}</span>
                </span>
                <span className="pb-row-price">{money(k.prices[size])}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <aside className="pb-summary" aria-label="Resumo da estimativa">
        <p className="pb-summary-label">Estimativa</p>
        <p className="pb-total" aria-hidden="true">{money(shown)}</p>
        <p className="sr-only" role="status">Estimativa: {money(total)}, {packages[pack].name}, {sizes[size].label}</p>
        <p className="pb-summary-line">{sizes[size].label} · {packages[pack].name}</p>
        <a className="btn btn--primary" href={href} target="_blank" rel="noopener noreferrer">Chamar no WhatsApp</a>
        <p className="pb-foot">{footnote}</p>
      </aside>
    </div>
  );
}
