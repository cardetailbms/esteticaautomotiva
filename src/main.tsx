import React, {useEffect, useRef, useState} from "react";
import {createRoot} from "react-dom/client";
import {gsap} from "gsap";
import {SplitText} from "gsap/SplitText";
import "./styles.css";
import KineticScrollFill from "../KineticScrollFill";
import KineticSmoothScroll from "../KineticSmoothScroll";
import VantaBeforeAfter from "../VantaBeforeAfter";
import PricingBuilder from "../PricingBuilder";
import VantaSpeedo from "../VantaSpeedo";
import VantaTread from "../VantaTread";
import ServicesSection from "../ServicesSection";
import ReviewsSection from "../ReviewsSection";
import FaqSection from "../FaqSection";

type Component = React.ComponentType<any> & {defaultProps?: Record<string, unknown>};
const render = (C: Component, overrides: Record<string, unknown> = {}) =>
  React.createElement(C, {...C.defaultProps, ...overrides});

const services = [
  {
    category: "Polimento",
    title: "Polimento técnico",
    duration: "1–2 dias",
    blurb: "Correção precisa para recuperar profundidade e brilho da pintura.",
    badge: "Mais procurado",
  },
  {
    category: "Polimento",
    title: "Polimento comercial",
    duration: "1 dia",
    blurb: "Acabamento rápido e uniforme para renovar a aparência do veículo.",
    badge: "",
  },
  {
    category: "Lavagem",
    title: "Lavagem técnica detalhada",
    duration: "3–4 horas",
    blurb: "Limpeza cuidadosa por dentro, por fora e em cada acabamento.",
    badge: "",
  },
  {
    category: "Lavagem",
    title: "Lavagem tradicional",
    duration: "1–2 horas",
    blurb: "O essencial bem feito para manter seu carro sempre pronto.",
    badge: "",
  },
  {
    category: "Lavagem",
    title: "Lavagem de chassi",
    duration: "3 horas",
    blurb: "Remoção profunda de resíduos nas partes inferiores do veículo.",
    badge: "",
  },
  {
    category: "Restauração",
    title: "Revitalização de faróis",
    duration: "2 horas",
    blurb: "Mais transparência, segurança e presença para o conjunto óptico.",
    badge: "",
  },
  {
    category: "Interior",
    title: "Higienização de bancos",
    duration: "4 horas",
    blurb: "Limpeza profunda dos tecidos, couro e superfícies internas.",
    badge: "",
  },
  {
    category: "Proteção",
    title: "Vitrificação",
    duration: "1–2 dias",
    blurb: "Proteção de longa duração com brilho intenso e toque sedoso.",
    badge: "Premium",
  },
];
const comparisons: {title: string; before?: {src: string; alt: string}; after?: {src: string; alt: string}}[] = [
  {title: "Polimento técnico"},
  {title: "Lavagem detalhada"},
  {title: "Revitalização de faróis"},
  {title: "Higienização de bancos"},
  {title: "Vitrificação"},
];
const packages = services.map((s, i) => ({
  name: s.title,
  price: [180, 90, 120, 60, 100, 130, 180, 450][i],
  note: s.blurb,
}));

// ATENÇÃO: depoimentos de EXEMPLO. Substituir por avaliações REAIS de clientes da PoliArt (ex.: Google) antes de publicar.
const reviews = [
  { quote: "Fiz o polimento técnico e a pintura voltou a ter brilho de carro novo.", name: "Rafael M.", car: "Sedan prata", rating: 5 },
  { quote: "Os faróis estavam amarelados e ficaram transparentes de novo. A diferença é enorme.", name: "Camila S.", car: "Hatch branco", rating: 5 },
  { quote: "Higienizaram os bancos e o cheiro do carro mudou completamente.", name: "Eduardo L.", car: "SUV preto", rating: 5 },
  { quote: "Atendimento claro: explicaram o que o carro precisava e o valor antes de começar.", name: "Fernanda A.", car: "Sedan cinza", rating: 5 },
  { quote: "Levei a moto para lavar e ficou impecável, até nos detalhes.", name: "Lucas P.", car: "Moto esportiva", rating: 5 },
  { quote: "Serviço muito bem feito. Só precisei esperar um pouco mais que o combinado.", name: "Juliana R.", car: "Hatch vermelho", rating: 4 },
];

