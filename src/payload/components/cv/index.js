import {loadFieldsCV} from './session';
import {Modal} from "@/modals";
import Lenis from "lenis";
import {USER_API} from "@/constants/api";
import {RP_CV} from "@/elements/RP_CV";
import {editorButtons} from "@/controlbar";

export async function rp_cv() {
	import('@/styles/__cv.scss');
	const user = rp.getUserId();
	const cAuth = await fetch(`${USER_API.AUTHOR}?storyId=` + window.bricksData.postId, {
		method: 'GET', headers: {
			'X-WP-Nonce': `${h_a.nonce}`, 'Content-Type': 'application/json',
		},
	}).then((res) => res.json());
	const cta = document.querySelector('#cvSection') ?? false;
	if (cta === false) {
		console.log('no valid container passed for cv');
		return;
	}
	const c = new RP_CV({id: parseInt(cAuth.author, 10), isAuthor: cAuth.isAuthor, container: cta});
	await c.init();
	if (!cAuth.isAuthor) {
		return;
	}
	const cvM = new Modal({
		container: '#cvEditorSL', id: 'cvModal', header: true, alert: true, footer: true,
	});
	cvM.slot.setAttribute('class', 'cveditform');
	cvM.inner.setAttribute('style', ' max-width: 840px;height: 100%;max-height: 90vh;position: relative;z-index: 9999;padding-top: 0;padding-bottom: 0;border: 0;border-style: none;border-color: var(--blanche-t-3);border-radius: 4px;height: 85vh;flex-direction: column;width: 100%;display: flex;');
	cvM.header.setAttribute('class', 'cv-edit-header');
	cvM.header.setAttribute('id', 'estate-topdown');
	cvM.header.innerHTML = '<div id="estate-hud-l" class="estate-topdown__hud-l"><h3 style="font-size:var(--font-h4)"> 경력 <span class="cv-edit-type"></span></h3></div><div id="estate-hud-r" class="estate-topdown__hud-r"></div>';
	cvM.footer.setAttribute('class', 'cv-edit-footer');
	cvM.footer.innerHTML = '<div class="estate-topdown__hud-l"></div><div class="estate-topdown__hud-r"><button class="js-draft rp_btn" data-state="FOCUS"><div style="font-size: 12px; position:absolute;">저장하기</div><div class="loader"><div class="checkmark draw"></div></div></button><button class="js-publish rp_btn bt_lg" type="button" data-state="FOCUS"><div style="position:absolute;font-size: 12px; ">발행하기</div><div class="loader"><div class="checkmark draw"></div></div></button></div>'
	let d = document.createElement('div');
	let e = document.createElement('div');
	let f = document.createElement('div');
	d.setAttribute('class', 'message-inner');
	cvM.alert.appendChild(d);
	d.innerHTML = '<div class="ico-svg"></div>';
	let xr = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	xr.setAttribute('viewBox', "0 0 0.3 0.3");
	xr.setAttribute('width', "17");
	xr.setAttribute('height', "17");
	xr.setAttribute('fill', "currentColor");
	xr.setAttribute('class', "bi bi-exclamation");
	let tt = '<path d="M.131.206a.019.019 0 1 1 .037 0 .019.019 0 0 1-.037 0zM.133.094a.017.017 0 1 1 .034 0L.16.16a.01.01 0 0 1-.021 0L.133.094z"></path>';
	d.children[0].appendChild(xr);
	xr.innerHTML = tt;
	cvM.alertMessage = d.appendChild(e);
	cvM.alertMessage.setAttribute('class', 'alert-message');
	cvM.alertBtn = cvM.alert.appendChild(f);
	cvM.alertBtn.setAttribute('class', 'button--dismiss');
	let bgg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
	bgg.setAttribute('viewBox', "0 0 17 16");
	bgg.setAttribute('width', "12");
	bgg.setAttribute('height', "12");
	bgg.setAttribute('fill', "none");
	cvM.alertBtn.appendChild(bgg);
	bgg.innerHTML = '<rect y="14.3154" width="20.2454" height="2.38181" rx="1.1909" transform="rotate(-45 0 14.3154)" fill="currentColor"></rect><rect x="1.68555" width="20.2454" height="2.38181" rx="1.1909" transform="rotate(45 1.68555 0)" fill="currentColor"></rect>';
	window.cvEditorLoaded = false;
	window.cvSaved = false;
	const cvBtn = '.cv-load-more';
	document.body.classList.add('cv-page');
	if (!(rp.isMobile() && rp.isTouch())) {
		document
			.querySelectorAll('.js-publish,.js-draft').forEach((e) => {
			e.addEventListener('mouseenter', () => {
				rp.setCursor('FOCUS');
			}, {passive: true});
			e.addEventListener('mouseleave', (e) => {
				rp.setCursor(null);
			}, {passive: true});
		});
	}
	document.querySelectorAll('[data-post-type][data-edit]').forEach((cv) => {
		cv.addEventListener('click', async function (e) {
			let rl = new URL(window.location.href);
			rl.searchParams.set('storyType', cv.getAttribute('data-post-type'));
			const eType = cv.getAttribute('data-edit');
			switch (eType) {
				case 'new':
					rl.searchParams.set('create', '1');
					break;
				case 'edit':
					rl.searchParams.set('in_edit', '1');
					const cI = cv.getAttribute('data-post-id');
					if ((cI ?? false) !== false) {
						rl.searchParams.set('storyId', cI);
					} else {
						throw new Error('Story Id missing');
					}
					break;
				default:
					throw new Error('Something missing');
			}
			window.history.replaceState(null, null, rl);
			try {
				await loadFieldsCV();
				await loader(eType === 'new');
			} catch (error) {
				console.log(error);
			}
		});
	});
	const ss = new URL(window.location.href);
	const url = ss.searchParams;
	if (url.has('storyType')) {
		if (url.has('create') || (url.has('in_edit') && url.has('storyId'))) {
			try {
				await loadFieldsCV();
				url.has('create') ? await loader(true) : await loader(false);
			} catch (error) {
				console.log(error);
			}
		}
	}
	
	async function loader(isNew = false) {
		gsap.to('.float-section', {y: '100%', duration: 0.4, ease: 'expo.inOut'});
		
		document.querySelector('.cv-edit-type').textContent = isNew ? '추가하기' : '수정하기';
		const urls = new URL(window.location.href);
		window.history.replaceState(null, null, urls);
		await window.reloadLayout(editorButtons());
		const formSlot = cvM.slot;
		const frm = formSlot.querySelector('form');
		cvM.scroller = new Lenis({
			wrapper: formSlot, content: frm, syncTouch: true,
		});
		
		function raf(time) {
			cvM.scroller.raf(time);
			requestAnimationFrame(raf);
		}
		
		requestAnimationFrame(raf);
		await cvM.toggle(true).then(() => gsap.to('.float-section', {
			y: '0', duration: 0.4, ease: 'expo.inOut'
		}));
		
	}
}
