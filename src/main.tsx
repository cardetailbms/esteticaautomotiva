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
import ReviewsCarousel from "../ReviewsCarousel";
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
const pricesByVehicle = [
  [600, 800, 1300],
  [250, 350, 550],
  [120, 150, 220],
  [65, 55, 85],
  [160, 140, 220],
  [180, 150, 200],
  [200, 250, 400],
  [1000, 1400, 2500],
];
const packages = services.map((service, index) => {
  const [hatch, sedan, suvPicape] = pricesByVehicle[index];
  return {
    name: service.title,
    prices: [hatch, sedan, suvPicape, Math.round(sedan * 1.4)],
    note: service.blurb,
  };
});
// ATENÇÃO: depoimentos de EXEMPLO. Substituir por avaliações REAIS de clientes da PoliArt (ex.: Google) antes de publicar.
// ATENÇÃO: depoimentos de EXEMPLO. Substituir por avaliações REAIS de clientes da PoliArt (ex.: Google) antes de publicar.
const testimonials = [
  {id: 1, service: "Polimento técnico", name: "Rafael M.", car: "Sedan prata", rating: 5, quote: "A pintura estava opaca e cheia de micro riscos. Saiu do polimento com brilho de carro novo."},
  {id: 2, service: "Lavagem técnica detalhada", name: "Camila S.", car: "Hatch branco", rating: 5, quote: "Lavagem caprichada, até nos cantinhos que ninguém olha. O carro voltou outro."},
  {id: 3, service: "Revitalização de faróis", name: "Eduardo L.", car: "SUV preto", rating: 5, quote: "Os faróis estavam amarelados e ficaram transparentes. A diferença à noite é enorme."},
  {id: 4, service: "Higienização de bancos", name: "Fernanda A.", car: "Sedan cinza", rating: 5, quote: "Higienizaram os bancos e o cheiro do carro mudou completamente. Ficou limpo de verdade."},
  {id: 5, service: "Vitrificação", name: "Marcos T.", car: "SUV branco", rating: 5, quote: "Fiz a vitrificação e agora a sujeira sai bem mais fácil na lavagem. Brilho muito bonito."},
  {id: 6, service: "Polimento técnico", name: "Juliana R.", car: "Hatch vermelho", rating: 5, quote: "Expliquei o que me incomodava na pintura e eles resolveram. Resultado acima do que eu esperava."},
  {id: 7, service: "Lavagem técnica detalhada", name: "Lucas P.", car: "Moto esportiva", rating: 5, quote: "Levei a moto para lavar e ficou impecável, até nas rodas e nos detalhes."},
  {id: 8, service: "Revitalização de faróis", name: "Patrícia N.", car: "Hatch prata", rating: 4, quote: "Serviço bem feito. Os faróis ficaram claros de novo, só demorou um pouco mais que o combinado."},
  {id: 9, service: "Higienização de bancos", name: "André C.", car: "SUV cinza", rating: 5, quote: "Banco de tecido com mancha antiga de criança. Saiu quase tudo e ficou ótimo."},
  {id: 10, service: "Vitrificação", name: "Beatriz F.", car: "Sedan preto", rating: 5, quote: "Atendimento claro: explicaram o processo e o valor antes de começar. Acabamento lindo."},
  {id: 11, service: "Polimento técnico", name: "Thiago V.", car: "Coupé azul", rating: 5, quote: "Tinha riscos de lavagem por todo o capô. Depois do polimento, quase não aparecem mais."},
  {id: 12, service: "Lavagem técnica detalhada", name: "Renata G.", car: "Minivan prata", rating: 4, quote: "Lavagem bem feita e preço justo. A agenda estava cheia, mas valeu esperar."},
  {id: 13, service: "Revitalização de faróis", name: "Gustavo H.", car: "Picape preta", rating: 5, quote: "Faróis novos sem trocar nada. Valeu cada centavo, e o carro ganhou outra cara."},
  {id: 14, service: "Higienização de bancos", name: "Larissa M.", car: "Hatch preto", rating: 5, quote: "Meu carro tinha cheiro de cachorro. Depois da higienização, nem parece o mesmo carro."},
  {id: 15, service: "Vitrificação", name: "Diego B.", car: "Moto naked", rating: 5, quote: "Fiz na moto e o brilho impressiona. Fica fácil de limpar e a pintura parece protegida."},
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
    answer:
      "A lavagem tradicional leva de 1 a 2 horas e a lavagem técnica detalhada, de 3 a 4 horas. O polimento técnico leva de 1 a 2 dias. A duração de cada serviço está na seção Serviços.",
  },
  {
    question: "Como faço para agendar?",
    answer:
      "Pelo WhatsApp. Na seção Preços você escolhe o tamanho do veículo e o serviço, e o botão já abre a conversa com a sua escolha.",
  },
  {
    question: "O valor da estimativa é o preço final?",
    answer:
      "Não. É uma estimativa com base no tamanho do veículo e no serviço escolhido. O valor final é confirmado depois de avaliar o veículo.",
  },
];

