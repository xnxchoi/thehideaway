import { g as t } from "./imndex.js";
import { C as l } from "./CustomEase.js";

t.registerPlugin(l);

class y extends HTMLElement {
  constructor() {
    super(), this.initializeElementsEveryOpen(), this.initializeElements(), this.isDesktop = window.innerWidth >= 1024, this.valueScroll = 0, this.handleResize = this.handleResize.bind(this);
  }
  
  initializeElements() {
    this.scrollEl = document.querySelector("t-scroll"), this.containerBox = document.querySelector("[data-bag-contain-main]"), this.containerBag = document.querySelector("[data-bag-contain-bag]"), this.bag = document.querySelector("[data-container-bag]"), this.header = document.querySelector("[data-header]"), this.bagHeader = document.querySelector("[data-bag-contain-header]"), this.closeBtns = [...document.querySelectorAll("[data-close-bag]")], this.openBtns = [...document.querySelectorAll("[data-open-bag]")], this.topBar = document.querySelector("[data-bag-contain-bag] .top-bar"), this.bagHeaderCountSpan = document.querySelector(".bag-header-count span"), this.bagHeaderIconSvg = document.querySelector(".bag-header-icon svg"), this.bagHeaderClose = document.querySelector(".bag-header-close"), this.bagContainFooterP = document.querySelector("[data-bag-contain-footer] p"), this.banner = document.querySelector("t-banner"), this.paths = this.bagHeaderIconSvg.querySelectorAll("path");
  }
  
  initializeElementsEveryOpen() {
    this.containerMain = document.querySelector("[data-main]"), this.containerMainInside = document.querySelector("[data-main-inside]");
  }
  
  connectedCallback() {
    this.openBtns.forEach(e => {
      e.addEventListener("click", () => {
        var o;
        (o = this.scrollEl) == null || o.setAttribute("data-scroll-transition", "bag");
      });
    }), this.closeBtns.forEach(e => {
      e.addEventListener("click", () => {
        this.setAttribute("data-scroll", `go_${this.valueScroll}`);
      });
    }), window.addEventListener("resize", this.handleResize);
  }
  
  static get observedAttributes() {
    return ["data-scroll"];
  }
  
  disconnectedCallback() {
    window.removeEventListener("resize", this.handleResize);
  }
  
  getHeroComponent() {
    return document.querySelector("t-hero-three");
  }
  
  handleResize() {
    this.isDesktop = window.innerWidth >= 1024;
  }
  
  attributeChangedCallback(e, o, a) {
    var n, s;
    if (e === "data-scroll") if (a.includes("stop")) {
      this.valueScroll = a.split("_")[1];
      const i = (n = this.containerBox) == null ? void 0 : n.getBoundingClientRect(),
        r = (s = this.containerMain) == null ? void 0 : s.getBoundingClientRect();
      i && r && (this.isDesktop ? this.animationOpenDesktop(i, r) : this.animationOpenMobile());
    } else a.includes("go") && (this.isDesktop ? this.animationCloseDesktop() : this.animationCloseMobile());
  }
  
  animationOpenMobile() {
    this.initializeElementsEveryOpen();
    const e = this.getHeroComponent();
    this.bagHeaderIconSvg.querySelectorAll("path"), e && e.setAttribute("data-webgl-state", "paused"), t.timeline({
      defaults: {
        duration: .8,
        ease: l.create("custom", "0.6, 0, 0.3, 1")
      }, onStart: () => {
        var a;
        (a = document.querySelector("t-filter-mobile")) == null || a.classList.add("is-hide"), t.set(this.paths, {
          opacity: 0,
          y: 100
        }), t.set(this.bagHeaderClose, { opacity: 0, y: "100%" }), t.set(this.bag, {
          zIndex: 21,
          pointerEvents: "auto"
        }), t.set("[data-bag-contain-bag] .bag-items", {
          autoAlpha: 0,
          xPercent: 0
        }), t.set(this.containerBox, {
          zIndex: 1,
          pointerEvents: "auto"
        }), t.set(this.containerMain, {
          overflow: "hidden",
          pointerEvents: "none"
        }), t.set("body", { backgroundColor: "#E8E8E8" });
      }
    }).addLabel("start", 0).to([this.header, this.banner], {
      autoAlpha: 0,
      duration: .1
    }, "start").to(this.topBar, {
      autoAlpha: 1,
      x: 0,
      duration: .2
    }, "start").to(this.containerMain, { x: "-100%" }, "start").to([this.bagHeaderCountSpan, this.bagHeaderIconSvg, this.bagHeaderClose, this.bagContainFooterP], {
      autoAlpha: 1,
      y: 0
    }, "start+=0.2").to(this.paths, {
      opacity: 1,
      y: 0,
      stagger: .1
    }, "start+=0.4").to("[data-bag-contain-bag] .bag-items", { autoAlpha: 1, xPercent: 0 }, "start+=0.4");
  }
  
