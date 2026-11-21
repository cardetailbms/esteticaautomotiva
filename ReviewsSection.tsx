type Review = { quote: string; name: string; car: string; rating: number };

const STAR = "M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z";

export default function ReviewsSection({ reviews }: { reviews: Review[] }) {
  return (
    <ul className="rv-grid" role="list">
      {reviews.map((r) => (
        <li key={`${r.name}-${r.car}`}>
          <figure className="rv-card">
            <span className="rv-stars" role="img" aria-label={`${r.rating} de 5 estrelas`}>
              {[0, 1, 2, 3, 4].map((i) => (
                <svg key={i} viewBox="0 0 24 24" aria-hidden="true" className={i < Math.round(r.rating) ? undefined : "is-off"}>
                  <path d={STAR} fill="currentColor" />
                </svg>
              ))}
            </span>
            <blockquote className="rv-quote">“{r.quote}”</blockquote>
            <figcaption className="rv-meta">
              <span className="rv-name">{r.name}</span>
              <span className="rv-car">{r.car}</span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
