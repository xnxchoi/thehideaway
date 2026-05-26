import { g as s } from "./tools.js";

class n extends HTMLElement {
  constructor() {
    super(), this.announcement = [...this.querySelectorAll("[data-announcement]")], this.current = 0, this.timing = parseInt(this.getAttribute("data-timing"), 10) || 3e3, this.close = this.querySelector("[data-banner-close]"), this.interval = null, this.isMobile = window.matchMedia("(max-width: 768px)").matches, this.headerLogo = document.querySelector("[data-logo-header]");
  }
  
  connectedCallback() {
    s(this) === null && (this.isMobile || (this.interval = setInterval(this.handleInterval.bind(this), this.timing)), this.close && this.close.addEventListener("click", this.handleClose.bind(this)));
  }
  
  disconnectedCallback() {
    this.interval && clearInterval(this.interval);
  }
  
  handleInterval() {
    this.oldCurrent = this.current, this.current = (this.current + 1) % this.announcement.length, this.announcement.forEach((t, e) => {
      e == this.current ? (t.classList.add("is-active"), t.classList.remove("is-reset")) : e == this.oldCurrent && (t.classList.add("is-out"), setTimeout(() => {
        t.classList.add("is-reset"), t.classList.remove("is-active"), t.classList.remove("is-out");
      }, 300));
    });
  }
  
  handleClose() {
    this.classList.add("is-hidden"), this.headerLogo.classList.add("is-animate"), this.headerLogo.classList.remove("is-announcement"), setTimeout(() => {
      this.headerLogo.classList.remove("is-animate");
    }, 300);
  }
}

export { n as default };
