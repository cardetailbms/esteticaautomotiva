import React, { useLayoutEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import "lenis/dist/lenis.css";
import "./styles.css";

import VantaBeforeAfter from "../VantaBeforeAfter";
import VantaPackageBuilder from "../VantaPackageBuilder";
import VantaReviews from "../VantaReviews";
import VantaServices from "../VantaServices";
import VantaSpeedo from "../VantaSpeedo";
import VantaTread from "../VantaTread";
import KineticCubeText from "../KineticCubeText";
import KineticCubeSection from "../KineticCubeSection";
import KineticFAQ from "../KineticFAQ";
import KineticHoverRow from "../KineticHoverRow";
import KineticScrollFill from "../KineticScrollFill";

gsap.registerPlugin(ScrollTrigger, SplitText);

type FramerComponent = React.ComponentType<any> & { defaultProps?: Record<string, unknown> };
const component = (Component: FramerComponent, overrides: Record<string, unknown> = {}) =>
  React.createElement(Component, { ...Component.defaultProps, ...overrides });

function MotionSetup() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const lenis = new Lenis({ smoothWheel: true, lerp: 0.09 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      const headings = gsap.utils.toArray<HTMLElement>(".gsap-heading");
      headings.forEach((heading) => {
        const split = SplitText.create(heading, { type: "words, chars", wordsClass: "word++", charsClass: "char" });
        gsap.from(split.chars, {
          yPercent: 110,
          opacity: 0,
          rotate: 3,
          duration: 0.8,
          stagger: 0.018,
          ease: "power3.out",
          scrollTrigger: { trigger: heading, start: "top 88%", once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>(".gsap-copy").forEach((el) => {
        gsap.from(el, {
          y: 24,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
      });
    }, root);

    return () => {
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return <div ref={root} className="page-shell">
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Vanta Studio início">VANTA<span>®</span></a>
      <nav aria-label="Navegação principal">
        <a href="#servicos">Serviços</a><a href="#studio">O studio</a><a href="#avaliacoes">Avaliações</a>
      </nav>
      <a className="header-cta" href="#contato">Agendar horário <span>↗</span></a>
    </header>

    <main id="top">
      <section className="hero section-pad">
        <div className="hero-copy">
          <p className="eyebrow gsap-copy"><span className="status-dot" /> ESTÉTICA AUTOMOTIVA · SÃO PAULO</p>
          <h1 className="gsap-heading">Seu carro.<br /><em>Em outro nível.</em></h1>
          <p className="hero-lede gsap-copy">Cuidado técnico e acabamento impecável para quem sabe que cada detalhe faz diferença.</p>
          <div className="hero-actions gsap-copy"><a className="button button-primary" href="#servicos">Conheça os serviços <span>↘</span></a><span className="hero-note">DETAILING COM PROPÓSITO<br />DESDE 2018</span></div>
        </div>
        <div className="hero-art" aria-label="Ilustração abstrata de carro esportivo">
          <div className="art-grid" /><div className="art-glow" />
          <div className="car-line"><span className="car-roof" /><span className="car-body" /><i className="wheel wheel-one" /><i className="wheel wheel-two" /></div>
          <span className="art-caption">VANTA / 001<br />PAINT CORRECTION</span><span className="art-index">01 — 04</span>
        </div>
        <div className="hero-bottom"><span>PRECISÃO EM CADA PASSADA</span><span>SCROLL PARA EXPLORAR ↓</span></div>
      </section>

      <section className="intro section-pad" id="studio">
        <div className="section-kicker">01 / NOSSA FILOSOFIA</div>
        <div className="intro-content"><h2 className="gsap-heading">Não é só limpeza.<br /><span>É respeito pela máquina.</span></h2><p className="gsap-copy">Tratamos cada veículo como único. Com técnica, produtos selecionados e atenção que você percebe no primeiro olhar — e em cada quilômetro depois.</p></div>
      </section>

      <section className="services section-pad" id="servicos">
        <div className="section-heading"><div><div className="section-kicker">02 / O QUE FAZEMOS</div><h2 className="gsap-heading">Serviços feitos<br />para durar.</h2></div><p className="gsap-copy">Do cuidado essencial à correção completa.<br />Escolha o que seu carro precisa.</p></div>
        {component(VantaServices, { columns: 3, buttonLabel: "Ver detalhes" })}
      </section>

      <section className="transformation section-pad">
        <div className="section-heading"><div><div className="section-kicker">03 / ANTES E DEPOIS</div><h2 className="gsap-heading">A diferença está<br />nos detalhes.</h2></div><p className="gsap-copy">Arraste para comparar o resultado.<br />Nosso trabalho fala por si.</p></div>
        <div className="comparison">{component(VantaBeforeAfter, { style: { width: "100%", height: "min(58vw, 620px)" } })}</div>
      </section>

      <section className="stats section-pad">
        <div className="stats-intro"><div className="section-kicker">04 / NOSSO PADRÃO</div><h2 className="gsap-heading">Confiança<br />se constrói.</h2><p className="gsap-copy">Cada número representa um carro cuidado com o mesmo compromisso.</p></div>
        <div className="stats-gauges">{component(VantaSpeedo, { columns: 2, gap: 36 })}</div>
      </section>

      <section className="quote-band section-pad">
        <span className="quote-mark">“</span>
        {component(KineticScrollFill, { text: "O cuidado certo faz o carro *parecer novo* de novo. E faz você lembrar por que se apaixonou por ele.", size: 48, start: 95, end: 38 })}
      </section>

      <section className="reviews section-pad" id="avaliacoes">
        <div className="section-heading"><div><div className="section-kicker">05 / QUEM CONFIA</div><h2 className="gsap-heading">Palavra de quem<br />já sentiu a diferença.</h2></div><span className="rating gsap-copy">★★★★★ <small>4,9 / 5</small></span></div>
        {component(VantaReviews, { rows: 1, cardWidth: 340 })}
      </section>

      <section className="booking section-pad" id="contato">
        <div className="section-heading"><div><div className="section-kicker">06 / SEU PRÓXIMO PASSO</div><h2 className="gsap-heading">Monte seu<br />cuidado ideal.</h2></div><p className="gsap-copy">Personalize uma estimativa de acordo<br />com seu veículo e suas prioridades.</p></div>
        <div className="builder-wrap">{component(VantaPackageBuilder, { currency: "R$ ", link: "mailto:oi@vantastudio.com.br" })}</div>
      </section>

      <section className="faq section-pad">
        <div className="section-heading"><div><div className="section-kicker">07 / DÚVIDAS FREQUENTES</div><h2 className="gsap-heading">Tudo claro.<br />Desde o começo.</h2></div></div>
        {component(KineticFAQ, {})}
      </section>

      <section className="work-list section-pad">
        <div className="section-kicker">08 / NOSSO JEITO DE CUIDAR</div>
        <div className="work-row">{component(KineticHoverRow, { index: "01", title: "Detalhe que transforma", client: "Vanta Studio", category: "Polimento técnico", year: "2026", size: 72 })}</div>
      </section>

      {component(KineticCubeSection, { mode: "Once", content: <section className="final-cta section-pad">
        <div className="section-kicker">SEU CARRO MERECE ESSE CUIDADO</div>
        {component(KineticCubeText, { text: "VAMOS CUIDAR?", size: 108, color: "#F4F1EC" })}
        <a className="button button-primary" href="mailto:oi@vantastudio.com.br">Fale com a Vanta <span>↗</span></a>
      </section> })}
    </main>

    <footer className="site-footer section-pad"><div className="footer-top"><a className="brand" href="#top">VANTA<span>®</span></a><p>O cuidado que seu carro<br />merece, sem atalhos.</p><a href="#contato">Agende seu horário ↗</a></div><div className="footer-bottom"><span>© 2026 VANTA STUDIO</span><span>SÃO PAULO, BRASIL</span><span>FEITO COM ATENÇÃO A CADA DETALHE</span></div></footer>
    <div className="tread-strip" aria-hidden="true">{component(VantaTread, { text: "VANTA STUDIO · DETAILING · VANTA STUDIO · DETAILING ·", speed: 0.35 })}</div>
  </div>;
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><MotionSetup /></React.StrictMode>);
