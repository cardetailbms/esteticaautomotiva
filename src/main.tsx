import React, {useEffect, useRef, useState} from "react";
import {createRoot} from "react-dom/client";
import {gsap} from "gsap";
import {SplitText} from "gsap/SplitText";
import "./styles.css";
import KineticFAQ from "../KineticFAQ";
import KineticScrollFill from "../KineticScrollFill";
import KineticSmoothScroll from "../KineticSmoothScroll";
import VantaBeforeAfter from "../VantaBeforeAfter";
import VantaPackageBuilder from "../VantaPackageBuilder";
import VantaReviews from "../VantaReviews";
import VantaSpeedo from "../VantaSpeedo";
import VantaTread from "../VantaTread";
import ServicesSection from "../ServicesSection";

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
const comparisonItems = [
  "Polimento técnico",
  "Lavagem detalhada",
  "Revitalização de faróis",
  "Higienização de bancos",
  "Vitrificação",
];
const packages = services.map((s, i) => ({
  name: s.title,
  price: [180, 90, 120, 60, 100, 130, 180, 450][i],
  note: s.blurb,
}));

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
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    if (!audio.current) return;
    if (audio.current.paused)
      audio.current
        .play()
        .then(() => setPlaying(true))
        .catch(() => undefined);
    else {
      audio.current.pause();
      setPlaying(false);
    }
  };
  useEffect(() => {
    const start = () =>
      audio.current
        ?.play()
        .then(() => setPlaying(true))
        .catch(() => undefined);
    window.addEventListener("pointerdown", start, {once: true});
    return () => window.removeEventListener("pointerdown", start);
  }, []);
  return (
    <>
      <audio ref={audio} loop preload="auto" autoPlay src="/audio/car-wash.mp3" />
      <button className="sound-control" onClick={toggle} aria-label="Alternar som ambiente">
        <span>{playing ? "Ⅱ" : "♪"}</span>
        <small>{playing ? "som ligado" : "som ambiente"}</small>
      </button>
    </>
  );
}

