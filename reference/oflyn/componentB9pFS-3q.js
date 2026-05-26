const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["./t-accordeonCb3QQEgR.js", "./tools.js", "./t-banner.js", "./t-blur2Vuw9hIo.js", "./t-cart-itemDT6iqDbH.js", "./animation-countDHBIevTR.js", "./imndex.js", "./t-collection-gridBiojuH-O.js", "./t-filter-mobileC7J_M7NK.js", "./t-gradientDwfZLnZQ.js", "./t-hero-three.js", "./threeDR6a5Kiu.js", "./GLTFLoader.js", "./t-img-lazy-2-EXAI7.js", "./t-lazy-section.js", "./t-links-videoCiT2N1IY.js", "./t-loaderBDm2APFM.js", "./t-logog.js", "./t-lookbook-video-playerC67v6ecy.js", "./t-nav-faqB_rbZ2Tg.js", "./t-oflyn-svg.js", "./t-open-bag.js", "./CustomEase.js", "./t-open-menu-mobile.js", "./t-panel-detailsDcX-qrG_.js", "./t-product-formB5pNYfcg.js", "./t-product-recommendationsC85VAYzL.js", "./t-quick-add-formDTrdZ2CP.js", "./t-scrollC.js", "./t-slider-aboutBrskMYmT.js", "./t-slider-desktopCmGz8KsI.js", "./t-slider-lookbookDDsF4X3Z.js", "./t-slider-mobileBvDeuS6L.js", "./t-story-imageBuLzGtgJ.js", "./t-switch-grid0IqFKAPt.js", "./t-switch-variant6wFOfQwt.js", "./t-transition.js", "./t-translate-yCZTxSVSN.js"]))) => i.map(i => d[i]);
import { _ as m, a as e } from "./modulepreload-polyfillCrsIGlxI.js";

class a extends HTMLElement {
  constructor() {
    super(), this.components = [{ selector: "t-hero-three", module: "t-hero-three" }, {
      selector: "t-img-lazy",
      module: "t-img-lazy"
    }, { selector: "t-blur", module: "t-blur" }, {
      selector: "t-translate-y",
      module: "t-translate-y"
    }, { selector: "t-banner", module: "t-banner" }, {
      selector: "t-select",
      module: "t-select"
    }, { selector: "t-dialog", module: "t-dialog" }, {
      selector: "t-lazy-section",
      module: "t-lazy-section"
    }, { selector: "t-lookbook-video-player", module: "t-lookbook-video-player" }, {
      selector: "t-video-player",
      module: "t-video-player"
    }, { selector: "t-story-image", module: "t-story-image" }, {
      selector: "t-quick-add-form",
      module: "t-quick-add-form"
    }, { selector: "t-links-video", module: "t-links-video" }, {
      selector: "t-cart-item",
      module: "t-cart-item"
    }, { selector: "t-collection-grid", module: "t-collection-grid" }, {
      selector: "t-switch-grid",
      module: "t-switch-grid"
    }, { selector: "t-filter-mobile", module: "t-filter-mobile" }, {
      selector: "t-switch-variant",
      module: "t-switch-variant"
    }, { selector: "t-slider-mobile", module: "t-slider-mobile" }, {
      selector: "t-slider-desktop",
      module: "t-slider-desktop"
    }, { selector: "t-panel-details", module: "t-panel-details" }, {
      selector: "t-product-recommendations",
      module: "t-product-recommendations"
    }, { selector: "t-slider-about", module: "t-slider-about" }, {
      selector: "t-accordeon",
      module: "t-accordeon"
    }, { selector: "t-nav-faq", module: "t-nav-faq" }, {
      selector: "t-slider-lookbook",
      module: "t-slider-lookbook"
    }, { selector: "t-olfyn-svg", module: "t-oflyn-svg" }, {
      selector: "t-gradient",
      module: "t-gradient"
    }], this.parallax = document.querySelectorAll(".ukiyo"), this.ukyo = null, this.componentsCart = [{
      selector: "t-cart-item",
      module: "t-cart-item"
    }], this.componentsRecommandations = [{
      selector: "t-story-image",
      module: "t-story-image"
    }, {
      selector: "t-img-lazy",
      module: "t-img-lazy"
    }], this.lazyComponentSelectors = ["t-hero-three", "t-lookbook-video-player", "t-story-image", "t-product-recommendations", "t-slider-lookbook", "t-gradient", "t-panel-details", "t-olfyn-svg", "t-quick-add-form", "t-links-video", "t-nav-faq", "t-accordeon", "t-slider-desktop", "t-img-lazy", "t-blur", "t-translate-y", "t-banner", "t-select", "t-dialog", "t-cart-item", "t-collection-grid", "t-switch-grid", "t-filter-mobile", "t-switch-variant", "t-slider-mobile", "t-slider-about"], this.lazyComponents = new Map, this.intersectionObserver = null, this.registeredComponents = new Set;
  }
  
  connectedCallback() {
    this.prepareComponentsForLazyLoading(), this.app(), this.parallax.length > 0 && this.initParallax(), this.setupLazyLoading();
  }
  