  animationCloseMobile() {
    t.timeline({
      defaults: { duration: 1.1, ease: l.create("custom", "0.6, 0, 0.3, 1") }, onStart: () => {
        t.set(this.bag, { zIndex: -1, pointerEvents: "none" }), t.set(this.containerBox, {
          zIndex: 1,
          pointerEvents: "auto"
        }), t.set("body", { backgroundColor: "#E8E8E8" });
      }, onComplete: () => {
        var a, n;
        t.set(this.containerMain, { zIndex: "0" }), this.containerMain.style.transform = "none", t.set(this.containerMain, {
          overflow: "visible",
          pointerEvents: "auto"
        }), (a = this.scrollEl) == null || a.setAttribute("data-scroll-transition", "end-transition-play-scroll"), (n = document.querySelector("t-filter-mobile")) == null || n.classList.remove("is-hide");
        const o = this.getHeroComponent();
        o && o.setAttribute("data-webgl-state", "playing");
      }
    }).addLabel("start", 0).to([this.header, this.banner], {
      autoAlpha: 1,
      duration: .2
    }, "start +=0.6").to([this.topBar, ".container-bag__main .top-bar"], {
      autoAlpha: 0,
      x: "100%",
      duration: .2
    }, "start").to(this.containerMain, { x: 0 }, "start").to([this.bagHeaderCountSpan, this.bagContainFooterP, this.bagHeaderIconSvg, this.bagHeaderClose], {
      autoAlpha: 0,
      y: "100%"
    }, "start").to(this.paths, {
      opacity: 0,
      y: 100,
      stagger: .1
    }, "start").to("[data-bag-contain-bag] .bag-items", { autoAlpha: 0, xPercent: 0, duration: 1 }, "start");
  }
  
  animationOpenDesktop(e, o) {
    this.initializeElementsEveryOpen();
    const a = this.getHeroComponent();
    a && a.setAttribute("data-webgl-state", "paused");
    const n = window.innerWidth, s = window.innerHeight, i = Math.min(e.width / n, e.width / n), r = window.scrollY;
    document.querySelector("[data-bag-contain-bag]").style.setProperty("--scale", `${s * i}px`), t.timeline({
      defaults: {
        duration: 1.1,
        ease: "power2.inOut"
      }, onStart: () => {
        var c, d, h;
        (c = this.containerMain) == null || c.classList.add("is-active"), (d = this.containerMainInside) == null || d.classList.add("is-active"), (h = this.containerMainInside) == null || h.style.setProperty("--scroll-top", this.valueScroll), t.set(this.paths, {
          opacity: 0,
          y: 100
        }), t.set(this.bag, {
          zIndex: 21,
          pointerEvents: "auto"
        }), t.set("[data-bag-contain-bag] .bag-items", {
          autoAlpha: 0,
          xPercent: 100
        }), t.set(this.containerBox, {
          zIndex: 1,
          pointerEvents: "auto"
        }), t.set(this.containerMain, {
          borderRadius: "4px",
          overflow: "hidden",
          pointerEvents: "none",
          transformOrigin: "top left",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%"
        }), t.set("body", { backgroundColor: "#E8E8E8" });
      }, onComplete: () => {
        this.closeBtns[0].focus();
      }
    }).addLabel("start", 0).to([this.header, this.banner], {
      autoAlpha: 0,
      duration: .2
    }, "start").to(this.containerMain, {
      scaleX: i,
      scaleY: i,
      x: e.left - o.left,
      y: e.top - o.top - r
    }, "start").to([this.topBar, this.bagHeaderCountSpan, this.bagHeaderIconSvg, this.bagHeaderClose, this.bagContainFooterP], {
      autoAlpha: 1,
      y: 0
    }, "start").to(this.paths, {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: .1
    }, "start").to("[data-bag-contain-bag] .bag-items", {
      xPercent: 0,
      autoAlpha: 1
    }, "start").to(".container-bag__main .top-bar", { autoAlpha: 1, x: 0 }, "start");
  }
  
  animationCloseDesktop() {
    t.timeline({
      defaults: { duration: 1.1, ease: "power2.inOut" }, onStart: () => {
        t.set(this.bag, { zIndex: -1, pointerEvents: "none" }), t.set(this.containerBox, {
          zIndex: 1,
          pointerEvents: "auto"
        }), t.set(this.containerMain, {
          borderRadius: "0px",
          overflow: "auto",
          pointerEvents: "auto",
          transformOrigin: "top left"
        }), t.set("body", { backgroundColor: "#E8E8E8" });
      }, onComplete: () => {
        var a;
        t.set(this.containerMain, {
          position: "unset",
          overflow: "visible",
          zIndex: 0
        }), this.containerMain.style.transform = "none", this.containerMain.classList.remove("is-active"), this.containerMainInside.classList.remove("is-active"), (a = this.scrollEl) == null || a.setAttribute("data-scroll-transition", "end-transition-play-scroll"), this.openBtns[0].focus();
        const o = this.getHeroComponent();
        o && o.setAttribute("data-webgl-state", "playing");
      }
    }).addLabel("start", 0).to([this.header, this.banner], {
      autoAlpha: 1,
      duration: .2
    }, "start+=0.6").to(this.containerMain, {
      scaleX: 1,
      scaleY: 1,
      x: 0,
      y: 0
    }, "start").to([this.bagHeaderCountSpan, this.bagContainFooterP, this.bagHeaderIconSvg, this.bagHeaderClose], {
      autoAlpha: 0,
      y: "100%"
    }, "start").to(this.paths, {
      opacity: 0,
      y: 100,
      duration: 1,
      stagger: .1
    }, "start").to(".container-bag__main .top-bar", { autoAlpha: 0 }, "start").to("[data-bag-contain-bag] .bag-items", {
      autoAlpha: 0,
      xPercent: 100,
      duration: 1
    }, "start");
  }
}

export { y as default };
