import { g as r } from "./imndex.js";
import { g as o } from "./tools.js";

class c extends HTMLElement {
  constructor() {
    super(), this.svg = document.querySelector(".svg-oflyn"), this.copy = document.querySelector(".svg-copyright");
  }
  
  connectedCallback() {
    if (o(this) === null && this.svg) {
      const t = { threshold: .5 };
      new IntersectionObserver(this.observerCallback.bind(this), t).observe(this.svg);
    }
  }
  
  observerCallback(e, t) {
    e.forEach(s => {
      s.isIntersecting && (this.animateSvgPaths(), t.unobserve(s.target));
    });
  }
  
  animateSvgPaths() {
    const e = this.svg.querySelectorAll("path");
    e.length && r.from(e, {
      opacity: 0, y: -100, duration: 1, ease: "power2.out", stagger: .2, onComplete: () => {
        this.copy.classList.add("is-visible");
      }
    });
  }
  
  disconnectedCallback() {
  }
}

export { c as default };