// TROCAR por /image/cta.jpg (foto de gotas de água sobre pintura escura, com luz vermelha) quando existir.
const ctaImage = "/image/hero.jpg";

const sizes = [
  {label: "Hatch / Compacto"},
  {label: "Sedan"},
  {label: "SUV / Picape"},
  {label: "Van / 7 lugares"},
];

// ATENÇÃO: valores PROVISÓRIOS de exemplo. Substituir pelos números reais da PoliArt antes de publicar.
const stats = [
  {value: 800, max: 1000, prefix: "", suffix: "+", decimals: 0, label: "Carros atendidos"},
  {value: 4.9, max: 5, prefix: "", suffix: "/5", decimals: 1, label: "Avaliação média"},
  {value: 5, max: 10, prefix: "", suffix: " anos", decimals: 0, label: "Experiência"},
  {value: 100, max: 100, prefix: "", suffix: "%", decimals: 0, label: "Feito à mão"},
];

gsap.registerPlugin(SplitText);

function SectionTitleEffects() {
  useEffect(() => {
    const headings = Array.from(document.querySelectorAll<HTMLElement>("main h2"));
    const cleanups: Array<() => void> = [];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(({target, isIntersecting}) => {
          if (!isIntersecting) return;
          const heading = target as HTMLElement;
          observer.unobserve(heading);
          heading.classList.add("multi-cursor");
          heading.dataset.effect = "multi-cursor";
          const split = SplitText.create(heading, {type: "words, chars", wordsClass: "word", charsClass: "char"});
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            gsap.set(split.chars, {opacity: 1});
            cleanups.push(() => split.revert());
            return;
          }
          const layer = document.createElement("div");
          layer.className = "cursors";
          layer.setAttribute("aria-hidden", "true");
          const cursor = document.createElement("span");
          cursor.className = "cursor";
          const bar = document.createElement("span");
          bar.className = "cursor__bar";
          cursor.append(bar);
          layer.append(cursor);
          heading.append(layer);
          const box = heading.getBoundingClientRect();
          const chars = split.chars;
          gsap.set(chars, {opacity: 0});
          const timeline = gsap.timeline({delay: 0.2});
          chars.forEach((char) => {
            const rect = char.getBoundingClientRect();
            timeline
              .set(cursor, {autoAlpha: 1, x: rect.left - box.left, y: rect.top - box.top})
              .set(char, {opacity: 1}, ">+=0.07");
          });
          timeline.to(cursor, {autoAlpha: 0, duration: 0.2});
          cleanups.push(() => {
            gsap.killTweensOf([cursor, bar, ...chars]);
            layer.remove();
            split.revert();
          });
        });
      },
      {threshold: 0.12, rootMargin: "0px 0px -12% 0px"},
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => {
      observer.disconnect();
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);
  return null;
}

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
    if (el.paused)
      el.play()
        .then(() => setOn(true))
        .catch(() => undefined);
    else {
      el.pause();
      setOn(false);
    }
  };
  return (
    <>
      <audio ref={audio} loop preload="metadata" src="/audio/car-wash.mp3" onError={() => setUnavailable(true)} />
      <button
        type="button"
        className="sound-control"
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? "Desativar som ambiente" : "Ativar som ambiente"}
        disabled={unavailable}
        title={unavailable ? "Som ambiente em breve" : undefined}>
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true">
          <path d="M4 10v4h3l5 4V6l-5 4H4Z" />
          {on ? (
            <>
              <path d="M15 9a5 5 0 0 1 0 6" />
              <path d="M17.5 6.5a9 9 0 0 1 0 11" />
            </>
          ) : (
            <path d="m16 9 5 6m0-6-5 6" />
          )}
        </svg>
      </button>
    </>
  );
}

