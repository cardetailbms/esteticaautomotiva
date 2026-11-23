import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

export type Testimonial = { id: number; service: string; name: string; car: string; rating: number; quote: string };
type Item = Testimonial & { key: number };

const STAR = "M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z";
const initials = (name: string) => name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();

export default function ReviewsCarousel({ items }: { items: Testimonial[] }) {
  const total = items.length;
  const centerIndex = total % 2 ? (total + 1) / 2 : total / 2;
  const nextKey = useRef(10000);
  const [list, setList] = useState<Item[]>(() =>
    [...items.slice(total - centerIndex), ...items.slice(0, total - centerIndex)].map((item) => ({...item, key: item.id})),
  );
  const [size, setSize] = useState(365);

  useEffect(() => {
    const update = () => setSize(window.matchMedia("(min-width: 640px)").matches ? 365 : 290);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const move = (steps: number) => {
    const next = [...list];
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = next.shift();
        if (!item) return;
        next.push({...item, key: nextKey.current++});
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = next.pop();
        if (!item) return;
        next.unshift({...item, key: nextKey.current++});
      }
    }
    setList(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
  };

  const center = list[centerIndex];

  return (
    <div className="rvs" role="region" aria-roledescription="carrossel" aria-label="Depoimentos de clientes" onKeyDown={onKeyDown}>
      <p className="sr-only" role="status">
        Depoimento {center.id} de {total}: {center.quote} {center.name}, {center.service}.
      </p>
      {list.map((testimonial, index) => {
        const position = index - centerIndex;
        return (
          <figure
            className="rvs-card"
            key={testimonial.key}
            data-center={position === 0}
            data-odd={position % 2 !== 0}
            aria-hidden={position === 0 ? undefined : true}
            onClick={() => move(position)}
            style={{"--pos": position, "--size": `${size}px`} as CSSProperties}
          >
            <span className="rvs-cut" aria-hidden="true" />
            <div className="rvs-top">
              <span className="rvs-avatar" aria-hidden="true">{initials(testimonial.name)}</span>
              <span className="rvs-stars" role="img" aria-label={`${testimonial.rating} de 5 estrelas`}>
                {[0, 1, 2, 3, 4].map((star) => (
                  <svg key={star} viewBox="0 0 24 24" aria-hidden="true" className={star < testimonial.rating ? undefined : "is-off"}>
                    <path d={STAR} fill="currentColor" />
                  </svg>
                ))}
              </span>
            </div>
            <blockquote className="rvs-quote">“{testimonial.quote}”</blockquote>
            <figcaption className="rvs-meta">
              <span>{testimonial.name}</span>
              <span>{testimonial.service} · {testimonial.car}</span>
            </figcaption>
          </figure>
        );
      })}
      <div className="rvs-controls">
        <button type="button" className="rvs-btn" onClick={() => move(-1)} aria-label="Depoimento anterior">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <button type="button" className="rvs-btn" onClick={() => move(1)} aria-label="Próximo depoimento">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
    </div>
  );
}