  prepareComponentsForLazyLoading() {
    this.lazyComponentSelectors.forEach(t => {
      const s = this.components.find(o => o.selector === t);
      s && document.querySelectorAll(t).length > 0 && this.lazyComponents.set(t, s.module);
    });
  }
  
  setupLazyLoading() {
    const t = { root: null, rootMargin: "100px", threshold: .1 };
    this.intersectionObserver = new IntersectionObserver((s, o) => {
      s.forEach(r => {
        if (r.isIntersecting) {
          const i = r.target.tagName.toLowerCase(), l = this.isElementVisible(r.target);
          this.lazyComponents.has(i) && l && (this.loadComponentBySelector(i), o.unobserve(r.target), this.lazyComponents.delete(i));
        }
      });
    }, t);
    for (const [s] of this.lazyComponents) document.querySelectorAll(s).forEach(r => {
      this.isElementVisible(r) && this.intersectionObserver.observe(r);
    });
  }
  
  isElementVisible(t) {
    if (window.getComputedStyle(t).display === "none") return !1;
    let o = t.parentElement;
    for (; o;) {
      if (window.getComputedStyle(o).display === "none") return !1;
      o = o.parentElement;
    }
    return !0;
  }
  
  async loadComponentBySelector(t) {
    const s = this.lazyComponents.get(t);
    if (s) try {
      if (this.registeredComponents.has(t)) return;
      const o = await this.loadComponent(s);
      customElements.get(t) || (customElements.define(t, o), this.registeredComponents.add(t));
    } catch (o) {
      console.error(`Erreur lors du chargement du composant ${t}:`, o);
    }
  }
  
  async loadComponent(t) {
    return (await m(Object.assign({
      "../js/components/t-accordeon.js": () => e(() => import("./t-accordeonCb3QQEgR.js"), __vite__mapDeps([0, 1]), import.meta.url),
      "../js/components/t-banner.js": () => e(() => import("./t-banner.js"), __vite__mapDeps([2, 1]), import.meta.url),
      "../js/components/t-blur.js": () => e(() => import("./t-blur2Vuw9hIo.js"), __vite__mapDeps([3, 1]), import.meta.url),
      "../js/components/t-cart-item.js": () => e(() => import("./t-cart-itemDT6iqDbH.js"), __vite__mapDeps([4, 1, 5, 6]), import.meta.url),
      "../js/components/t-collection-grid.js": () => e(() => import("./t-collection-gridBiojuH-O.js"), __vite__mapDeps([7, 1, 5, 6]), import.meta.url),
      "../js/components/t-dialog.js": () => e(() => import("./t-dialogCgCb9k93.js"), [], import.meta.url),
      "../js/components/t-filter-mobile.js": () => e(() => import("./t-filter-mobileC7J_M7NK.js"), __vite__mapDeps([8, 1]), import.meta.url),
      "../js/components/t-gradient.js": () => e(() => import("./t-gradientDwfZLnZQ.js"), __vite__mapDeps([9, 1]), import.meta.url),
      "../js/components/t-hero-three.js": () => e(() => import("./t-hero-three.js"), __vite__mapDeps([10, 1, 6, 11, 12]), import.meta.url),
      "../js/components/t-img-lazy.js": () => e(() => import("./t-img-lazy-2-EXAI7.js"), __vite__mapDeps([13, 1]), import.meta.url),
      "../js/components/t-lazy-section.js": () => e(() => import("./t-lazy-section.js"), __vite__mapDeps([14, 1]), import.meta.url),
      "../js/components/t-links-video.js": () => e(() => import("./t-links-videoCiT2N1IY.js"), __vite__mapDeps([15, 1]), import.meta.url),
      "../js/components/t-loader.js": () => e(() => import("./t-loaderBDm2APFM.js"), __vite__mapDeps([16, 6]), import.meta.url),
      "../js/components/t-logo.js": () => e(() => import("./t-logog.js"), __vite__mapDeps([17, 11, 12]), import.meta.url),
      "../js/components/t-lookbook-video-player.js": () => e(() => import("./t-lookbook-video-playerC67v6ecy.js"), __vite__mapDeps([18, 1]), import.meta.url),
      "../js/components/t-nav-faq.js": () => e(() => import("./t-nav-faqB_rbZ2Tg.js"), __vite__mapDeps([19, 1]), import.meta.url),
      "../js/components/t-oflyn-svg.js": () => e(() => import("./t-oflyn-svg.js"), __vite__mapDeps([20, 6, 1]), import.meta.url),
      "../js/components/t-open-bag.js": () => e(() => import("./t-open-bag.js"), __vite__mapDeps([21, 6, 22]), import.meta.url),
      "../js/components/t-open-menu-mobile.js": () => e(() => import("./t-open-menu-mobile.js"), __vite__mapDeps([23, 6, 22]), import.meta.url),
      "../js/components/t-panel-details.js": () => e(() => import("./t-panel-detailsDcX-qrG_.js"), __vite__mapDeps([24, 1]), import.meta.url),
      "../js/components/t-product-form.js": () => e(() => import("./t-product-formB5pNYfcg.js"), __vite__mapDeps([25, 1]), import.meta.url),
      "../js/components/t-product-recommendations.js": () => e(() => import("./t-product-recommendationsC85VAYzL.js"), __vite__mapDeps([26, 1]), import.meta.url),
      "../js/components/t-quick-add-form.js": () => e(() => import("./t-quick-add-formDTrdZ2CP.js"), __vite__mapDeps([27, 1, 5, 6]), import.meta.url),
      "../js/components/t-scroll.js": () => e(() => import("./t-scrollC.js"), __vite__mapDeps([28, 1]), import.meta.url),
      "../js/components/t-select.js": () => e(() => import("./t-selectD1_17t9P.js"), [], import.meta.url),
      "../js/components/t-slider-about.js": () => e(() => import("./t-slider-aboutBrskMYmT.js"), __vite__mapDeps([29, 1]), import.meta.url),
      "../js/components/t-slider-desktop.js": () => e(() => import("./t-slider-desktopCmGz8KsI.js"), __vite__mapDeps([30, 6, 1]), import.meta.url),
      "../js/components/t-slider-lookbook.js": () => e(() => import("./t-slider-lookbookDDsF4X3Z.js"), __vite__mapDeps([31, 1]), import.meta.url),
      "../js/components/t-slider-mobile.js": () => e(() => import("./t-slider-mobileBvDeuS6L.js"), __vite__mapDeps([32, 1]), import.meta.url),
      "../js/components/t-story-image.js": () => e(() => import("./t-story-imageBuLzGtgJ.js"), __vite__mapDeps([33, 1]), import.meta.url),
      "../js/components/t-switch-grid.js": () => e(() => import("./t-switch-grid0IqFKAPt.js"), __vite__mapDeps([34, 1]), import.meta.url),
      "../js/components/t-switch-variant.js": () => e(() => import("./t-switch-variant6wFOfQwt.js"), __vite__mapDeps([35, 1, 5, 6]), import.meta.url),
      "../js/components/t-transition.js": () => e(() => import("./t-transition.js"), __vite__mapDeps([36, 6, 22]), import.meta.url),
      "../js/components/t-translate-y.js": () => e(() => import("./t-translate-yCZTxSVSN.js"), __vite__mapDeps([37, 1]), import.meta.url),
      "../js/components/t-video-player.js": () => e(() => import("./t-video-player.js"), [], import.meta.url)
    }), `../js/components/${t}.js`, 4)).default;
  }
  