// CONFIRMAR com o cliente: respostas baseadas só em dados já presentes no site. Acrescentar o que for verdade (ex.: atendimento na casa do cliente).
const faqs = [
  {
    question: "Onde fica a PoliArt e qual é o horário?",
    answer: "Floriano Peixoto, 212, Centro, Jaboticabal – SP (Fundo). Atendemos de segunda a sábado, das 8h às 18h.",
  },
  {
    question: "Vocês atendem carros e motos?",
    answer: "Sim. Atendemos carros e motos.",
  },
  {
    question: "Quanto tempo leva cada serviço?",
    answer: "A lavagem tradicional leva de 1 a 2 horas e a lavagem técnica detalhada, de 3 a 4 horas. O polimento técnico leva de 1 a 2 dias. A duração de cada serviço está na seção Serviços.",
  },
  {
    question: "Como faço para agendar?",
    answer: "Pelo WhatsApp. Na seção Preços você escolhe o tamanho do veículo e o serviço, e o botão já abre a conversa com a sua escolha.",
  },
  {
    question: "O valor da estimativa é o preço final?",
    answer: "Não. É uma estimativa com base no tamanho do veículo e no serviço escolhido. O valor final é confirmado depois de avaliar o veículo.",
  },
];

// TROCAR por /image/cta.jpg (foto de gotas de água sobre pintura escura, com luz vermelha) quando existir.
const ctaImage = "/image/hero.jpg";

// CONFIRMAR com o cliente: preços dos serviços (packages) e multiplicadores por tamanho de veículo.
const sizes = [
  {label: "Hatch / Compacto", factor: 0.9},
  {label: "Sedan", factor: 1},
  {label: "SUV / Picape", factor: 1.2},
  {label: "Van / 7 lugares", factor: 1.4},
];

// ATENÇÃO: valores PROVISÓRIOS de exemplo. Substituir pelos números reais da PoliArt antes de publicar.
const stats = [
  {value: 800, max: 1000, prefix: "", suffix: "+", decimals: 0, label: "Carros atendidos"},
  {value: 4.9, max: 5, prefix: "", suffix: "/5", decimals: 1, label: "Avaliação média"},
  {value: 5, max: 10, prefix: "", suffix: " anos", decimals: 0, label: "Experiência"},
  {value: 100, max: 100, prefix: "", suffix: "%", decimals: 0, label: "Feito à mão"},
];

gsap.registerPlugin(SplitText);

