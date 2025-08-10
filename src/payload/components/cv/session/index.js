import _ from 'lodash';
import {delay, isElementLoaded, titleToSlug,} from '@/utils/rp_utils';
import {createTermsIfNotExist, displayAlert, loadFields, posttInit, savePost, settAutosave,} from '../../estt_form.js';
import {REST_BASE} from "@/constants/api";
import "@/styles/__select.scss";

async function getCurPosId() {
	if ((sessionStorage.getItem('cur_pos') ?? false) === false) {
		try {
			const cP = new wp.api.collections.Current_position();
			await cP.fetch();
			const id = cP.findWhere({slug: 'current-position'}).id;
			sessionStorage.setItem('cur_pos', id);
			return id;
		} catch (e) {
			throw new Error('Error getting ID of current_position');
		}
	} else {
		return sessionStorage.getItem('cur_pos');
	}
}

async function getCurrentPositions(pType) {
	const curPosId = await getCurPosId();
	return await fetch(`${REST_BASE}wp/v2/${pType}/?_fields[]=title&_fields[]=id&author=${rp.getUserId()}&current_position=${curPosId}`, {
		method: 'GET', headers: {
			'Content-Type': 'application/json',
		},
	}).then((res) => res.json());
}

async function currentPostInit(cid, ttyp, sel) {
	let pType = ttyp === 'cv' ? 'cv' : ttyp === 'academia' ? 'academia' : ttyp === 'project' ? 'project' : false;
	if (!pType) {
		throw new Error('Unrecognized Post Type');
	}
	const toAppend = document.querySelector(sel);
	try {
		const currentPositions = await getCurrentPositions(pType);
		for (const element of currentPositions) {
			if (element['id'] == cid) {
				continue;
			}
			let id = element['id'];
			let name = 'cb_' + id;
			let title = element['title']['rendered'];
			const i = document.createElement('div');
			i.setAttribute('class', 'flex relative items-center');
			i.innerHTML = '<div class="hideaway-checkbox-group" data-target-box="' + name + '"><input id="' + name + '" type="checkbox" name="' + name + '[]" role="checkbox" class="ha-checkbox-hidden" data-post-id="' + id + '"><label class="hideaway-checkbox" for="' + name + '" ></label></div><span class="hideaway-checkbox__meta">경력 - ' + title + ' 종료하기</span>';
			const bx = toAppend.appendChild(i);
			const hc = bx
				.querySelector('[data-target-box="' + name + '"]')
			const cbt = document.querySelector('#' + name);
			hc
				.addEventListener('click', () => {
					cbt.checked = !cbt.checked;
				});
			if (!rp.isTouch()) {
				hc.addEventListener('mouseenter', () => {
					rp.setCursor('FOCUS')
				});
				hc.addEventListener('mouseleave', () => {
					rp.setCursor(null)
				});
			}
		}
	} catch (e) {
		console.log('error getting current positions');
		throw e;
	}
}

function dateFieldsInit() {
	document.querySelectorAll('[tom-date]').forEach((dateField) => {
		dateField.addEventListener('change', () => {
			dateValidator();
		});
	});
}

export async function loadFieldsCV() {
	if (window.cvEditorLoaded) {
		throw new Error('already loaded');
	}
	if ((rp.getUserId() ?? 0) < 1) {
		console.log('User Not Set');
		rp.resetUser();
		return;
	}
	const formData = await loadFields('#formSlot');
	await currentPostInit(formData.id, formData.type, '#end-currents');
	await isElementLoaded('.main-alert.message-container').then((sel) => {
		const bt = sel.querySelector('.button--dismiss');
		const mS = sel.querySelector('.alert-message');
		bt.addEventListener('click', (e) => {
			sel.classList.remove('showing');
		});
	});
	dateFieldsInit();
	const curWork = formData.otherFields.currently_working;
	const endMonth = formData.tomFields.end_month;
	const endYear = formData.tomFields.end_year;
	const endCurs = formData.otherFields.end_currents;
	const isWork = document.querySelector('#is_working');
	isWork.addEventListener('click', () => {
		curWork.checked = !curWork.checked;
	});
	if (!rp.isTouch()) {
		isWork.addEventListener('mouseenter', () => {
			rp.setCursor('FOCUS');
		});
		isWork.addEventListener('mouseleave', () => {
			rp.setCursor(null);
		});
	}
	curWork.addEventListener('change', () => {
		if (curWork.checked === true) {
			endMonth.clear();
			endYear.clear();
			endYear.disable();
			endMonth.disable();
			endCurs.classList.remove('hidden');
		} else {
			endMonth.enable();
			endYear.enable();
			endCurs.classList.add('hidden');
		}
	});
	
	document
		.querySelector('.brxe-brf-pro-forms.form-loading')
		?.classList.remove('form-loading');
	document.body.setAttribute('data-popup-open', '');
	window.lnis.stop();
	await estt_cv_edit(formData);
	window.cvEditorLoaded = true;
}

