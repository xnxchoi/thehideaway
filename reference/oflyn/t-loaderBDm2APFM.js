import { g as s } from "./imndex.js";

class d extends HTMLElement {
  static get observedAttributes() {
    return ["opacity", "loaded", "progress", "data-webgl-progress"];
  }
  
  constructor() {
    var t;
    super(), this.containerMain = document.querySelector("[data-main]"), this.logo = document.querySelector("[data-logo-header]"), this.model = (t = this.logo) == null ? void 0 : t.querySelector("t-logo"), this.scrollElement = document.querySelector("t-scroll"), this.banner = document.querySelector("t-banner"), this.bag = document.querySelector("t-open-bag"), this.menuMobile = document.querySelector("t-open-menu-mobile"), this.menuPrincipalDesktop = document.querySelector("[data-menu-principal-desktop]"), this.threeScene = document.querySelector("t-hero-three"), s.set(this.containerMain, {
      borderRadius: "4px",
      pointerEvents: "none",
      transformOrigin: "top left",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%"
    }), s.set(this.containerMain, {
      borderRadius: "0px",
      pointerEvents: "auto",
      transformOrigin: "top left"
    }), this.logo && (this.logo.style.opacity = 0), this.currentProgress = 0;
  }
  
  connectedCallback() {
    var t;
    (t = this.scrollElement) == null || t.setAttribute("data-scroll-transition", "panel-details"), this.setAttribute("data-webgl-progress", "0"), this.setAttribute("progress", "0"), this.threeScene && (this.threeScene.setAttribute("data-loader-target", this.id || "loader"), this.id || (this.id = "loader"));
  }
  
  disconnectedCallback() {
    this.threeScene && this.threeScene.removeAttribute("data-loader-target");
  }
  
  attributeChangedCallback(t, o, e) {
    if (t === "opacity" && (this.style.opacity = e), t === "data-webgl-progress" && o !== e) {
      const r = parseInt(e, 10) || 0;
      this.updateProgressSmooth(r), r >= 100 && setTimeout(() => {
        this.setAttribute("loaded", "true");
      }, 300);
    }
    if (t === "progress") {
      const r = parseFloat(e);
      this.logo && (this.logo.style.opacity = r / 100);
    }
    t === "loaded" && e === "true" && this.logo && this.model && this.animateModelRotation();
  }
  
  updateProgressSmooth(t) {
    s.to(this, {
      currentProgress: t, duration: .5, ease: "power1.out", onUpdate: () => {
        const o = Math.round(this.currentProgress);
        this.setAttribute("progress", o);
      }
    });
  }
  
  animateModelRotation() {
    var o, e;
    const t = { angle: 0 };
    s.to(t, {
      angle: 360, duration: 1, ease: "power2.inOut", onUpdate: () => {
        this.model && this.model.rotate(t.angle);
      }
    }), (o = this.logo) == null || o.classList.add("is-loader-end"), this.classList.add("is-loader-end"), (e = this.threeScene) == null || e.setAttribute("data-end-loader", "true"), setTimeout(() => {
      var i, a;
      (i = this.logo) == null || i.removeAttribute("data-loader-logo"), s.timeline({
        defaults: {
          duration: .5,
          ease: "power2.inOut"
        }
      }).addLabel("start", 0).to(this.menuMobile, { opacity: 1 }, "start").to(this.menuPrincipalDesktop, { opacity: 1 }, "start").to(this.bag, { opacity: 1 }, "start").to(this.banner, { opacity: 1 }, "start"), (a = this.scrollElement) == null || a.setAttribute("data-scroll-transition", "end-transition-play-scroll"), this.remove();
    }, 800);
  }
}

export { d as default };
