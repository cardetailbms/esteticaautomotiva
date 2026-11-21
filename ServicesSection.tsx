import React, {useEffect, useMemo, useRef, useState} from "react";

export type Service = {
  category: string;
  title: string;
  duration: string;
  blurb: string;
  badge?: string;
  image?: {src: string; alt: string};
};

type ServicesSectionProps = {services: Service[]};

const reducedMotionPreferred = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function ServicesSection({services}: ServicesSectionProps) {
  const [cat, setCat] = useState("");
  const [inView, setInView] = useState(reducedMotionPreferred);
  const gridRef = useRef<HTMLUListElement>(null);

  const categories = useMemo(
    () => [...new Set(services.map((service) => service.category))],
    [services],
  );
  const visible = useMemo(
    () => (cat ? services.filter((service) => service.category === cat) : services),
    [cat, services],
  );

  useEffect(() => {
    if (inView) return;
    const grid = gridRef.current;
    if (!grid) return;
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      {threshold: 0, rootMargin: "0px 0px -15% 0px"},
    );
    observer.observe(grid);
    return () => observer.disconnect();
  }, [inView]);

  return (
    <div className="svc">
      <div className="svc-filters" role="toolbar" aria-label="Filtrar serviços">
        <button
          type="button"
          className="svc-filter"
          aria-pressed={cat === ""}
          onClick={() => setCat("")}
        >
          Todos
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className="svc-filter"
            aria-pressed={cat === category}
            onClick={() => setCat(category)}
          >
            {category}
          </button>
        ))}
      </div>
      <p className="sr-only" role="status">{visible.length} serviços</p>
      <ul ref={gridRef} className="svc-grid" role="list" data-in={inView ? "true" : "false"}>
        {visible.map((service, i) => (
          <li key={service.title} className="svc-item" style={{"--i": i} as React.CSSProperties}>
            <article className="svc-card">
              <div className="svc-media">
                {service.badge ? <span className="svc-badge">{service.badge}</span> : null}
                {service.image ? (
                  <img src={service.image.src} alt={service.image.alt} loading="lazy" decoding="async" />
                ) : (
                  <div className="svc-ph" aria-hidden="true">
                    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <path d="M5.75 12.75h7l2.5-3.5h9.5l2.5 3.5h7v19.5h-28z" />
                      <circle cx="20.5" cy="22" r="6.25" />
                    </svg>
                    <span>Foto do serviço</span>
                  </div>
                )}
              </div>
              <div className="svc-meta"><span>{service.category}</span><span>{service.duration}</span></div>
              <h3 className="svc-title">{service.title}</h3>
              <p className="svc-blurb">{service.blurb}</p>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