function validateEmptyFields(ar) {
	const currentlyWorking = ar.otherFields.currently_working;
	const startMonth = ar.tomFields.start_month;
	const startYear = ar.tomFields.start_year;
	const endMonth = ar.tomFields.end_month;
	const endYear = ar.tomFields.end_year;
	const failedToms = [];
	var isGood = true;
	document.querySelectorAll('[data-form-tom][required]').forEach((tom) => {
		if (tom.tomselect.items.length < 1) {
			if (tom.id === 'start_month' || tom.id === 'start_year') {
				failedToms.push({
					target: tom.dataset.field, msg: '시작일을 입력해주세요.',
				});
			} else {
				failedToms.push({target: tom.dataset.field, msg: '필수 항목입니다'});
			}
			isGood = false;
		}
	});
	if (!currentlyWorking.checked) {
		if (endMonth.items.length < 1) {
			failedToms.push({
				target: 'end_month', msg: '종료일을 입력해주세요.',
			});
		}
		if (endYear.items.length < 1) {
			failedToms.push({
				target: 'end_year', msg: '종료연도를 입력해주세요.',
			});
		}
		if (endYear.items[0] < startYear.items[0]) {
			failedToms.push({
				target: 'end_year', msg: 'ending date must be after starting date',
			});
		} else if (endYear.items[0] === startYear.items[0]) {
			if (parseInt(startMonth.items[0], 10) > parseInt(endMonth.items[0], 10)) {
				failedToms.push({
					target: 'start_month', msg: 'starting date must be before ending date',
				});
			}
		}
	}
	return failedToms;
}

async function displayError(errorTargets) {
	for (const error of errorTargets) {
		const fi = document.querySelector('[data-field="' + error.target + '"]').parentElement;
		const alrtMsg = fi.querySelector('.alert.message-container');
		alrtMsg.querySelector('.alert-message').textContent = error.msg;
		alrtMsg.classList.add('showing');
		await delay(14500).then(() => {
			alrtMsg.classList.remove('showing');
			gsap.set(fi.querySelector('.ts-control'), {borderColor: 'var(--red-d-1)'});
		});
	}
}

function dateValidator() {
	const sm = document.querySelector('#start_month').tomselect;
	const sY = document.querySelector('#start_year').tomselect;
	const em = document.querySelector('#end_month').tomselect;
	const ey = document.querySelector('#end_year').tomselect;
	const msgArray = [];
	if (sY.items.length < 1) {
		msgArray.push({
			target: 'start_year', msg: 'starting year must be selected',
		});
	} else {
		if (!ey.isDisabled) {
			let value = sY.getValue();
			let ettt = ey.getValue();
			if (ettt < value) {
				let t = {
					target: 'start_month', msg: 'starting date must be before ending date',
				};
				msgArray.push(t);
				console.log(t);
			} else if (ettt === value) {
				if (sm.items.length < 1) {
					msgArray.push({
						target: 'start_month', msg: 'starting month must be chosen',
					});
				} else if (em.items.length > 0) {
					if (parseInt(sm.getValue(), 10) > parseInt(em.getValue(), 10)) {
						msgArray.push({
							target: 'end_month', msg: 'starting date must be before ending date',
						});
					}
				}
			}
		}
	}
	if (msgArray.length > 0) {
		displayError(msgArray).then(() => {
		});
	}
}