function MultiCursorTitle() {
  const root = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const lines = Array.from(el.querySelectorAll<HTMLElement>("[data-line]"));
    const chars: HTMLElement[] = [];
    const words: {start: number; count: number; cursor: HTMLSpanElement; bar: HTMLSpanElement; spot: number}[] = [];
    const layer = document.createElement("div");
    layer.className = "cursors";
    layer.setAttribute("aria-hidden", "true");
    lines.forEach((line) => {
      const split = SplitText.create(line, {type: "words, chars", wordsClass: "word", charsClass: "char"});
      split.words.forEach((word) => {
        const wordChars = split.chars.filter((char) => word.contains(char));
        const cursor = document.createElement("span");
        cursor.className = "cursor";
        const bar = document.createElement("span");
        bar.className = "cursor__bar";
        cursor.append(bar);
        layer.append(cursor);
        const start = chars.length;
        words.push({start, count: wordChars.length, cursor, bar, spot: start * 2});
        chars.push(...wordChars);
      });
      line.classList.add("is-ready");
    });
    el.append(layer);
    const measure = () => {
      const base = el.getBoundingClientRect();
      const spots = chars.flatMap((char) => {
        const r = char.getBoundingClientRect();
        return [
          {x: r.left - base.left, y: r.top - base.top},
          {x: r.right - base.left, y: r.top - base.top},
        ];
      });
      words.forEach((word) => {
        const spot = spots[word.spot] || {x: 0, y: 0};
        gsap.set(word.cursor, {x: spot.x, y: spot.y});
      });
      return spots;
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const spots = measure();
    if (reduced) gsap.set(chars, {opacity: 1});
    else {
      gsap.set(chars, {opacity: 0});
      const tl = gsap.timeline();
      const keyTimes: number[] = [];
      let clock = 0.15;
      const keyAt = (i: number) => {
        while (keyTimes.length <= i) {
          clock += 0.065 * gsap.utils.random(0.65, 1.35);
          keyTimes.push(clock);
        }
        return keyTimes[i];
      };
      words.forEach((word, wordIndex) => {
        const land = 0.15 + wordIndex * 0.035;
        tl.set(word.cursor, {autoAlpha: 1}, land).fromTo(
          word.bar,
          {scaleY: 0},
          {scaleY: 1, duration: 0.15, ease: "expo.out"},
          land,
        );
        for (let i = 0; i < word.count; i++) {
          const index = word.start + i;
          const time = keyAt(wordIndex + i + 1);
          tl.set(chars[index], {opacity: 1}, time).call(
            () => {
              const spot = spots[index * 2 + 1] || {x: 0, y: 0};
              gsap.set(word.cursor, {x: spot.x, y: spot.y});
            },
            [],
            time,
          );
        }
        tl.to(word.cursor, {autoAlpha: 0, duration: 0.25}, keyAt(wordIndex + word.count + 1) + 0.08);
      });
      const last = words[words.length - 1];
      if (last)
        tl.set(last.cursor, {autoAlpha: 1}, ">+=.1").to(
          last.cursor,
          {autoAlpha: 0, duration: 0.16, repeat: 3, yoyo: true},
          ">+=.16",
        );
    }
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      gsap.killTweensOf([...chars, ...words.map((word) => word.cursor)]);
      layer.remove();
      lines.forEach((line) => line.replaceChildren(...Array.from(line.childNodes)));
    };
  }, []);
  return (
    <h1 ref={root} className="hero-title multi-cursor" data-effect="multi-cursor">
      <span data-line>EXCÊLENCIA EM CADA DETALHE</span>

      <span data-line>
        <em>SEMPRE</em>
      </span>
    </h1>
  );
}

function AudioControl() {
  const audio = useRef<HTMLAudioElement>(null);
  const [on, setOn] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const toggle = () => {
    const el = audio.current;
    if (!el || unavailable) return;
    if (el.paused) el.play().then(() => setOn(true)).catch(() => undefined);
    else { el.pause(); setOn(false); }
  };
  return (
    <>
      <audio ref={audio} loop preload="metadata" src="/audio/car-wash.mp3" onError={() => setUnavailable(true)} />
      <button type="button" className="sound-control" onClick={toggle} aria-pressed={on} disabled={unavailable}
        title={unavailable ? "Som ambiente em breve" : undefined}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          {on ? <path d="M8 5v14M16 5v14" /> : <><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></>}
        </svg>
        <span>Som ambiente</span>
      </button>
    </>
  );
}