function App() {
  return (
    <>
      <>
        {render(KineticSmoothScroll)}
        <AudioControl />
      </>
      <header className="site-nav">
        <a className="logo" href="#top">
          POLI<span>ART</span>
        </a>
        <nav>
          <a href="#services">Serviços</a>
          <a href="#work">Antes & depois</a>
          <a href="#pricing">Preços</a>
          <a href="#contact">Contato</a>
        </nav>
        <a className="nav-whatsapp" href="https://wa.me/5516999756680" target="_blank" rel="noreferrer">
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
              <p className="section-label">SERVIÇOS</p>
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
        <section className="comparison-section section-pad" id="work">
          <div className="section-head">
            <div>
              <p className="section-label">03 / ANTES & DEPOIS</p>
              <h2 style={{
                fontWeight: 900,
                fontSize: "clamp(2.8rem, 6vw, 5.5rem)",
                letterSpacing: "1px",
                lineHeight: 1.0,
                textTransform: "uppercase",
              }}>
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
            {comparisonItems.map((item, i) => (
              <article className="comparison-item" key={item}>
                <div className="comparison-title">
                  <span>0{i + 1}</span>
                  <strong>{item}</strong>
                </div>
                {render(VantaBeforeAfter, {
                  before: {src: "/image/hero.jpg", alt: `${item} antes`},
                  after: {src: "/image/hero.jpg", alt: `${item} depois`},
                  beforeLabel: "Antes",
                  afterLabel: "Depois",
                  accent: "#7e0607",
                  style: {width: "100%", aspectRatio: "1 / 1", height: "auto"},
                })}
              </article>
            ))}
          </div>
        </section>
        <section className="stats section-pad">
          <div className="stats-head" style={{textAlign: "center", marginBottom: "clamp(40px, 6vw, 80px)"}}>
            <p className="section-label">04 / NOSSO PADRÃO</p>
            <h2
              style={{
                fontWeight: 900,
                fontSize: "clamp(2.8rem, 6vw, 5.5rem)",
                letterSpacing: "1px",
                lineHeight: 1.0,
                textTransform: "uppercase",
              }}>
              Resultado que<br /><span>fala por si.</span>
            </h2>
            <p className="stats-copy" style={{maxWidth: "52ch", margin: "1.5rem auto 0"}}>
              Um cuidado consistente em cada serviço, para seu carro sair sempre melhor do que entrou.
            </p>
          </div>
          {render(VantaSpeedo, {columns: 4, phoneColumns: 2, accent: "#7e0607", textColor: "#fff"})}
        </section>
        <section className="pricing section-pad" id="pricing">
          <div className="section-head">
            <div>
              <p className="section-label">05 / PREÇOS</p>
              <h2>
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
          {render(VantaPackageBuilder, {
            packages,
            extras: [],
            currency: "R$ ",
            packageTitle: "Serviço",
            extrasTitle: "Adicionais",
            totalLabel: "Estimativa",
            buttonLabel: "Chamar no WhatsApp",
            link: "https://wa.me/5516999756680",
            footnote: "Valor estimado. Confirmamos após avaliar o veículo.",
            accent: "#7e0607",
            panel: "#151515",
            textColor: "#fff",
          })}
        </section>
        <section className="reviews section-pad">
          <div className="section-head">
            <div>
              <p className="section-label">06 / CLIENTES</p>
              <h2 style={{
                fontWeight: 900,
                fontSize: "clamp(2.8rem, 6vw, 5.5rem)",
                letterSpacing: "1px",
                lineHeight: 1.0,
                textTransform: "uppercase",
              }}>
                Quem cuida,
                <br />
                <span>recomenda.</span>
              </h2>
            </div>
          </div>
          {render(VantaReviews, {rows: 1, accent: "#7e0607", cardFill: "#151515", textColor: "#fff"})}
        </section>
        <section className="sensory section-pad">
          <p className="section-label">07 / A EXPERIÊNCIA POLIART</p>
          {render(KineticScrollFill, {
            text: "Mais brilho. Mais proteção. Mais *PoliArt.*",
            size: 56,
            color: "#fff",
            accent: "#7e0607",
          })}
          {render(VantaTread, {
            text: "POLIART · ESTÉTICA AUTOMOTIVA · POLIART · ESTÉTICA AUTOMOTIVA ·",
            textColor: "#7e0607",
          })}
        </section>
        <section className="faq section-pad">
          <div className="section-head">
            <div>
              <p className="section-label">08 / DÚVIDAS</p>
              <h2 style={{
                fontWeight: 900,
                fontSize: "clamp(2.8rem, 6vw, 5.5rem)",
                letterSpacing: "1px",
                lineHeight: 1.0,
                textTransform: "uppercase",
              }}>
                Tudo claro
                <br />
                <span>desde o começo.</span>
              </h2>
            </div>
          </div>
          {render(KineticFAQ, {accent: "#7e0607", textColor: "#fff"})}
        </section>
        <section className="contact section-pad" id="contact">
          <p className="section-label">SEU CARRO MERECE ESSE CUIDADO</p>
          <h2>Vamos cuidar?</h2>
          <p>Fale com a PoliArt pelo WhatsApp.</p>
          <a className="contact-button" href="https://wa.me/5516999756680" target="_blank" rel="noreferrer">
            Falar pelo WhatsApp ↗
          </a>
        </section>
      </main>
      <footer className="footer section-pad">
        <a className="logo" href="#top">
          POLI<span>ART</span>
        </a>
        <span>© 2026 POLIART · JABOTICABAL — SP</span>
        <a href="https://www.instagram.com/_poliart_/" target="_blank" rel="noreferrer">
          @_poliart_ ↗
        </a>
      </footer>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
