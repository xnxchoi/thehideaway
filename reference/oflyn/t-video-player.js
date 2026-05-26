class a extends HTMLElement {
  constructor() {
    super(), this.isOpen = !1, this.isPlaying = !1, this.isMuted = !0, this.togglePlay = this.togglePlay.bind(this), this.toggleMute = this.toggleMute.bind(this), this.closePlayer = this.closePlayer.bind(this), this.handleVideoClick = this.handleVideoClick.bind(this), this.handleKeydown = this.handleKeydown.bind(this), this.updateTime = this.updateTime.bind(this), this.heroTextContainer = document.querySelector("[data-hero-text-container]"), this.header = document.querySelector("#shopify-section-header"), this.btnContainer = document.querySelector("[data-hero-btn-container]"), this.scrollElement = document.querySelector("t-scroll"), this.header = document.querySelector("[data-container-header]");
  }
  
  connectedCallback() {
    this.classList.add("fixed", "z-[100]", "w-full", "h-full", "top-0", "left-0", "opacity-0", "pointer-events-none", "bg-black/90", "transition-opacity", "duration-300"), this.setupDOM(), this.setupEventListeners();
  }
  
  disconnectedCallback() {
    this.removeEventListeners();
  }
  
  setupDOM() {
    if (this.video = this.querySelector("video"), !this.video) {
      console.error("t-video-player: Aucune vidéo trouvée dans le composant");
      return;
    }
    this.video.classList.add("w-full", "h-full", "object-cover", "aspect-[1920_/_1080]"), this.video.setAttribute("playsinline", ""), this.video.setAttribute("preload", "auto"), this.video.muted = this.isMuted, this.controlsContainer = this.querySelector("[data-controls-container]"), this.playButton = this.querySelector("[data-play-button]"), this.muteButton = this.querySelector("[data-mute-button]"), this.closeButton = this.querySelector("[data-close-button]"), this.timeDisplay = this.querySelector("[data-time-display]"), this.openButton = document.getElementById("open-video-button"), this.openButton || console.warn("Bouton d'ouverture de vidéo non trouvé");
  }
  
  setupEventListeners() {
    this.video && (this.playButton && this.playButton.addEventListener("click", e => {
      e.stopPropagation(), this.togglePlay();
    }), this.muteButton && this.muteButton.addEventListener("click", e => {
      e.stopPropagation(), this.toggleMute();
    }), this.closeButton && this.closeButton.addEventListener("click", e => {
      e.stopPropagation(), this.closePlayer();
    }), this.video.addEventListener("click", e => {
      e.stopPropagation(), this.closePlayer();
    }), this.openButton && this.openButton.addEventListener("click", e => {
      e.stopPropagation(), this.startZoomAndOpenVideo();
    }), this.video.addEventListener("timeupdate", this.updateTime), this.video.addEventListener("loadedmetadata", this.updateTime), document.addEventListener("keydown", this.handleKeydown));
  }
  
  removeEventListeners() {
    this.playButton && this.playButton.removeEventListener("click", this.togglePlay), this.muteButton && this.muteButton.removeEventListener("click", this.toggleMute), this.closeButton && this.closeButton.removeEventListener("click", this.closePlayer), this.video && (this.video.removeEventListener("click", this.handleVideoClick), this.video.removeEventListener("timeupdate", this.updateTime), this.video.removeEventListener("loadedmetadata", this.updateTime)), this.openButton && this.openButton.removeEventListener("click", this.startZoomAndOpenVideo), document.removeEventListener("keydown", this.handleKeydown);
  }
  
  togglePlay() {
    this.video && (this.video.paused ? this.video.play().catch(e => console.error("Erreur lors de la lecture:", e)) : this.video.pause(), this.updatePlayButtonState(!this.video.paused));
  }
  
  toggleMute() {
    this.video && (this.isMuted = !this.isMuted, this.video.muted = this.isMuted, this.updateMuteButtonState());
  }
  
  handleVideoClick(e) {
    e.stopPropagation(), this.togglePlay();
  }
  
  updatePlayButtonState(e) {
    if (!this.playButton) return;
    this.isPlaying = e;
    const t = this.playButton.querySelector(".play-icon"), i = this.playButton.querySelector(".pause-icon");
    e ? (t.classList.add("hidden"), t.classList.remove("block"), i.classList.add("block"), i.classList.remove("hidden")) : (t.classList.add("block"), t.classList.remove("hidden"), i.classList.add("hidden"), i.classList.remove("block"));
  }
  
  updateMuteButtonState() {
    if (!this.muteButton) return;
    const e = this.muteButton.querySelector(".mute-icon"), t = this.muteButton.querySelector(".unmute-icon");
    this.isMuted ? (e.classList.add("block"), e.classList.remove("hidden"), t.classList.add("hidden"), t.classList.remove("block")) : (e.classList.add("hidden"), e.classList.remove("block"), t.classList.add("block"), t.classList.remove("hidden"));
  }
  
  formatTime(e) {
    if (isNaN(e)) return "0:00";
    const t = Math.floor(e / 60), i = Math.floor(e % 60);
    return `${t}:${i.toString().padStart(2, "0")}`;
  }
  
  updateTime() {
    if (!this.video || !this.timeDisplay) return;
    const e = this.formatTime(this.video.currentTime), t = this.formatTime(this.video.duration);
    this.timeDisplay.textContent = `${e} / ${t}`;
  }
  
  startZoomAndOpenVideo() {
    var t, i, s, o, n;
    if ((t = this.scrollElement) == null || t.setAttribute("data-scroll-transition", "three"), this.heroThree = document.querySelector("t-hero-three"), (i = this.heroThree) == null || i.classList.add("is-full"), (s = this.heroTextContainer) == null || s.classList.add("is-full"), (o = this.header) == null || o.classList.add("is-full"), (n = this.btnContainer) == null || n.classList.add("is-full"), !this.heroThree || !this.heroThree.webgl) {
      console.warn("t-hero-three ou webgl non trouvé, impossible de zoomer"), this.openPlayer();
      return;
    }
    const e = this.heroThree.webgl.scene.mainCamera;
    if (!e) {
      console.warn("Caméra principale non trouvée, impossible de zoomer"), this.openPlayer();
      return;
    }
    e.zoomToVideoPlane(), setTimeout(() => {
      this.openPlayer();
    }, 600);
  }
  
  openPlayer() {
    this.isOpen = !0, this.classList.add("opacity-100"), this.classList.remove("pointer-events-none"), this.classList.add("pointer-events-all"), this.heroThree = document.querySelector("t-hero-three"), this.heroThree && this.heroThree.setAttribute("data-webgl-state", "paused"), this.video && (this.video.play().catch(e => console.error("Erreur lors de la lecture automatique:", e)), this.updatePlayButtonState(!this.video.paused), this.toggleMute());
  }
  
  closePlayer() {
    var t, i, s, o, n;
    this.isOpen = !1, (t = this.scrollElement) == null || t.setAttribute("data-scroll-transition", "end-transition-play-scroll"), this.heroThree = document.querySelector("t-hero-three");
    let e = null;
    (i = this.heroThree) == null || i.classList.remove("is-full"), (s = this.heroTextContainer) == null || s.classList.remove("is-full"), (o = this.header) == null || o.classList.remove("is-full"), (n = this.btnContainer) == null || n.classList.remove("is-full"), this.heroThree && this.heroThree.webgl && this.heroThree.webgl.scene && (e = this.heroThree.webgl.scene.mainCamera), e ? (e.returnFromVideoPlane(), this.classList.remove("opacity-100"), this.classList.remove("pointer-events-all"), this.classList.add("pointer-events-none"), this.heroThree && this.heroThree.setAttribute("data-webgl-state", "playing")) : (this.classList.remove("opacity-100"), this.classList.remove("pointer-events-all"), this.classList.add("pointer-events-none"), this.heroThree && this.heroThree.setAttribute("data-webgl-state", "playing")), this.video && this.video.pause();
  }
  
  handleKeydown(e) {
    if (this.isOpen) switch (e.key) {
      case"Escape":
        this.closePlayer();
        break;
      case" ":
        e.preventDefault(), this.togglePlay();
        break;
      case"m":
        this.toggleMute();
        break;
    }
  }
}

export { a as default };
