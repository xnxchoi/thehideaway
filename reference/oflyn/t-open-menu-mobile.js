import { g as t } from "./imndex.js";
import { C as i } from "./CustomEase.js";

t.registerPlugin(i);

class r extends HTMLElement {
  constructor() {
    super(), this.scrollEl = document.querySelector("t-scroll"), this.btnOpen = this.querySelector("button"), this.containerMain = document.querySelector("[data-main]"), this.header = document.querySelector("[data-header]"), this.menuMobile = document.querySelector("[data-menu-mobile]"), this.btnClose = document.querySelector("[data-menu-mobile-header-close]"), this.linkMenuMobile = [...document.querySelectorAll("[data-menu-mobile-nav] a")], this.banner = document.querySelector("t-banner"), this.paths = document.querySelectorAll("[data-menu-mobile-header-logo] path");
  }
  
  static get observedAttributes() {
    return ["data-scroll"];
  }
  
  attributeChangedCallback(a, e, o) {
    a === "data-scroll" && (o === "stop" && this.animationOpenMobile(), o === "go" && this.animationCloseMobile());
  }
  
  connectedCallback() {
    this.btnOpen && this.btnOpen.addEventListener("click", this.openMenu.bind(this)), this.btnClose && this.btnClose.addEventListener("click", this.closeMenu.bind(this));
  }
  
  disconnectedCallback() {
  }
  
  animationCloseMobile() {
    t.timeline({
      defaults: { duration: .8, ease: i.create("custom2", "0.6, 0, 0.3, 1") }, onStart: () => {
        t.set("body", {}), t.set(this.menuMobile, {
          zIndex: -1,
          pointerEvents: "none"
        }), t.set("[data-menu-mobile-main] .top-bar", { x: "100%" });
      }, onComplete: () => {
        var e, o;
        t.set("body", { overflow: "visible" }), t.set, this.containerMain, this.containerMain.style.transform = "none", (e = this.scrollEl) == null || e.setAttribute("data-scroll-transition", "end-transition-play-scroll"), (o = document.querySelector("t-filter-mobile")) == null || o.classList.remove("is-hide");
      }
    }).addLabel("start", 0).to([this.header, this.banner], {
      autoAlpha: 1,
      duration: .2
    }, "start +=0.5").to(this.linkMenuMobile, {
      autoAlpha: 0,
      y: "100%",
      duration: .4,
      stagger: .1
    }, "start").to(this.paths, {
      opacity: 0,
      y: 100,
      stagger: .1
    }, "start").to("[data-menu-mobile-main] .top-bar", { autoAlpha: 0 }, "start").to("body", { backgroundColor: "#fff" }, "start").to("[data-menu-mobile-footer] .top-bar", {
      autoAlpha: 0,
      x: "100%"
    }, "start ").to("[data-menu-mobile-footer] ul", { autoAlpha: 0 }, "start").to("[data-menu-mobile-header-close]", {
      autoAlpha: 0,
      y: "100%"
    }, "start").to(["[data-menu-mobile-header-logo] svg"], {
      autoAlpha: 0,
      y: "100%"
    }, "start").to(this.containerMain, { x: 0 }, "start");
  }
  
  animationOpenMobile() {
    t.timeline({
      defaults: { duration: .8, esase: i.create("custom3", "0.6, 0, 0.3, 1") }, onStart: () => {
        var e;
        (e = document.querySelector("t-filter-mobile")) == null || e.classList.add("is-hide"), t.set(this.paths, {
          opacity: 0,
          y: 100
        }), t.set("body", {
          backgroundColor: "#E8E8E8",
          overflow: "hidden"
        }), t.set("[data-menu-mobile-main] .top-bar", { x: 0 }), t.set(this.menuMobile, {
          zIndex: 11,
          pointerEvents: "auto"
        });
      }, onComplete: () => {
        var e;
        (e = this.scrollEl) == null || e.setAttribute("data-scroll-transition", "no");
      }
    }).addLabel("start", 0).to([this.header, this.banner], {
      autoAlpha: 0,
      duration: .2
    }, "start").to("[data-menu-mobile-header-close]", {
      autoAlpha: 1,
      y: 0
    }, "start+=0.2").to("[data-menu-mobile-main] .top-bar", { autoAlpha: 1 }, "start+=0.2").to(this.paths, {
      opacity: 1,
      y: 0,
      stagger: .1
    }, "start+=0.5").to("[data-menu-mobile-footer] .top-bar", {
      autoAlpha: 1,
      x: 0
    }, "start+=0.2").to("[data-menu-mobile-footer] ul", { autoAlpha: 1 }, "start+=0.5").to(this.linkMenuMobile, {
      autoAlpha: 1,
      y: 0,
      stagger: .2
    }, "start+=0.5").to(["[data-menu-mobile-header-logo] svg"], {
      autoAlpha: 1,
      y: 0
    }, "start+=0.5").to(this.containerMain, { x: "100%" }, "start+=0.2");
  }
  
  openMenu() {
    var a;
    (a = this.scrollEl) == null || a.setAttribute("data-scroll-transition", "menu");
  }
  
  closeMenu() {
    this.setAttribute("data-scroll", "go");
  }
}

export { r as default };