function App() {
  return (
    <>
      <a className="skip-link" href="#top">Pular para o conteúdo</a>
      <>
        {render(KineticSmoothScroll)}
        <AudioControl />
      </>
      <header className="site-nav">
        <a className="logo" href="#top" translate="no">
          POLI<span>ART</span>
        </a>
        <nav aria-label="Principal">
          <a href="#services">Serviços</a>
          <a href="#work">Antes & depois</a>
          <a href="#pricing">Preços</a>
          <a href="#contact">Contato</a>
        </nav>
        <a className="nav-whatsapp" href="https://wa.me/5516999756680" target="_blank" rel="noopener noreferrer">
          WhatsApp ↗
        </a>
      </header>
      <main id="top">
        <section className="hero">
          <img
            className="hero-image"
            src="/image/hero.jpg"
            alt="Hatch branco em estúdio escuro com fumaça e luz vermelhas"
            width={1366}
            height={768}
            fetchPriority="high"
            decoding="async"
          />
          <div className="hero-shade" />
          <div className="hero-content">
            <p className="eyebrow">POLIART · ESTÉTICA AUTOMOTIVA</p>
            <MultiCursorTitle />
          </div>
          <div className="hero-caption">
            <span>
              Floriano Peixoto, 212 / Centro
              <br />
              Jaboticabal — SP (Fundo)
            </span>
            <span>
              Carros & motos
              <br />
              Seg–Sáb / 8h às 18h
            </span>
          </div>
        </section>

        {/* Seção de Serviços */}
        <section className="services section-pad on-paper" id="services" aria-labelledby="services-title">
          <div className="section-head">
            <div>
              <p className="section-label">02 / SERVIÇOS</p>
              <h2 id="services-title">
                O QUE VOCÊ
                <br />
                <span>PRECISA?</span>
              </h2>
            </div>
            <p>
              Todos os serviços são feitos à mão
              <br />
              em nosso estúdio ou na sua casa.
            </p>
          </div>
          <ServicesSection services={services} />
        </section>

        {/* Seção de Antes & Depois */}
        <section className="comparison-section section-pad" id="work" aria-labelledby="work-title">
          <div className="section-head">
            <div>
              <p className="section-label">03 / ANTES & DEPOIS</p>
              <h2 id="work-title">
                A diferença
                <br />
                <span>é visível.</span>
              </h2>
            </div>
            <p>
              Arraste para revelar o resultado.
              <br />
              No celular, toque e deslize.
            </p>
          </div>
          <div className="comparison-grid">
            {comparisons.map((item, i) => (
              <article className="comparison-item" key={item.title}>
                <div className="comparison-title">
                  <span>0{i + 1}</span>
                  <strong>{item.title}</strong>
                </div>
                {render(VantaBeforeAfter, {
                  before: item.before ?? {src: "/image/hero.jpg", alt: `${item.title}, antes`},
                  after: item.after ?? {src: "/image/hero.jpg", alt: `${item.title}, depois`},
                  simulateBefore: !item.before,
                  label: item.title,
                  beforeLabel: "Antes",
                  afterLabel: "Depois",
                  accent: "#a31213",
                  radius: 0,
                  lineWidth: 2,
                  labelColor: "#fff",
                  labelBg: "#000",
                  labelFont: {fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500, letterSpacing: "1.5px"},
                  style: {width: "100%", aspectRatio: "1 / 1", height: "auto"},
                })}
              </article>
            ))}
          </div>
        </section>
        <section className="stats section-pad on-paper" aria-labelledby="standard-title">
          <div className="stats-head">
            <p className="section-label">04 / NOSSO PADRÃO</p>
            <p className="stats-note" role="note">Dados provisórios de exemplo</p>
            <h2 id="standard-title">
              Resultado que<br /><span>fala por si.</span>
            </h2>
            <p className="stats-copy">
              Um cuidado consistente em cada serviço, para seu carro sair sempre melhor do que entrou.
            </p>
          </div>
          {render(VantaSpeedo, {
            stats,
            columns: 4,
            phoneColumns: 2,
            gap: 32,
            accent: "#a31213",
            textColor: "#111",
            mutedColor: "#5c5c5c",
            trackColor: "rgba(0, 0, 0, .14)",
            numberFont: {fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(32px, 4.2vw, 56px)", letterSpacing: "1px", lineHeight: 1},
            labelFont: {fontFamily: "var(--mono)", fontSize: 13, fontWeight: 500, letterSpacing: "1.5px", lineHeight: 1.4},
          })}
        </section>
        <section className="pricing section-pad" id="pricing" aria-labelledby="pricing-title">
          <div className="section-head">
            <div>
              <p className="section-label">05 / PREÇOS</p>
              <h2 id="pricing-title">
                Monte seu
                <br />
                <span>cuidado ideal.</span>
              </h2>
            </div>
            <p>
              Escolha o tamanho do veículo
              <br />e o serviço desejado.
            </p>
          </div>
          <PricingBuilder
            sizes={sizes}
            packages={packages}
            whatsapp="https://wa.me/5516999756680"
            footnote="Valor estimado. Confirmamos após avaliar o veículo."
          />
        </section>
        <section className="reviews section-pad on-paper" aria-labelledby="reviews-title">
          <div className="section-head">
            <div>
              <p className="section-label">06 / CLIENTES</p>
              <h2 id="reviews-title">
                Quem cuida,
                <br />
                <span>recomenda.</span>
              </h2>
            </div>
          </div>
          <p className="reviews-note" role="note">Depoimentos de exemplo</p>
          <ReviewsSection reviews={reviews} />
        </section>
        <section className="sensory section-pad" aria-labelledby="sensory-label">
          <p className="section-label" id="sensory-label">07 / A EXPERIÊNCIA POLIART</p>
          {render(KineticScrollFill, {
            text: "Mais brilho. Mais proteção. Mais *PoliArt.*",
            size: "clamp(40px, 6.4vw, 92px)",
            lineHeight: 1,
            tracking: 0.01,
            font: { fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase" },
            color: "#fff",
            accent: "#a31213",
          })}
          <div className="sensory-tread">
            {render(VantaTread, {
              text: "POLIART · ESTÉTICA AUTOMOTIVA · POLIART · ESTÉTICA AUTOMOTIVA ·",
              rubber: "#000",
              groove: "#303030",
              textColor: "#a31213",
              font: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, letterSpacing: "3px" },
            })}
          </div>
        </section>
        <section className="faq section-pad on-paper" id="faq" aria-labelledby="faq-title">
          <div className="section-head">
            <div>
              <p className="section-label">08 / DÚVIDAS</p>
              <h2 id="faq-title">
                Tudo claro
                <br />
                <span>desde o começo.</span>
              </h2>
            </div>
          </div>
          <FaqSection items={faqs} />
        </section>
        <section className="contact section-pad" id="contact" aria-labelledby="contact-title">
          <img className="contact-bg" src={ctaImage} alt="" aria-hidden="true" loading="lazy" decoding="async" width={1366} height={768} />
          <p className="section-label">SEU CARRO MERECE ESSE CUIDADO</p>
          <h2 id="contact-title"><span>Vamos</span> <span>cuidar?</span></h2>
          <div className="contact-actions">
            <a className="btn btn--primary" href="https://wa.me/5516999756680" target="_blank" rel="noopener noreferrer">
              Falar pelo WhatsApp ↗
            </a>
            <p>Fale com a PoliArt pelo WhatsApp.</p>
          </div>
        </section>
      </main>
      <footer className="footer section-pad">
        <div className="footer-cols">
          <nav aria-label="Rodapé">
            <p className="footer-title">Explorar</p>
            <ul>
              <li><a href="#services">Serviços</a></li>
              <li><a href="#work">Antes &amp; depois</a></li>
              <li><a href="#pricing">Preços</a></li>
              <li><a href="#contact">Contato</a></li>
            </ul>
          </nav>
          <div>
            <p className="footer-title">Contato</p>
            <ul>
              <li><a href="https://wa.me/5516999756680" target="_blank" rel="noopener noreferrer">(16) 99975-6680</a></li>
            </ul>
          </div>
          <div>
            <p className="footer-title">Estúdio</p>
            <address>
              Floriano Peixoto, 212<br />
              Centro, Jaboticabal — SP (Fundo)<br />
              Seg–Sáb · 8h às 18h
            </address>
          </div>
          <div>
            <p className="footer-title">Seguir</p>
            <ul>
              <li><a href="https://www.instagram.com/_poliart_/" target="_blank" rel="noopener noreferrer">@_poliart_ ↗</a></li>
            </ul>
          </div>
        </div>
        <a className="footer-wordmark" href="#top" aria-label="PoliArt, voltar ao topo" translate="no">POLI<span>ART</span></a>
        <div className="footer-base">
          <span>© 2026 POLIART · JABOTICABAL — SP</span>
          <a href="https://www.instagram.com/bms_trafego/" target="_blank" rel="noopener noreferrer">Design by BMS · @bms_trafego ↗</a>
        </div>
      </footer>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
