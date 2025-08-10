export const SPLASH = {
	isSkip: !1,
	isSplashed: !1,
	animKeys: [],
	ratio: 1,
	params: {
		spFadeOutPreload: {
			value: 0,
			s: 1.2,
			d: 0.4,
			e: "power2.inOut",
			label: "FADE_OUT_PRELOAD",
		},
		spFadeIn: {
			value: 0,
			s: 1.2,
			d: 0.4,
			e: "power2.inOut",
			label: "FADE_IN",
		},
		spFadeInArchive: {
			value: 0,
			s: 1.4,
			d: 0.4,
			e: "power2.inOut",
			label: "FADE_IN_ARCHIVE",
		},
		spFadeInInkBleed: {
			value: 0,
			s: 6,
			d: 0.4,
			e: "power1.inOut",
			label: "FADE_IN_INKBLEED",
		},
		spFadeInGradient: {
			value: 0,
			s: 5,
			d: 0.4,
			e: "power4.out",
			label: "FADE_IN_GRADIENT",
		},
		spFadeInMouse: {
			value: 0,
			s: 5,
			d: 0.4,
			e: "power4.out",
			label: "FADE_IN_MOUSE",
		},
		spHomeBgNoiseAnim: {
			value: 0,
			s: 20,
			d: 0.4,
			e: "power4.out",
			label: "HOME_BG_NOISE_ANIM",
		},
	},
	once() {
		getParam("splash") && (this.isSkip = getParam("splash") === "true"),
			Object.keys(this.params).forEach((i) => {
				this.animKeys.push(i);
			}),
		this.isSkip &&
		((this.isSplashed = !0),
			Object.keys(this.params).forEach((i) => {
				const e = this.params[i];
				e.value = 1;
			}),
			$html.classList.add("is-l-skip", "is-l-s-a"),
			$html.classList.remove("is-l-s"));
	},
	onInitGui() {
	},
	onReStart() {
		(this.isSplashed = !1),
			(this.params.spFadeIn.value = 0),
			(this.params.spFadeInArchive.value = 0),
			(this.params.spFadeInInkBleed.value = 0),
			(this.params.spFadeInGradient.value = 0),
			gsap.set(".c-preload-body", {
				opacity: 1,
			}),
			gsap.set("#app", {
				opacity: 0,
			}),
			(LOADER.progress = 0),
			gsap.to(LOADER, {
				progress: 100,
				duration: 1,
				onComplete: () => {
					this.onSplash();
				},
			});
	},
	onSplash() {
		gsap.to(".c-preload-body", {
			duration: this.params.spFadeOutPreload.s * this.ratio,
			delay: this.params.spFadeOutPreload.d,
			ease: this.params.spFadeOutPreload.e,
			opacity: 0,
		}),
			setTimeout(() => {
				this.onSplashAfter();
			}, this.params.spFadeOutPreload.s * 500),
			(this.isSplashed = !0);
	},
	onSplashAfter() {
		gsap.to("#app", {
			duration: this.params.spFadeIn.s * this.ratio,
			delay: this.params.spFadeIn.d,
			ease: this.params.spFadeIn.e,
			opacity: 1,
			onComplete() {
				$html.classList.add("is-l-s-a");
			},
		}),
			gsap.to(this.params.spFadeIn, {
				duration: this.params.spFadeIn.s * this.ratio,
				delay: this.params.spFadeIn.d,
				ease: this.params.spFadeIn.e,
				value: 1,
			}),
			gsap.to(this.params.spFadeInArchive, {
				duration: this.params.spFadeInArchive.s * this.ratio,
				delay: this.params.spFadeInArchive.d,
				ease: this.params.spFadeInArchive.e,
				value: 1,
			}),
			gsap.to(this.params.spFadeInInkBleed, {
				duration: this.params.spFadeInInkBleed.s * this.ratio,
				delay: this.params.spFadeInInkBleed.d,
				ease: this.params.spFadeInInkBleed.e,
				value: 1,
			}),
			gsap.to(this.params.spFadeInGradient, {
				duration: this.params.spFadeInGradient.s * this.ratio,
				delay: this.params.spFadeInGradient.d,
				ease: this.params.spFadeInGradient.e,
				value: 1,
			}),
			gsap.to(this.params.spFadeInMouse, {
				duration: this.params.spFadeInMouse.s * this.ratio,
				delay: this.params.spFadeInMouse.d,
				ease: this.params.spFadeInMouse.e,
				value: 1,
			}),
			gsap.to(this.params.spHomeBgNoiseAnim, {
				duration: this.params.spHomeBgNoiseAnim.s * this.ratio,
				delay: this.params.spHomeBgNoiseAnim.d,
				ease: this.params.spHomeBgNoiseAnim.e,
				value: 1,
			}),
			styleTextShuffle.onInit(),
			styleTextShuffle.once(),
			styleInview.onInit(),
			styleContain.onInit(),
			styleImage.onInit(),
			WEBGL_ARCHIVE.onSplash(
				this.params.spFadeInArchive.s,
				this.params.spFadeInArchive.d,
				this.params.spFadeInArchive.e,
			),
			$html.classList.remove("is-l-s");
	},
	onInit() {
		this.isSkip || this.onInitGui(), this.onSplash();
	},
};
