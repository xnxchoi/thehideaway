import { g as i } from "./tools.js";

class n extends HTMLElement {
  constructor() {
    super(), this.isLoaded = !1, this.threshold = parseFloat(this.getAttribute("data-threshold") || "0.1"), this.placeholder = this.querySelector("[data-lazy-placeholder]"), this.content = this.querySelector("[data-lazy-content]"), this.content, this.handleIntersection = this.handleIntersection.bind(this);
  }
  
  connectedCallback() {
    i(this) === null && (this.observer = new IntersectionObserver(this.handleIntersection, {
      root: null,
      rootMargin: "200px",
      threshold: this.threshold
    }), this.observer.observe(this));
  }
  
  disconnectedCallback() {
    this.observer && this.observer.disconnect();
  }
  
  handleIntersection(e) {
    e.forEach(t => {
      t.isIntersecting && !this.isLoaded && this.loadSection();
    });
  }
  
  loadSection() {
    this.isLoaded || (this.isLoaded = !0, this.observer && this.observer.unobserve(this), this.content && this.content.classList.remove("invisible"), this.placeholder && (this.placeholder.style.display = "none"), this.dispatchEvent(new CustomEvent("section:loaded")), this.initializeSectionBehavior());
  }
  
  initializeSectionBehavior() {
    setTimeout(() => {
      const e = this.querySelectorAll(".ukiyo");
      e.length > 0 && typeof Ukiyo == "function" && e.forEach(t => new Ukiyo(t)), window.dispatchEvent(new Event("resize"));
    }, 100);
  }
}

export { n as default };
