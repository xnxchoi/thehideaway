import {number} from 'zod'

export
type
HighLighterStore = {
	MAXLEN: number,
	STORAGE: {},
}
const Highlighter = {
	CLASSNAME: 'highlighted',
	CONTAINER: document.querySelector('.note-content'),
	STORAGE: {},
	MAXLEN: 200,
	ISANDROID: navigator.userAgent.match(/android\s\d+;/i) ? true : false,
	genId: () => 'H' + Date.now().toString() + Math.random().toString(36).substr(2),
	getId(range) {
		let id = null;
		if (range.startContainer.nodeType == 3) {
			let p = range.startContainer.parentElement;
			if (p && p.matches('[class~="' + this.CLASSNAME + '"]')) return p.getAttribute('data-id');
		}
		if (range.endContainer.nodeType == 3) {
			let p = range.endContainer.parentElement;
			if (p && p.matches('[class~="' + this.CLASSNAME + '"]')) return p.getAttribute('data-id');
		}
		for (node of range.getNodes()) {
			if (node.nodeType != 1) continue;
			if (!node.matches('[class~="' + this.CLASSNAME + '"]')) continue;
			id = node.getAttribute('data-id');
			break;
		}
		return id;
	},
	save(range) {
		const id = this.getId(range);
		if (!id) return false;
		this.STORAGE[id] = range;
		return true;
	},
	restore(id, range) {
		const restored = this.STORAGE[id];
		if (!restored) return false;
		range.setStart(restored.startContainer, restored.startOffset);
		range.setEnd(restored.endContainer, restored.endOffset);
		return true;
	},
	mark(range, id, extraClass) {
		let wrapper = document.createElement('mark');
		wrapper.setAttribute('data-id', id);
		wrapper.className = [this.CLASSNAME].concat(extraClass).filter(x => x).join(' ');
		try {
			range.surroundContents(wrapper);
		} catch (e) {
			let nodes = range.getNodes().filter(node => node.nodeType == 3);
			nodes.forEach(node => {
				let newRange = new Range;
				newRange.selectNode(node);
				if (node === nodes[0] && node === range.startContainer) {
					newRange.setStart(range.startContainer, range.startOffset);
				} else if (node === nodes[nodes.length - 1] && node === range.endContainer) {
					newRange.setEnd(range.endContainer, range.endOffset);
				}
				newRange.surroundContents(wrapper.cloneNode());
			});
		}
		this.save(range);
		let first = document.querySelector('[data-id="' + id + '"]');
		if (first) {
			let classes = first.className.split(' ');
			if (classes.indexOf('icon') < 0) classes.push('icon');
			first.className = classes.join(' ');
		}
	},
	unmark(range) {
		let nodes = range.getNodes().filter(node => {
			return (node.nodeType == 1 && node.matches('[class~="' + this.CLASSNAME + '"]'));
		});
		const id = this.getId(range);
		nodes.forEach(node => {
			let newNode;
			while (node.firstChild) {
				newNode = node.firstChild;
				node.before(newNode);
			}
			range.setEndAfter(newNode);
			node.remove();
		});
		try {
			range.commonAncestorContainer.normalize();
		} catch (e) {
		}
		delete this.STORAGE[id];
	},
	get(chk) {
		return this.STORAGE[(typeof chk == 'object') ? this.getId(chk) : chk] || null;
	},
	isIntersected(range) {
		let intersected = false;
		for (id in this.STORAGE) {
			intersected = intersected || this.STORAGE[id].isIntersect(range);
			if (intersected) break;
		}
		return intersected;
	},
};
Range.TOKENLEN = 20;
Object.assign(Range.prototype, {
	deserialize(container, serialized, content) {
		const data = JSON.parse(serialized);
		let ancestor = container;
		if (data[0]) {
			ancestor = container.querySelector(data[0]);
			if (!ancestor) {
				let path = data[0].split('>');
				path = path.splice(0, path.length - 1).join('>');
				if (path) ancestor = container.querySelector(path);
				if (!ancestor) ancestor = container;
			}
		}
		const start = {
			type: 'start',
			keyword: content.substr(0, Range.TOKENLEN),
			orgKeyword: content.substr(0, Range.TOKENLEN),
			on: false, remain: '',
			startNode: null, endNode: null, startOffset: null, endOffset: null
		};
		const end = {
			type: 'end',
			keyword: content.substr(-1 * Range.TOKENLEN),
			orgKeyword: content.substr(-1 * Range.TOKENLEN),
			on: false, remain: '',
			startNode: null, endNode: null, startOffset: null, endOffset: null
		};
		const searchInNode = (info, node) => {
			let token, len, index, found = false, matchInNode = false;
			for (let i = 0; i < node.length; i++) {
				if (info.on) {
					if (info.remain.length > 0) {
						len = (node.length - i > info.remain.length ? info.remain.length : node.length - i);
						token = info.remain.substr(0, len);
						index = node.nodeValue.indexOf(token);
						if (index > -1) {
							matchInNode = true;
							info.endNode = node;
							info.endOffset = index + len;
							info.remain = info.remain.substr(len);
							if (info.remain.length < 1) return -1;
							break;
						}
					} else {
						return -1;
					}
					if (i == (node.length - 1) && !matchInNode) {
						info.on = false;
						info.startNode = null;
						info.startOffset = null;
						info.endNode = null;
						info.endOffset = null;
						info.keyword = info.orgKeyword;
						info.remain = '';
						break;
					}
				} else {
					let content = node.nodeValue, offsetFix = 0;
					if (node.length - i > info.keyword.length) {
						len = info.keyword.length;
					} else {
						len = node.length - i;
						content = content.substr(-1 * len);
						offsetFix = i;
					}
					token = info.keyword.substr(0, len);
					index = content.indexOf(token);
					
					if (index > -1) {
						matchInNode = true;
						info.on = true;
						info.startNode = node;
						info.startOffset = index + offsetFix;
						info.endNode = node;
						info.endOffset = index + len;
						info.remain = info.keyword.substr(len);
						if (info.remain.length < 1) return -1;
						break;
					}
				}
			}
			return 0;
		};
		
		const walker = document.createTreeWalker(ancestor, NodeFilter.SHOW_TEXT, null, false);
		let resultStart, resultEnd;
		while (node = walker.nextNode()) {
			if (resultStart != -1) resultStart = searchInNode(start, node);
			if (resultEnd != -1) resultEnd = searchInNode(end, node);
			if (resultStart == -1 && resultEnd == -1) break;
		}
		
		this.setStart(start.startNode, start.startOffset);
		this.setEnd(end.endNode, end.endOffset);
	},
	serialize(container) {
		let ancestor = this.commonAncestorContainer;
		if (ancestor.nodeType != 1) ancestor = ancestor.parentElement;
		let startElement = this.startContainer;
		if (startElement.nodeType != 1) startElement = startElement.parentElement;
		let endElement = this.endContainer;
		if (endElement.nodeType != 1) endElement = endElement.parentElement;
		
		let data = [this.getSelectorTo(ancestor, container)];
		if (ancestor === startElement) data.push('');
		else data.push(this.getSelectorTo(startElement, container));
		if (startElement === endElement) data.push('');
		else data.push(this.getSelectorTo(endElement, container));
		return JSON.stringify(data);
	},
	getSelectorTo(node, container) {
		let selectors = [], current = node;
		do {
			if (current && current === container) break;
			let selector = '', className = null;
			selector = current.nodeName.toLowerCase();
			selector += current.id ? '#' + current.id : '';
			if (current.className) {
				let className = current.className.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '').split(' ');
				selector += '.' + className.join('.');
			}
			selector += ':nth-of-type(' + (this.getIndex(current, current.tagName) + 1) + ')';
			selectors.push(selector);
			current = current.parentElement;
		} while (current);
		return selectors.reverse().join('>');
	},
	getIndex(node, tagName) {
		let index = 0;
		if (node.parentNode) {
			let list = node.parentNode[tagName ? 'children' : 'childNodes'];
			for (let i = 0; i < list.length; i++) {
				if (list[i] === node) break;
				if (tagName) {
					if (list[i].tagName == tagName) index += 1;
				} else index += 1;
			}
		} else {
			let target = node;
			while (target) {
				target = target[tagName ? 'previousElementSibling' : 'previousSibling'];
				if (!target) break;
				if (tagName) {
					if (list[i].tagName == tagName) index += 1;
				} else index += 1;
			}
		}
		return index;
	},
	getNodes() {
		let self = this;
		let ancestor = this.commonAncestorContainer;
		let start = this.startContainer;
		if (start.nodeType == 1 && start.childNodes.length > 0) {
			start = start.childNodes[this.startOffset] || start;
		}
		let end = this.endContainer;
		if (end.nodeType == 1 && this.endOffset === 0 && end.previousElementSibling) {
			end = end.previousElementSibling;
			while (end.lastChild) end = end.lastChild;
		} else if (end.nodeType == 1 && this.endOffset > 0 && end.childNodes.length > 0) {
			end = end.childNodes[this.endOffset] || end;
		}
		if (ancestor === start) ancestor = ancestor.parentNode;
		
		const collectNode = (container, start, end) => {
			let walker = document.createTreeWalker(container, NodeFilter.SHOW_ALL, null, false);
			let list = [], started = false, ended = false;
			while (node = walker.nextNode()) {
				if (!started && node === start) started = true;
				if (!started) continue;
				if (started && !ended && node === end) ended = true;
				list.push(node);
				if (ended) break;
			}
			return list;
		};
		
		return collectNode(ancestor, start, end);
	},
	getText() {
		return this.toString().replace(/^\s+|\s+$/g, '');
	},
	getHtml() {
		let body = null, wrapper = null, html = '';
		if (this.commonAncestorContainer.nodeType == 3) {
			wrapper = this.commonAncestorContainer.parentNode.cloneNode();
			body = this.cloneContents();
			while (body.firstChild) wrapper.appendChild(body.firstChild);
			html = wrapper.outerHTML;
		} else {
			wrapper = document.createElement('div');
			body = this.cloneContents();
			while (body.firstChild) wrapper.appendChild(body.firstChild);
			html = wrapper.innerHTML;
		}
		return html;
	},
	isSame(range) {
		return this.getText() == range.getText();
	},
	isIntersect(range) {
		const
			sts = this.compareBoundaryPoints(Range.START_TO_START, range),
			ste = this.compareBoundaryPoints(Range.START_TO_END, range),
			ets = this.compareBoundaryPoints(Range.END_TO_START, range),
			ete = this.compareBoundaryPoints(Range.END_TO_END, range)
		;
		if (ste < 0) return false;
		if (ets > 0) return false;
		return true;
	},
});
$(document)
	.on('initialize', function () {
		if ($.meta('scrapable')) {
			$.get('https://www.longblack.co/note/1349/scrap').done(function (data) {
				var ranges = [];
				$.each(data.scrap, function () {
					// if(this.uid != "H1681712750914vxhzmnutked") return;
					try {
						var range = new Range;
						range.deserialize(Highlighter.CONTAINER, this.path, this.content);
						Highlighter.mark(range, this.uid, this.memo ? 'memo' : null);
					} catch (e) {
						console.log([e, this]);
					}
				});
				var hid = null, htop = 0, $hl = null;
				if (hid = location.hash.replace('#memoId=', '')) {
					$hl = $('[data-id="' + hid + '"]');
					if ($hl.length > 0) {
						htop = $hl.offset().top;
						htop -= $(window).height() / 3;
						if (htop < 0) htop = 0;
						$('html, body').animate({scrollTop: htop}, 'fast');
					}
				}
			});
		}
	})
	.on('selectionchange', function (ev) {
		if (!$.meta('scrapable')) return;
		var selected = null, range = null, container = Highlighter.CONTAINER;
		try {
			selected = document.getSelection();
			range = selected.getRangeAt(0);
			if ((selected.isCollapsed) || (selected.type != 'Range')) throw 'Collapsed';
			if (!container.contains(range.commonAncestorContainer)) throw 'Not Selectable';
			/* if(range.cloneContents().querySelector('.scrap.context.menu')){
				range.setEndBefore($('.scrap.context.menu')[0]);
			} */
			content = range.getText();
			if (content.length < 3) throw 'Too Shot Range';
			if (range && content.length > Highlighter.MAXLEN) {
				ev.preventDefault();
				ev.stopPropagation();
				var lwt = $(this).data('lengthWarnTimeout');
				if (!lwt) {
					$(this).trigger('error-message', ['스크랩은 ' + Highlighter.MAXLEN + '자까지 가능합니다.']);
					$(this).data('lengthWarnTimeout', true);
					setTimeout(function () {
						$(document).removeData('lengthWarnTimeout');
					}, 5000);
				}
				$(this).trigger('hide-context-menu');
				return;
			}
		} catch (e) {
			$(this).trigger('hide-context-menu');
			return;
		}
		$(this).data('rangeKeep', range);
		var msid = $(this).data('menuShowId');
		if (!msid) $(this).data('menuShowId', Date.now());
	})
	.on('touchmove', function (ev) {
		$('.scrap.context.menu').detach();
	})
	.on('showing', function (ev) {
		var prev = $(this).data('menuPrevRange');
		var current = this.getSelection().getRangeAt(0);
		if (!prev) {
			$(this).data('menuPrevRange', current);
			return;
		}
		if (prev.isSame(current)) {
			var count = $(this).data('menuRangeSame') || 0;
			count += 1;
			if (count > 3) {
				$(this).trigger('contextmenu');
			}
		} else {
			$(this).trigger('touchmove');
		}
		$(this).data('menuPrevRange', current);
	})
	.on('contextmenu', function (ev) {
		if (!Highlighter.ISANDROID) return;
		$(this).data('rangeKeep', document.getSelection().getRangeAt(0));
		$(this).trigger('show-context-menu');
	})
	.on('touchend mouseup', function (ev) {
		var id = $(this).data('menuShowId');
		if (id) $(this).trigger('show-context-menu');
	})
	.on('show-context-menu', function (ev) {
		var hasMemo = false;
		var range = $(document).data('rangeKeep');
		if (!range) return;
		
		var id = Highlighter.getId(range);
		if (id) {
			if (srcRange = Highlighter.get(id)) {
				if (!srcRange.isSame(range) && srcRange.isIntersect(range)) return;
			}
		} else if (Highlighter.isIntersected(range)) return;
		
		var $menu = $('.scrap.context.menu');
		if ($menu.length < 1) $menu = $($('#scrapMenuTpl').html()).appendTo($('#app'));
		/* var $menuParent = $(range.endContainer);
		if(!$menuParent.is('.note-content > *')) {
			if($menuParent.closest('.note-content > *').length > 0) {
				$menuParent = $menuParent.closest('.note-content > *');
				if($menuParent.next()) $menuParent = $menuParent.next();
			}
		}
		$menuParent.after($menu); */
		
		$menu.find('.item').hide();
		if (id) {
			$menu.data('id', id);
			$('[data-id="' + id + '"]').each(function () {
				hasMemo = hasMemo || $(this).hasClass('memo');
			});
			$menu.find('.cancel-scrap').show();
			$menu.find(hasMemo ? '.show-set-memo.edit' : '.show-set-memo:not(.edit)').show();
		} else {
			$menu.find('.do-scrap , .do-memo').show();
		}
		$menu.removeClass('hidden');
		$menu.trigger('set-position', [range]);
		if (Highlighter.ISANDROID) {
			if ($(this).data('menuPrevRange')) $(this).removeData('menuPrevRange');
			var mtid = $(this).data('menuTrackId');
			if (mtid) clearInterval(mtid);
			$(this).data('menuTrackId', setInterval(function () {
				$(document).trigger('showing');
			}, 100));
		}
	})
	.on('set-position', '.scrap.context.menu', function (ev, range) {
		if (!range || !range.getClientRects) return;
		var rects = range.getClientRects();
		var rect = rects[rects.length - 1];
		var cy = rect.y + rect.height + 30;
		var cx = rect.x + rect.width - $(this).width();
		var $nc = $('.note-content');
		var minx = $nc.offset().left;
		var maxx = minx + $nc.width();
		if (cx < minx) cx = minx;
		if (cx > maxx) cx = maxx;
		$(this).css({left: cx + 'px', top: cy + 'px'});
	})
	.on('click', function (ev) {
		if ($(ev.target).is('.note-content , .note-content *')) return;
		if ($(ev.target).is('input, textarea')) return;
		if ($(ev.target).is('article>.ui.dividing.header>*')) return;
		document.getSelection().removeAllRanges();
	})
	.on('scrolled', function () {
		var $menu = $('.scrap.context.menu');
		if ($menu.length > 0) {
			var range = $(document).data('rangeKeep');
			if (!range) return;
			$menu.trigger('set-position', [range]);
		}
	})
	.on('hide-context-menu', function (ev, removeRange) {
		if ($(this).data('menuShowId')) $(this).removeData('menuShowId');
		if ($(this).data('menuTrackId')) clearInterval($(this).data('menuTrackId'));
		if (removeRange) document.getSelection().removeAllRanges();
		$('.scrap.context.menu').detach();
	})
	.on('click', '.highlighted', function (ev) {
		var id = $(this).data('id');
		var range = new Range;
		Highlighter.restore(id, range);
		document.getSelection().setBaseAndExtent(
			range.startContainer,
			range.startOffset,
			range.endContainer,
			range.endOffset
		);
		setTimeout(function () {
			$(document).trigger('show-context-menu');
		}, 100);
	})
	.on('create-highlight', function (ev, range, callback) {
		var uid = Highlighter.genId();
		var path = range.serialize(Highlighter.CONTAINER);
		var text = range.getText();
		var html = range.getHtml();
		$.send(
			'https://www.longblack.co/note/1349/scrap',
			{uid: uid, path: path, text: text, html: html}
		).done(function (data) {
			Highlighter.mark(range, uid);
			if (typeof callback === 'function') {
				callback(uid);
			} else {
				$(document)
					.trigger('scrap-message', ['문장스크랩을 완료했습니다.', '/assets/icon/scrap-done.svg'])
					.trigger('hide-context-menu', [true])
				;
			}
		}).fail(function (data) {
			$(document).trigger('scrap-message', [data.message]);
		});
	})
	.on('delete-highlight', function (ev, id) {
		var range = new Range;
		Highlighter.restore(id, range);
		$.send({method: 'DELETE', url: location.pathname + '/scrap/' + id})
			.done(function (data) {
				Highlighter.unmark(range);
				$(document).trigger('scrap-message', ['스크랩을 취소했습니다.']);
				$(document).trigger('hide-context-menu', [true]);
			})
		;
	})
	.on('show-memo', function (ev, uid, memo, content) {
		var $modal = $($('#memoShowTpl').html());
		$modal.data('uid', uid);
		$modal.modal({
			onShow: function () {
				// if(uid) $modal.find('[name="uid"]').val(uid);
				$modal.find('form').attr('action', 'https://www.longblack.co/note/1349/scrap/' + uid);
				if (content) {
					var slicedContent = content.slice(0, 45);
					$modal.find('.highlighted-wrapper .content').text(slicedContent);
					if (memo) {
						$modal.find('[name="content"]').val(memo);
						$modal.find('.txt-len').text(memo.length);
						$('.button.remove-memo').removeClass('disabled');
					} else {
						$('.ui.positive.button.memo').addClass('disabled');
						$('.button.remove-memo').addClass('disabled');
					}
				}
			},
			onVisible: function () {
				setTimeout(function () {
					var $ta = $modal.find('[name="content"]');
					$ta.trigger('focus');
					$ta[0].setSelectionRange($ta.val().length, $ta.val().length);
				}, 50);
			},
			onHide: function () {
				$(document).trigger('hide-context-menu', [true]);
			},
			onHidden: function () {
				$(this).detach();
			},
			onApprove: function (btn) {
				$modal.find('.form').trigger('submit');
				$(document).trigger('scrap-message', ['메모를 추가했습니다.', '/assets/icon/memo-done.svg']);
			},
			onDeny: function () {
				$modal.modal('hide');
			},
			allowMultiple: true,
		});
		$modal.appendTo('#app');
		$modal.modal('show');
	})
	.on('click', '.cancel-scrap', function (ev) {
		ev.preventDefault();
		var $menu = $(this).closest('.scrap.context.menu');
		var id = $menu.data('id');
		$(this).trigger('delete-highlight', [id]);
	})
	.on('click', '.do-scrap', function (ev) {
		ev.preventDefault();
		var range = $(document).data('rangeKeep');
		$(this).trigger('create-highlight', [range]);
	})
	.on('click', '.do-memo', function (ev) {
		ev.preventDefault();
		var range = $(document).data('rangeKeep');
		$(this).trigger('create-highlight', [range, function (uid) {
			$.get(location.pathname + '/scrap/' + uid)
				.done(function (data) {
					$("#app").trigger('show-memo', [uid, data.scrap.memo, data.scrap.content]);
					$(document).trigger('hide-context-menu');
				})
			;
		}]);
	})
	.on('click', '.show-set-memo', function (ev) {
		ev.preventDefault();
		var $menu = $(this).closest('.scrap.context.menu');
		var uid = $menu.data('id');
		$.get(location.pathname + '/scrap/' + uid)
			.done(function (data) {
				$('#app').trigger('show-memo', [uid, data.scrap.memo, data.scrap.content]);
				$(document).trigger('hide-context-menu');
			})
		;
	})
	.on('click', '.remove-memo', function (ev) {
		ev.preventDefault();
		var uid = $(this).closest('.modal').data('uid');
		var $modal = $(this).closest('.modal');
		$.send('https://www.longblack.co/note/1349/scrap/' + uid, {content: ''})
			.done(function (data) {
				if (data.result) {
					var range = new Range;
					Highlighter.restore(uid, range);
					if (range) {
						range.getNodes().forEach(function (node) {
							if (node.nodeType != 1) return;
							$(node).removeClass('memo icon');
						});
					}
					$(document).trigger('scrap-message', ['메모를 삭제했습니다.']);
					$modal.modal('hide');
					$(document).trigger('hide-context-menu');
				}
			})
		;
	})
	.on('scrap-message', function (ev, message, imageUrl) {
		$('#app').toast({
			displayTime: 2000,
			position: 'top center',
			class: 'success',
			message: message,
			pauseOnHover: false,
			showImage: imageUrl,
			classImage: 'avatar',
		});
	})
	.on('error-message', function (ev, message) {
		$('#app').toast({
			displayTime: 2000,
			position: 'top center',
			class: 'success',
			message: message,
			pauseOnHover: false,
		}).addClass('error');
	})
	.on('before-send', '.memo-form', function (ev) {
		var $form = $(ev.target);
		if ($form.find('[name="content"]').val().length < 1) {
			$(document).trigger('scrap-message', ['메모 내용을 입력해주세요.']);
			throw $.abort;
		}
	})
	.on('success-send', '.memo-form', function (ev, data) {
		if (data.result) {
			var range = new Range;
			Highlighter.restore(data.uid, range);
			if (!range) {
				$(document).trigger('scrap-message', ['스크랩을 찾을 수 없습니다.']);
				return;
			}
			$('[data-id="' + data.uid + '"]').addClass('memo');
			$('[data-id="' + data.uid + '"]:first').addClass('icon');
			$(document).trigger('hide-context-menu', [true]);
		}
	})
	.on('keyup', '.memo-form [name="content"]', function (ev) {
		var text = $(this).val();
		var len = $(this).val().length;
		if (len === 0) {
			$('.positive.button.memo').addClass('disabled');
		}
		if (len >= 1) {
			$('.positive.button.memo').removeClass('disabled');
		}
		if (len > 200) {
			ev.preventDefault();
			$('.memo-form [name="content"]').val(text.substring(0, 200));
			return;
		}
		$(this).closest('.modal').find('.txt-len').text(len);
	})