function App() {
  return (
    <>
      <a className="skip-link" href="#top">
        Pular para o conteúdo
      </a>
      <>
        {render(KineticSmoothScroll, {
          smoothness: 92,
          wheelSpeed: 85,
          anchorDuration: 1.5,
          onPhones: true,
          touchFollow: 32,
          touchMomentum: 80,
        })}
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
        <SectionTitleEffects />
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
          <AudioControl />
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
        <section className="comparison-section section-pad" id="work" aria-labelledby="work-title">
          <div className="section-head">
            <div>
              <p className="section-label">ANTES & DEPOIS</p>
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
                  labelFont: {
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: "1.5px",
                  },
                  style: {width: "100%", aspectRatio: "1 / 1", height: "auto"},
                })}
              </article>
            ))}
          </div>
        </section>
        <section className="stats section-pad on-paper" aria-labelledby="standard-title">
          <div className="stats-head">
            <p className="stats-note" role="note">
              Dados provisórios de exemplo
            </p>
            <h2 id="standard-title">
              Resultado que
              <br />
              <span>fala por si.</span>
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
            numberFont: {
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: "clamp(32px, 4.2vw, 56px)",
              letterSpacing: "1px",
              lineHeight: 1,
            },
            labelFont: {
              fontFamily: "var(--mono)",
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "1.5px",
              lineHeight: 1.4,
            },
          })}
        </section>
        <section className="pricing section-pad" id="pricing" aria-labelledby="pricing-title">
          <div className="section-head">
            <div>
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
          <p className="reviews-note" role="note">
            Depoimentos de exemplo
          </p>
          <ReviewsCarousel items={testimonials} />
        </section>
        <section className="sensory section-pad" aria-labelledby="sensory-label">
          <p className="section-label" id="sensory-label">
            A EXPERIÊNCIA POLIART
          </p>
          {render(KineticScrollFill, {
            text: "Mais brilho. Mais proteção. Mais *PoliArt.*",
            size: "clamp(40px, 6.4vw, 92px)",
            lineHeight: 1,
            tracking: 0.01,
            font: {fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase"},
            color: "#fff",
            accent: "#a31213",
          })}
          <div className="sensory-tread">
            {render(VantaTread, {
              text: "POLIART · ESTÉTICA AUTOMOTIVA · POLIART · ESTÉTICA AUTOMOTIVA ·",
              rubber: "#000",
              groove: "#303030",
              textColor: "#a31213",
              font: {fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, letterSpacing: "3px"},
            })}
          </div>
        </section>
        <section className="faq section-pad on-paper" id="faq" aria-labelledby="faq-title">
          <div className="section-head">
            <div>
              <p className="section-label">DÚVIDAS</p>
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
          <img
            className="contact-bg"
            src={ctaImage}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            width={1366}
            height={768}
          />
          <p className="section-label">SEU CARRO MERECE ESSE CUIDADO</p>
          <h2 id="contact-title">
            <span>Vamos</span> <span>cuidar?</span>
          </h2>
          <div className="contact-actions">
            <a
              className="btn btn--primary"
              href="https://wa.me/5516999756680"
              target="_blank"
              rel="noopener noreferrer">
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
              <li>
                <a href="#services">Serviços</a>
              </li>
              <li>
                <a href="#work">Antes &amp; depois</a>
              </li>
              <li>
                <a href="#pricing">Preços</a>
              </li>
              <li>
                <a href="#contact">Contato</a>
              </li>
            </ul>
          </nav>
          <div>
            <p className="footer-title">Contato</p>
            <ul>
              <li>
                <a href="https://wa.me/5516999756680" target="_blank" rel="noopener noreferrer">
                  (16) 99975-6680
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="footer-title">Estúdio</p>
            <address>
              Floriano Peixoto, 212
              <br />
              Centro, Jaboticabal — SP (Fundo)
              <br />
              Seg–Sáb · 8h às 18h
            </address>
          </div>
          <div>
            <p className="footer-title">Seguir</p>
            <ul>
              <li>
                <a href="https://www.instagram.com/_poliart_/" target="_blank" rel="noopener noreferrer">
                  @_poliart_ ↗
                </a>
              </li>
            </ul>
          </div>
        </div>
        <a className="footer-wordmark" href="#top" aria-label="PoliArt, voltar ao topo" translate="no">
          POLI<span>ART</span>
        </a>
        <div className="footer-base">
          <span>© 2026 POLIART · JABOTICABAL — SP</span>
          <a href="https://www.instagram.com/bms_trafego/" target="_blank" rel="noopener noreferrer">
            Design by BMS · @bms_trafego ↗
          </a>
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