async function updateCV(formSave, btn) {
	const butn = document.querySelector(btn);
	let errorMsg = [];
	if (errorMsg.length > 0) {
		let errMsg = '';
		let ttc = 0;
		errorMsg.forEach((mss) => {
			errMsg += mss;
			if (ttc === errorMsg.length - 1) {
				if (errorMsg.length > 1) {
					errMsg += ' 모두 입력이 필요해요.';
				} else {
					errMsg += ' 입력이 팔요해요.';
				}
			} else {
				errMsg += ', ';
				ttc++;
			}
		});
		
		return;
	}
	butn.classList.add('is-saving');
	let msgSt = '저장';
	if (formSave.status === 'publish') {
		msgSt = '발행';
	}
	const successMsg = '에 성공했어요.';
	const failureMsg = '에 실패했어요: ';
	
	function resultIndicator(result, msg) {
		if (result) {
			butn.classList.remove('is-saving');
			butn.classList.add('is-saved');
			window.cvSaved = true;
		} else {
			butn.classList.remove('is-saving');
			butn.classList.add('has-failed');
			window.cvSaved = false;
		}
		let msgg = {
			res: result, msg: msg,
		};
		displayAlert(msgg);
	}
	
	const baseForm = {
		title: formSave.title,
		slug: formSave.slug,
		author: formSave.author,
		content: formSave.content.rendered,
		excerpt: formSave.excerpt.rendered,
	};
	let options;
	
	switch (formSave.type) {
		case 'academia':
			options = _.merge({}, baseForm, {
				location: formSave.location,
				institution: formSave.institution,
				current_position: formSave.current_position,
				degree: formSave.degree,
				field_study: formSave.field_study,
				skill: formSave.skill,
				acf: formSave.acf,
			});
			break;
		case 'cv':
			options = _.merge({}, baseForm, {
				location: formSave.location,
				location_type: formSave.location_type,
				employment_type: formSave.employment_type,
				position: formSave.position,
				company: formSave.company,
				current_position: formSave.current_position,
				industry: formSave.industry,
				skill: formSave.skill,
				acf: formSave.acf,
			});
			break;
		case 'project':
			options = _.merge({}, baseForm, {
				location: formSave.location,
				position: formSave.position,
				current_position: formSave.current_position,
				industry: formSave.industry,
				skill: formSave.skill,
				acf: formSave.acf,
			});
			break;
	}
	
	const finalForm = parseInt(formSave.id + '', 10) > 0 ? _.assign(options, {id: formSave.id}) : options;
	const savedPost = await savePost(formSave.type, finalForm) ?? false;
	if (savedPost !== false) {
		let urll = savedPost.link;
		if (formSave.end_currents.length > 0) {
			for (const ender of formSave.end_currents) {
				const endeds = await savePost('cv', ender) ?? false;
				if (!endeds) {
					console.log('error ending current position : ' + ender);
				} else {
					console.log('success ending current position : ' + ender);
				}
			}
		}
		resultIndicator(true, msgSt + successMsg + "<a href='" + urll + "' class='link-underlined' style='margin-left:4px;font-size:13px'>글 보러가기</a>");
	} else {
		resultIndicator(false, msgSt + failureMsg);
	}
	// setTimeout(function () {
	//     window.location.assign(window.location.href.replace(window.location.search, ''));
	// }, 1000);
}

