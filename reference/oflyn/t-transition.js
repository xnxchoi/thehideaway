var b = Object.defineProperty;
var k = (r, n, t) => n in r ? b(r, n, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[n] = t;
var f = (r, n, t) => k(r, typeof n != "symbol" ? n + "" : n, t);
import { g as o } from "./imndex.js";
import { C as g } from "./CustomEase.js";

o.registerPlugin(g);

class S extends HTMLElement {
  constructor() {
    super();
    f(this, "remCalc", (t, e = 16) => 1 / e * parseFloat(t) + "rem");
    this.links = [...document.querySelectorAll("a:not(.reload)")], this.location = window.location, this.scrollEL = document.querySelector("t-scroll"), this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || /android/i.test(navigator.userAgent) || window.innerWidth < 768, this.elWait = document.querySelector("[data-waiting-transition]"), this.boundFunctionListenLinks = this.functionListenLinks.bind(this), this.allLinkLanguages = [...document.querySelectorAll("[data-change-language]")], this.reloadJs = document.querySelector("t-reload-js"), this.model = document == null ? void 0 : document.querySelector("t-logo");
  }
  
  static get observedAttributes() {
    return ["data-scroll-top", "data-we-load-recommandations"];
  }
  
  attributeChangedCallback(t, e, i) {
    t === "data-scroll-top" && e != null && this.animationPage(i), t === "data-we-load-recommandations" && (this.updateLinks(), this.enableLinks());
  }
  
  connectedCallback() {
    this.listenLinks(), window.addEventListener("popstate", async () => {
      const t = window.location.href;
      t.includes("#") || (this.scrollEL.dataset.scrollTransition == "bag" ? window.location.reload() : await this.fetchPage(t));
    });
  }
  
  async functionListenLinks(t) {
    if (this.isSafari) return;
    t.preventDefault(), t.currentTarget.dataset.changeLanguage && (this.allLinkLanguages.forEach(a => {
      a.classList.remove("is-active");
    }), t.currentTarget.classList.add("is-active"));
    const i = t.currentTarget.href;
    await this.fetchPage(i);
  }
  
  listenLinks() {
    this.links.forEach(t => {
      t.addEventListener("click", this.boundFunctionListenLinks, !0);
    });
  }
  
  removeListenLinks() {
    this.links.forEach(t => {
      t.removeEventListener("click", this.boundFunctionListenLinks, !0);
    });
  }
  
  animationPage(t) {
    const e = document.querySelector("[data-main]"), i = document.querySelector("[data-main-inside]"),
      a = document.querySelector("[data-next]"), s = document.querySelector("[data-logo-header]");
    if (document.querySelector("t-3d-logo"), e) {
      const d = e.getBoundingClientRect().top + window.scrollY + window.innerHeight * .5 / 2 - s.clientHeight / 2;
      let l;
      window.innerWidth > 768 ? s != null && s.classList.contains("is-announcement") ? l = this.remCalc(40 + 37.5 + 54.4) : l = this.remCalc(40 + 37.5) : s != null && s.classList.contains("is-announcement") ? l = this.remCalc(48 + 54.4) : l = this.remCalc(61);
      const L = { angle: 0 };
      this.model, o.timeline({
        defaults: { duration: 1.1, ease: g.create("custom10", "0.6, 0, 0.3, 1") },
        onStart: () => {
          o.set(a, {
            borderRadius: "4px",
            overflow: "hidden",
            position: "fixed"
          }), o.set("[data-header]", {}), o.set(e, {
            borderRadius: "4px",
            overflow: "hidden",
            position: "fixed",
            transformOrigin: "center"
          }), o.set("body", { backgroundColor: "#E8E8E8" });
        },
        onComplete: () => {
          var p;
          e.innerHTML = a.innerHTML, a.innerHTML = "", o.set(e, {
            scale: 1,
            zIndex: 1,
            position: "relative",
            borderRadius: "0px",
            overflow: "visible"
          }), e.classList.remove("is-active");
          const u = document.querySelector("t-filter-mobile");
          u && (u.classList.add("is-hide"), u.classList.remove("is-hide")), o.set(a, {
            translateY: "100%",
            zIndex: 0,
            borderRadius: "0px"
          }), s.style.top = "", document.querySelector("[data-header]").style.paddingTop = "", (p = this.scrollEL) == null || p.setAttribute("data-scroll-transition", "end-transition-play-scroll"), this.updateLinks(), this.enableLinks();
        }
      }).addLabel("start", 0).to(e, {
        scale: .5,
        scaleX: .9,
        zIndex: -1
      }, "start").to(["[data-menu-principal-desktop]", "t-open-bag", "t-banner"], {
        y: -50,
        autoAlpha: 0,
        duration: .5
      }, "start").to(s, { top: `${d}px`, position: "fixed" }, "start").to(L, {
        duration: 1.6,
        angle: 360,
        onUpdate: () => {
          this.model && this.model.rotate(L.angle, !0);
        }
      }, "start").addLabel("middle", "start+=0.85").addLabel("header", "start+=0.85").to(["[data-menu-principal-desktop]", "t-open-bag", "t-banner"], {
        y: 0,
        autoAlpha: 1
      }, "header").to(a, { ease: "expo", translateY: 0, zIndex: 0 }, "start+=0.5").to(s, {
        ease: "expo",
        top: l,
        position: "fixed"
      }, "middle"), e.classList.add("is-active"), i == null || i.style.setProperty("--scroll-top", t), i == null || i.classList.add("is-active");
    }
  }
  
  updateLinks() {
    this.links = [...document.querySelectorAll("a:not(.reload)")], this.listenLinks();
  }
  
  disableLinks() {
    this.links.forEach(t => {
      t.classList.add("disabled"), t.style.pointerEvents = "none";
    });
  }
  
  enableLinks() {
    this.links.forEach(t => {
      t.classList.remove("disabled"), t.style.pointerEvents = "";
    });
  }
  
  async fetchPage(t) {
    var i, a, s;
    this.disableLinks(), t !== window.location.href && history.pushState(null, "", t), (i = this.elWait) == null || i.classList.add("is-active");
    const e = await fetch(t);
    if (e.ok) {
      document.documentElement.classList.add("is-loading");
      const h = await e.text();
      document.documentElement.classList.remove("is-loading"), (a = this.scrollEL) == null || a.setAttribute("data-scroll-transition", "true"), (s = this.elWait) == null || s.classList.remove("is-active");
      const m = new DOMParser().parseFromString(h, "text/html"), c = document.querySelector("[data-next]"),
        d = m.querySelector("[data-main]");
      c && d && (c.innerHTML = d.innerHTML, this.removeListenLinks());
    } else window.location.reload();
  }
  
  disconnectedCallback() {
    this.removeListenLinks();
  }
}

export { S as default };