  static get observedAttributes() {
    return ["data-transition-page", "data-is-empty-bag-but-not-anymore", "data-we-load-recommandations"];
  }
  
  async initParallax() {
    if (this.parallax.length > 0) try {
      const s = (await e(() => import("./ukiyo.esm.minC-48z2PQ.js"), [], import.meta.url)).default;
      this.ukiyo = new s(this.parallax, { scale: 1.2, speed: 1.2 });
    } catch (t) {
      console.error("Erreur lors du chargement de Ukiyo:", t);
    }
  }
  
  attributeChangedCallback(t, s, o) {
    t === "data-transition-page" && o === "true" && (this.lazyComponents.clear(), this.prepareComponentsForLazyLoading(), this.app(), this.parallax = document.querySelectorAll(".ukiyo"), this.ukiyo && (this.ukiyo.destroy(), this.ukiyo = null), this.initParallax(), this.intersectionObserver && (this.intersectionObserver.disconnect(), this.setupLazyLoading())), t === "data-we-load-recommandations" && o === "true" && this.updateRecommendations(), t === "data-is-empty-bag-but-not-anymore" && o === "true" && this.updateCart();
  }
  
  async app() {
    for (const { selector: t, module: s } of this.components) if (!this.lazyComponents.has(t)) {
      const o = document.querySelectorAll(t);
      if (o.length > 0 && Array.from(o).some(i => this.isElementVisible(i)) && !customElements.get(t) && !this.registeredComponents.has(t)) {
        const i = await this.loadComponent(s);
        customElements.define(t, i), this.registeredComponents.add(t);
      }
    }
  }
  
  async updateCart() {
    for (const {
      selector: t,
      module: s
    } of this.componentsCart) if (document.querySelector(t) && !customElements.get(t) && !this.registeredComponents.has(t)) {
      const o = await this.loadComponent(s);
      customElements.define(t, o), this.registeredComponents.add(t);
    }
  }
  
  async updateRecommendations() {
    for (const {
      selector: t,
      module: s
    } of this.componentsRecommandations) if (document.querySelector(t) && !customElements.get(t) && !this.registeredComponents.has(t)) {
      const o = await this.loadComponent(s);
      customElements.define(t, o), this.registeredComponents.add(t);
    }
  }
  
  disconnectedCallback() {
    this.intersectionObserver && this.intersectionObserver.disconnect(), this.ukiyo && this.ukiyo.destroy();
  }
}

document.querySelector("t-reload-js") && customElements.get("t-reload-js") === void 0 && customElements.define("t-reload-js", a);