async function estt_cv_edit(ar) {
	const contentText = ar.otherFields.content;
	const excerptText = ar.otherFields.excerpt;
	const location = ar.tomFields.location;
	
	const curWork = ar.otherFields.currently_working;
	const startMonth = ar.tomFields.start_month;
	const startYear = ar.tomFields.start_year;
	const endMonth = ar.tomFields.end_month;
	const endYear = ar.tomFields.end_year;
	const skills = ar.tomFields.skill;
	if (parseInt(ar.id + '', 10) > 0) {
		const jss = await posttInit(ar.type, ar.id).catch((e) => {
			console.log('Error in getting post ' + ar.id + ' of ' + ar.type + ', error :');
			console.log(e);
			return false;
		});
		if (jss === false) return;
		console.log(jss);
		location.addOptions(jss.location, false);
		jss.location.forEach(l => location.addItem(l.id, false));
		switch (ar.type) {
			case 'cv': {
				ar.tomFields.employment_type.addItem(jss.employment_type, true);
				ar.tomFields.company.addOptions(jss.company, false);
				jss.company.forEach((c) => ar.tomFields.company.addItem(c.id, false));
				ar.tomFields.location_type.addItem(jss.location_type, true);
				ar.tomFields.position.addOptions(jss.position, true);
				jss.position.forEach((c) => ar.tomFields.position.addItem(c.id, false));
				ar.tomFields.industry.addOptions(jss.industry, true);
				jss.industry.forEach((c) => ar.tomFields.industry.addItem(c.id, false));
			}
				break;
			case 'project': {
				ar.tomFields.position.addOptions(jss.position, true);
				jss.position.forEach((c) => ar.tomFields.position.addItem(c.id, false));
				ar.tomFields.industry.addOptions(jss.industry, true);
				jss.industry.forEach((c) => ar.tomFields.industry.addItem(c.id, false));
			}
				break;
			case 'academia': {
				ar.tomFields.degree.addOptions(jss.degree, true);
				jss.degree.forEach((c) => ar.tomFields.degree.addItem(c.id, false));
				ar.tomFields.institution.addOption({id: jss.institution.id, name: jss.institution.name}, true);
				ar.tomFields.institution.addItem(jss.institution.id, false);
				ar.tomFields.major.addOptions(jss.field_study, true);
				ar.tomFields.major.addItem(jss.field_study[0].id, false);
				ar.tomFields.minor.addOptions(jss.minor, true);
				ar.tomFields.minor.addItem(jss.acf.minor[0], true);
			}
				break;
		}
		skills.addOptions(jss.skill, false);
		jss.skill.forEach(l => skills.addItem(l.id, false));
		startYear.setValue(jss.acf.start_year, true);
		startMonth.setValue(jss.acf.start_month.value, true);
		let content = jss.content.rendered;
		let excerpt = jss.excerpt.rendered;
		await import('string-strip-html').then((mod) => {
			contentText.value = mod.stripHtml(content).result;
			excerptText.value = mod.stripHtml(excerpt).result;
		});
		const isCurWork = jss.acf.currently_working;
		curWork.checked = isCurWork;
		if (!isCurWork) {
			endMonth.setValue(jss.acf.end_month.value, false);
			endYear.setValue(jss.acf.end_year, false);
		} else {
			endMonth.disable();
			endYear.disable();
		}
		const fields = document.querySelectorAll('[data-field][required]');
		const dirt = new CustomEvent('dirty');
		const arrar = {};
		for (const field of fields) {
			let dF = field.getAttribute('data-field');
			arrar[dF] = field.tomselect?.items.length ?? ('' + field.value).length;
		}
		
		function doT() {
			console.log('checking if all required fields are filled');
			let i = 1;
			Object.values(arrar).forEach((value) => {
				i *= value;
			});
			if (i > 0) {
				console.log('all filled!');
				window.dispatchEvent(dirt);
			} else {
				console.log('not filled...');
			}
		}
		
		async function deT() {
			fields.forEach((field) => {
				field.removeEventListener('change', () => {
					arrar[field.getAttribute('data-field')] = field.tomselect?.items.length ?? ('' + field.value).length;
					doT();
				});
			});
			const sId = setInterval(settAutosave, 10000, ar.id, parseInt(ar.id, 10) <= 0, await collectValues());
			sessionStorage.setItem('asID', '' + sId);
		}
		
		fields.forEach((field) => {
			field.addEventListener('change', () => {
				arrar[field.getAttribute('data-field')] = field.tomselect?.items.length ?? ('' + field.value).length;
				doT();
			});
		});
		window.addEventListener('dirty', async () => {
			await deT();
		});
	} else {
		async function firstTimeCheck(node) {
			let i = 1;
			document
				.querySelectorAll('[data-field][required][data-form-tom]')
				.forEach((tom) => {
					i *= tom.tomselect.items.length;
				});
			if (i > 0) {
				const op = {
					title: 'Draft : ' + ar.type.toUpperCase() + '',
					content: ar.otherFields.content.value,
					modified: new Date().toISOString(),
					excerpt: excerptText.value,
					author: rp.getUserId(),
					status: 'draft',
				};
				let cv;
				switch (ar.type) {
					case 'academia':
						cv = new wp.api.models.Academia(op);
						break;
					case 'cv':
						cv = new wp.api.models.cv(op);
						break;
					case 'project':
						cv = new wp.api.models.Project(op);
						break;
				}
				await cv.save().then((res) => {
					console.log(res);
					const urlee = new URL(window.location.href);
					const params = urlee.searchParams;
					params.set('storyId', res.id);
					params.delete('create');
					params.set('in_edit', '1');
					window.history.replaceState(null, null, urlee);
					window.dispatchEvent(firstTimed);
				});
			}
		}
		
		firstTimeCheck.bind(this);
		
		const firstTimed = new CustomEvent('firstTimed');
		const firstF = document.querySelector('[data-first]');
		
		firstF.addEventListener('change', firstTimeCheck);
		
		window.addEventListener('firstTimed', async () => {
			const paras = new URLSearchParams(window.location.search);
			const id = paras.get('storyId');
			const sId = setInterval(settAutosave, 10000, id, validateEmptyFields(ar).length > 0, await collectValues());
			sessionStorage.setItem('asID', '' + sId);
			firstF.removeEventListener('change', firstTimeCheck);
		}, {once: true});
	}
	
	async function collectValues() {
		const isWorking = curWork.checked;
		const toLook = new URLSearchParams(window.location.search);
		//for times - save them independently + combine the two into YYYY-MM-DD Format
		const endAnything = Array.from(document.querySelectorAll('[data-field="end_currents"] .ha-checkbox-hidden:checked')).map((cb) => {
			return {
				id: cb.dataset.postId, current_position: [], acf: {
					end_month: null, end_year: null, end_date: null, currently_working: 0,
				},
			};
		});
		const connector = ar.type === 'cv' ? ' at ' : ' from ';
		const titleS = document
			.querySelector('[data-title="0"]')
			.parentElement.querySelectorAll('.ts-wrapper .item')[0].innerText + connector + document
			.querySelector('[data-title="1"]')
			.parentElement.querySelectorAll('.ts-wrapper .item')[0].innerText;
		const slg = titleToSlug(titleS);
		const form = {
			id: toLook.get('storyId'),
			type: toLook.get('storyType'),
			title: titleS,
			excerpt: {rendered: excerptText.value + ''},
			modified: new Date().toISOString(),
			content: {rendered: contentText.value + ''},
			current_position: isWorking ? sessionStorage.getItem('cur_pos') : [],
			end_currents: endAnything,
			author: rp.getUserId(),
			skill: skills.items,
			slug: slg,
			acf: {
				start_month: startMonth.items[0],
				start_year: startYear.items[0],
				end_year: isWorking ? null : endYear.items[0],
				end_month: isWorking ? null : endMonth.items[0],
				start_date: startYear.items[0] + "" + startMonth.items[0] + '15',
				end_date: isWorking ? '21200415' : endYear.items[0] + "" + endMonth.items[0] + '15',
				currently_working: isWorking ? 1 : 0,
			},
		};
		console.log('form before merge:');
		console.log(form);
		let select;
		switch (ar.type) {
			case 'cv':
				_.merge(form, {
					employment_type: ar.tomFields.employment_type.items,
					location_type: ar.tomFields.location_type.items,
					industry: ar.tomFields.industry.items,
				});
				select = '#cvEditForm';
				break;
			case 'academia':
				_.merge(form, {
					degree: ar.tomFields.degree.items, field_study: ar.tomFields.field_study.items, acf: {
						minor: ar.tomFields.minor.items,
					},
				});
				select = '#academicForm';
				break;
			case 'project':
				_.merge(form, {
					industry: ar.tomFields.industry.items,
				});
				select = '#projectForm';
				break;
		}
		console.log('form after merge:');
		console.log(form);
		return await createTermsIfNotExist(select).then((updates) => {
			return _.merge(form, updates);
		});
	}
	
	document
		.querySelector('.js-draft')
		.addEventListener('click', async function (e) {
			e.preventDefault();
			const validation = validateEmptyFields(ar);
			if (validation.length < 1) {
				const toSave = await collectValues().then((formSave) => {
					return _.assign(formSave, {status: 'draft'});
				});
				await updateCV(toSave, '.js-draft');
			} else {
				console.log(validation);
				await displayError(validation).then(() => {
					console.log('Validation failed : ' + validation);
				});
			}
		});
	document
		.querySelector('.js-publish')
		.addEventListener('click', async function (e) {
			e.preventDefault();
			const validation = validateEmptyFields(ar);
			if (validation.length < 1) {
				const toSave = await collectValues().then((formSave) => {
					return _.assign(formSave, {status: 'publish'});
				});
				await updateCV(toSave, '.js-publish');
			} else {
				await displayError(validation).then(() => {
					console.log('Validation failed : ' + validation);
				});
			}
		});
	
	window.cvBeingEdited = true;
}
