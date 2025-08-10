var Elements_HighlightMenu = (e) => {
	let {
			highlightMenuPosition: t,
			handleShareHighlight: a,
			handleReadHighlight: n,
			handleSaveHighlight: i,
			handleChangeHighlightColor: s,
			currentHighlightColor: r,
		} = e,
		handleColorClick = (e) => {
			s(e);
		};
	return t
		? (0, o.jsxs)(eV, {
			highlightMenuPosition: t,
			children: [
				(0, o.jsxs)(eJ, {
					onClick: (e) => i(e),
					children: [
						"Save",
						(0, o.jsxs)(eX, {
							children: [
								"[",
								(0, o.jsx)("svg", {
									width: "7",
									height: "7.5",
									viewBox: "0 0 7 7.5",
									fill: "none",
									xmlns: "http://www.w3.org/2000/svg",
									children: (0, o.jsx)("path", {
										d: "M3.7 7.46C3.33 7.46 3.08 7.11 3.08 6.66C3.08 6.41 3.17 6.03 3.35 5.52C3.53 5 3.62 4.5 3.62 3.98C3.18 4.25 2.85 4.53 2.6 4.81C2.1 5.37 1.61 5.92 1.09 5.92C0.77 5.92 0.51 5.67 0.51 5.37C0.51 5.04 0.78 4.71 1.37 4.55C1.66 4.47 1.99 4.38 2.36 4.31C2.72 4.24 3.12 4.08 3.54 3.84C3.11 3.6 2.7 3.44 2.32 3.36C1.57 3.2 0.97 3.07 0.71 2.77C0.58 2.62 0.51 2.46 0.51 2.29C0.51 1.99 0.75 1.76 1.1 1.76C1.63 1.76 2.25 2.46 2.69 2.96C2.91 3.21 3.22 3.46 3.62 3.7V3.57C3.62 3.17 3.59 2.84 3.51 2.6C3.35 2.12 3.1 1.37 3.1 1.02C3.1 0.559999 3.36 0.22 3.72 0.22C4.07 0.22 4.34 0.54 4.34 1.02C4.34 1.26 4.25 1.65 4.07 2.18C3.89 2.71 3.8 3.22 3.8 3.7C4.37 3.34 4.3 3.38 4.79 2.91C5.26 2.39 5.59 2.07 5.77 1.95C5.96 1.82 6.15 1.76 6.35 1.76C6.67 1.76 6.91 1.98 6.91 2.29C6.91 2.63 6.66 2.92 6.08 3.11C5.8 3.2 5.47 3.28 5.1 3.36C4.72 3.44 4.32 3.6 3.88 3.84C4.31 4.08 4.7 4.23 5.07 4.31C5.8 4.47 6.42 4.61 6.7 4.9C6.84 5.05 6.91 5.2 6.91 5.37C6.91 5.67 6.67 5.92 6.32 5.92C5.73 5.92 4.97 4.98 4.68 4.65C4.54 4.49 4.24 4.26 3.8 3.98V4.11C3.8 4.54 3.89 5.02 4.06 5.54C4.23 6.06 4.32 6.43 4.32 6.66C4.32 7.13 4.05 7.46 3.7 7.46Z",
										fill: "#EFEFEF",
									}),
								}),
								"]",
							],
						}),
					],
				}),
				(0, o.jsxs)(eJ, {
					onClick: (e) => a(e),
					children: [
						"Share",
						(0, o.jsxs)(eX, {
							children: [
								"[",
								(0, o.jsxs)("svg", {
									width: "8",
									height: "8",
									viewBox: "0 0 11 11",
									fill: "none",
									xmlns: "http://www.w3.org/2000/svg",
									children: [
										(0, o.jsx)("path", {
											d: "M0.98223 4.62115H7.33145V10.9704H0.98223V4.62115Z",
											fill: "#EFEFEF",
										}),
										(0, o.jsx)("path", {
											d: "M4.63299 0.970398H10.9822V7.31962H9.15048L9.13914 2.80188H4.63299V0.970398Z",
											fill: "#EFEFEF",
										}),
									],
								}),
								"]",
							],
						}),
					],
				}),
				(0, o.jsxs)(eJ, {
					onClick: (e) => n(e),
					children: [
						"Speak",
						(0, o.jsxs)(eX, {
							children: [
								"[",
								(0, o.jsx)("svg", {
									width: "6",
									height: "6",
									viewBox: "0 0 6 6",
									fill: "none",
									xmlns: "http://www.w3.org/2000/svg",
									children: (0, o.jsx)("path", {
										d: "M5.5 3L0.5 0V6L5.5 3Z",
										fill: "#D9D9D9",
									}),
								}),
								"]",
							],
						}),
					],
				}),
				(0, o.jsx)(eK, {
					children: [
						"#FCFF75",
						"#9df38f",
						"#f6ad8d",
						"#8ab2fe",
						"#f797e8",
					].map((e, t) =>
						(0, o.jsx)(
							eU,
							{
								isActive: e === r,
								color: e,
								onClick: (e) => {
									e.stopPropagation();
								},
								onMouseUp: (e) => {
									e.stopPropagation();
								},
								onMouseDown: (t) => {
									t.stopPropagation(), handleColorClick(e);
								},
							},
							t,
						),
					),
				}),
			],
		})
		: null;
};
const Content_Element = () => {
};
var Elements_Talk = (e) => {
	let {
			isSidebarOpen: t,
			openSidebar: a = null,
			isZoomingHeroImage: i = null,
			handleListen: r = null,
			activeSidebarNum: l = "-1",
			isSidebarPreview: h = !1,
			title: d = {
				text: "",
				html: (0, o.jsx)(o.Fragment, {}),
			},
			location: c,
			locationShort: m = null,
			date: u,
			label: p,
			chapterNumber: f,
			readTime: y = "",
			listenTime: b = "",
			hero: v = null,
			body: w,
			sidebars: x = [],
			preamble: k = null,
			revisited: j = null,
			interview: T = null,
			prev: _ = {},
			next: I = {},
			toggleSidebar: C = () => {
			},
			changeMenuColors: E = () => {
			},
			handleSaveHighlight: P = () => {
			},
			openSavedWindow: S = () => {
			},
			hideSavedWindow: A = () => {
			},
			isSavedWindowOpen: M = !1,
		} = e,
		H = (0, s.useRef)(null),
		O = (0, s.useRef)(null),
		N = (0, s.useRef)(null),
		B = (0, s.useRef)([]),
		W = (0, s.useRef)(null),
		L = (0, s.useRef)(null),
		F = (0, s.useRef)([]),
		z = (0, s.useRef)([]),
		[D, R] = (0, s.useState)(0),
		[q, G] = (0, s.useState)(0),
		[Q, Y] = (0, s.useState)([]),
		[Z, V] = (0, s.useState)([]),
		[J, X] = (0, s.useState)([]),
		[U, K] = (0, s.useState)([]),
		[$, ee] = (0, s.useState)([]),
		[et, ea] = (0, s.useState)([]),
		[en, ei] = (0, s.useState)([]),
		[eo, es] = (0, s.useState)([]),
		[er, el] = (0, s.useState)([]),
		[eh, ed] = (0, s.useState)(!1),
		ec = (0, s.useRef)(),
		[em, eg] = (0, s.useState)([]),
		[eu, ep] = (0, s.useState)(null),
		[ef, ey] = (0, s.useState)(null),
		[eb, ev] = (0, s.useState)([]),
		[ew, ex] = (0, s.useState)("#ffffff"),
		[ek, ej] = (0, s.useState)("#ffffff"),
		[eT, e_] = (0, s.useState)(!1),
		[eI, eC] = (0, s.useState)(!0),
		{windowProps: eE} = (0, s.useContext)(g);
	(0, s.useEffect)(() => {
		(k && i) ||
		(W.current.style.opacity = "".concat(
			Math.max(0, Math.min(1, -2 + eE.scrollY / (eE.height / 4))),
		)),
		O.current.getBoundingClientRect().bottom > 36 && E();
	}, [eE.scrollY]),
		(0, s.useEffect)(() => {
			let e = new URLSearchParams(window.location.search),
				t = e.get("progress");
			if (!t) {
				ed(!0);
				return;
			}
			if (1e4 === eE.scrollHeight || eh) return;
			let a = t.substring(0, t.length - 1),
				n = (Number(a) / 100) * eE.scrollHeight;
			ed(!0), window.scrollTo(0, n);
		}, [eE.scrollHeight]),
		(0, s.useEffect)(
			() =>
				(e_(eE.width < 900), 1e4 === eE.scrollHeight)
					? () => {
					}
					: (clearTimeout(n),
						(n = setTimeout(() => {
							let e = Math.min(
								100,
								(eE.scrollY / eE.scrollHeight) * 100,
							).toFixed(2);
							window.history.replaceState(
								null,
								null,
								"?progress=".concat(e, "%"),
							);
						}, 100)),
						() => {
							clearTimeout(n);
						}),
			[eE.scrollY, eE.scrollHeight, eE.width],
		),
		(0, s.useEffect)(() => {
			let e = O.current.querySelectorAll(".FullWidthSection");
			e.forEach((e, t) => {
				F.current[t] = e;
			});
		}, []),
		(0, s.useEffect)(() => {
			let e = 0;
			F.current.forEach((t) => {
				let a = t.getBoundingClientRect(),
					n = 0;
				a.bottom < eE.height &&
				a.bottom >= 0 &&
				(n = Math.max(a.top / eE.height, a.bottom / eE.height)),
				a.top < eE.height && a.bottom > 0 && (n = 1 - a.top / eE.height),
					(e = Math.max(e, n));
			}),
				G(e);
		}, [eE.scrollY, eE.height]),
		(0, s.useEffect)(() => {
			let e = document.querySelectorAll(
				'[id^="triggerCanvas"], [id^="triggerSidebarCanvas"]',
			);
			if (e.length < 1) return;
			let t = Array.from(e).map(
					(e, t) => (
						(z.current[t] = e),
							[
								z.current[t].dataset.image,
								z.current[t].dataset.image2 || "",
								z.current[t].dataset.image3 || "",
							]
					),
				),
				a = Array.from(e).map(
					(e, t) => (
						(z.current[t] = e),
							[
								z.current[t].dataset.aspect1 || 0.78,
								z.current[t].dataset.aspect2 || 0.78,
								z.current[t].dataset.aspect3 || 0.78,
							]
					),
				),
				n = Array.from(e).map(
					(e, t) => (
						(z.current[t] = e),
							[
								z.current[t].dataset.scale1 || 1,
								z.current[t].dataset.scale2 || 1,
								z.current[t].dataset.scale3 || 1,
							]
					),
				),
				i = Array.from(e).map(
					(e, t) => (
						(z.current[t] = e),
							[
								z.current[t].dataset.x1 || 0,
								z.current[t].dataset.x2 || 0,
								z.current[t].dataset.x3 || 0,
							]
					),
				),
				o = Array.from(e).map(
					(e, t) => (
						(z.current[t] = e),
							[
								z.current[t].dataset.y1 || 0,
								z.current[t].dataset.y2 || 0,
								z.current[t].dataset.y3 || 0,
							]
					),
				),
				s = Array.from(e).map(
					(e, t) => (
						(z.current[t] = e),
							[
								z.current[t].dataset.r1 || 0,
								z.current[t].dataset.r2 || 0,
								z.current[t].dataset.r3 || 0,
							]
					),
				),
				r = Array.from(e).map((e, t) => z.current[t].dataset.label),
				l = Array.from(e).map((e, t) => z.current[t].dataset.fig);
			es(r), el(l), V(t), X(a), K(n), ee(i), ea(o), ei(s);
		}, [z]),
		(0, s.useEffect)(() => {
			if (z.current.length < 1) return;
			let e = z.current.map((e) =>
				e ? e.getBoundingClientRect().top + eE.scrollY : () => {
				},
			);
			Y(e);
		}, [z, eE.height, eE.width, l, D]),
		(0, s.useEffect)(() => {
		}, [q, eE.height]);
	let sidebarItemClick = (e) => {
		if (!a || (a(e), !e)) return;
		let t = document.querySelector(
			"#".concat(e.currentTarget.id || e.currentTarget.dataset.id),
		);
		if (!t) return;
		let n = t.getBoundingClientRect().top + window.scrollY - 115;
		window.scrollTo({
			top: n,
			behavior: "smooth",
		});
	};
	(0, s.useEffect)(() => {
		let handleMouseUp = () => {
			let e = document.getSelection(),
				a = e.getRangeAt(0);
			!t || (a && !a.collapsed && H.current.contains(e.anchorNode)) || C();
		};
		return (
			window.addEventListener("click", handleMouseUp, !1),
				() => {
					window.removeEventListener("click", handleMouseUp, !1);
				}
		);
	}, [C]),
		(0, s.useEffect)(() => {
			if (!N.current) return () => {
			};
			let e = N.current,
				handleScroll = (e) => {
					let {
						scrollTop: t,
						scrollHeight: a,
						clientHeight: n,
					} = e.currentTarget;
					e.deltaY > 0 && a - n - t <= 10 && e.preventDefault();
				};
			return (
				e.addEventListener("wheel", handleScroll),
					() => e.removeEventListener("wheel", handleScroll)
			);
		}, [N]),
		(0, s.useEffect)(() => {
			let e = 0;
			Q.forEach((t, a) => {
				t < eE.scrollY + eE.height / 2 && (e = a);
			}),
			D !== e &&
			((W.current.style.opacity = "0"),
				setTimeout(() => {
					(W.current.style.opacity = "1"), R(e);
				}, 200));
		}, [eE.scrollY, eE.height, Q, t]),
		(0, s.useEffect)(() => {
			if (1 > Number(l) || !B.current || !N.current) return;
			let e =
				B.current[Number(l) - 1].getBoundingClientRect().top +
				N.current.scrollTop -
				35;
			N.current.scrollTo({
				top: e,
				behavior: "smooth",
			}),
				setTimeout(() => {
					if (1 > Number(l) || !B.current || !N.current) return;
					let e =
						B.current[Number(l) - 1].getBoundingClientRect().top +
						N.current.scrollTop -
						35;
					N.current.scrollTo({
						top: e,
						behavior: "smooth",
					});
				}, 10);
		}, [l, t, N]),
		(0, s.useEffect)(() => {
			if (t && N.current) {
				let e = N.current.getBoundingClientRect();
				if (e.top < 0 || e.bottom > eE.height) {
					let e = N.current.getBoundingClientRect().top + window.scrollY - 36;
					window.scrollTo({
						top: e,
						behavior: "smooth",
					});
				}
			}
		}, [t, N]);
	let updateHighlightPosition = (e) => {
			if (!e) return;
			let a = e.els
				? e.els[0].getBoundingClientRect()
				: e.getBoundingClientRect();
			e.els &&
			e.els.length > 0 &&
			e.els.forEach((e) => {
				let t = e.getBoundingClientRect();
				(a = {
					top: Math.min(a.top, t.top),
					left: Math.min(a.left, t.left),
					right: Math.max(a.right, t.right),
					width: 0,
				}).width = a.right - a.left;
			});
			let n = t ? -(window.innerWidth / 4) : 0;
			ey({
				top: a.top - 47 + (window.scrollY - eE.height * (k ? 2 : 1)),
				left: a.left + a.width / 2 - 224 - n,
			});
		},
		handleHighlightClick = (e) => {
			e.stopPropagation();
			let t = em.find((t) => {
				let a = !1;
				return (
					t.els.forEach((t) => {
						t === e.currentTarget && (a = !0);
					}),
						a
				);
			});
			ep(t), updateHighlightPosition(t);
		},
		deleteHighlight = () => {
			ey(null);
			let e = window.getSelection();
			e.removeAllRanges();
			let t = document.createRange();
			if (!eu.els) return;
			let a = eu.els[0],
				n = eu.els[eu.els.length - 1];
			t.setStartBefore(a), t.setEndAfter(n), e.addRange(t);
			let i = em.findIndex((e) => e === eu),
				o = JSON.parse(localStorage.getItem("highlights"));
			-1 !== i &&
			(em[i].els.forEach((e) => {
				let t = e.parentNode;
				if (t) {
					if ("highlighted" === e.className) {
						for (; e.firstChild;) t.insertBefore(e.firstChild, e);
						e.remove();
					}
					(e.style.backgroundImage = "none"),
						e.classList.remove("highlighted");
				}
			}),
				o.forEach((e, t) => {
					let a = "";
					em[i].els.forEach((e) => {
						a += e.innerHTML;
					}),
						em.forEach((e, t) => {
							e.selection.text === a && em.splice(t, 1);
						}),
					a === e.selection.text &&
					(o.splice(t, 1),
						localStorage.setItem("highlights", JSON.stringify(o)));
				}),
				eg((e) => {
					let t = [...e];
					return t.splice(i, 1), t;
				}),
				ep(null),
				ex("#ffffff"));
		},
		createHighlight = (e) => {
			let t = eG().getSelection(),
				a = t.getRangeAt(0);
			if (a) {
				if (
					((ec.current = eG().createHighlighter()),
					a && !a.collapsed && H.current.contains(t.anchorNode))
				) {
					let n = eG().createClassApplier("highlighted", {
							elementTagName: "span",
							normalize: !0,
						}),
						i = H.current.querySelectorAll(".highlighted");
					n.applyToSelection();
					let o = H.current.querySelectorAll(".highlighted"),
						s = [];
					o.forEach((e) => {
						Array.from(i).includes(e) || s.push(e);
					});
					let r = {
						range: a,
						els: s,
						color: e,
						selection: {
							text: t.toString(),
							before: "",
							after: "",
						},
						path: window.location.pathname,
					};
					eg((e) => [...e, r]), ep(r);
				} else ep(null), ey(null);
			}
		},
		changeCurrentHighlightColor = (e) => {
			let t = em.findIndex((e) => e === eu);
			if (-1 === t) return;
			em[t].els.forEach((t) => {
				t.style.backgroundImage = "linear-gradient(to left, "
					.concat(ek, " 0%,")
					.concat(e, " 50%)");
			}),
				(em[t].color = e);
			let a = JSON.parse(localStorage.getItem("highlights"));
			a.forEach((n) => {
				let i = "";
				em[t].els.forEach((e) => {
					i += e.innerText;
				}),
				i === n.selection.text &&
				((n.color = e),
					localStorage.setItem("highlights", JSON.stringify(a)));
			});
		};
	(0, s.useEffect)(() => {
		if (eI) return;
		let e = em.map((e) => {
			let {els: t, range: a, ...n} = e;
			return n;
		});
		localStorage.setItem("highlights", JSON.stringify(e));
	}, [em]),
		(0, s.useEffect)(() => {
			ec.current = eG().createHighlighter();
			let e = H.current,
				handleMouseUp = () => {
					let e = eG().getSelection(),
						t = e.getRangeAt(0);
					t && !t.collapsed && H.current.contains(e.anchorNode)
						? (ep(null), ex("#ffffff"), updateHighlightPosition(t.nativeRange))
						: (ep(null), ey(null));
				};
			e.addEventListener("mouseup", handleMouseUp, !1);
			let t = document.querySelectorAll(".highlighted");
			t.forEach((e) => {
				e.addEventListener("click", handleHighlightClick);
			}),
				window.addEventListener("resize", () => {
					updateHighlightPosition(eu);
				});
			let a = [];
			return (
				em.forEach((e) => {
					e.els.forEach((t) => {
						let n = t.getBoundingClientRect().top + eE.scrollY,
							i = (n / (eE.scrollHeight + 2 * eE.height)) * eE.height,
							{color: o} = e;
						a.push({
							y: i,
							color: o,
							top: n,
						});
					});
				}),
					ev(a),
					() => {
						e.removeEventListener("mouseup", handleMouseUp, !1),
							t.forEach((e) => {
								e.removeEventListener("click", handleHighlightClick);
							}),
							window.removeEventListener("resize", () => {
								updateHighlightPosition(eu);
							});
					}
			);
		}, [H, em, eE.width, eE.height, eE.scrollHeight, eu, t]),
		(0, s.useEffect)(() => {
			0 !== em.length && eu && ex(eu.color);
		}, [eu]),
		(0, s.useEffect)(() => {
			0 !== em.length &&
			eu &&
			eu.els.forEach((e) => {
				(e.style.backgroundImage = "linear-gradient(to left,"
					.concat(ek, " 0%,")
					.concat(ew, " 50%)")),
					e.classList.remove("highlighted"),
					setTimeout(() => {
						ej(ew), e.classList.add("highlighted");
					}, 10);
			});
		}, [ew]);
	let findTextNode = (e, t) => {
		let a = 0,
			traverseNodes = (e) => {
				if (e.nodeType === Node.TEXT_NODE) {
					if (a + e.length >= t)
						return {
							node: e,
							offset: t - a,
						};
					a += e.length;
				} else
					for (let t of e.childNodes) {
						let e = traverseNodes(t);
						if (e) return e;
					}
				return null;
			};
		return traverseNodes(e);
	};
	(0, s.useLayoutEffect)(() => {
		if ((eG().init(), em.length > 0)) return () => {
		};
		let e = eG().createClassApplier("highlighted", {
				elementTagName: "span",
				normalize: !0,
			}),
			applyHighlight = (t) => {
				let {text: a} = t.selection,
					n = H.current.textContent.indexOf(a),
					i = n + a.length;
				if (-1 === n) return;
				let o = findTextNode(H.current, n),
					s = findTextNode(H.current, i),
					r = eG().createRange();
				r.setStart(o.node, o.offset), r.setEnd(s.node, s.offset);
				let l = H.current.querySelectorAll(".highlighted"),
					h = [];
				e.applyToRange(r);
				let d = H.current.querySelectorAll(".highlighted");
				d.forEach((e) => {
					Array.from(l).includes(e) || h.push(e);
				}),
					h.forEach((e) => {
						(e.style.backgroundImage = "linear-gradient(to left, "
							.concat(t.color, " 0%,")
							.concat(t.color, " 50%)")),
							e.addEventListener("click", handleHighlightClick);
					});
				let c = {
						range: r,
						els: h,
						color: t.color,
						selection: {
							text: a.toString(),
							before: "",
							after: "",
						},
						path: window.location.pathname,
					},
					{startOffset: m} = r,
					{endOffset: g} = r,
					{startContainer: u} = r,
					{endContainer: p} = r;
				3 === u.nodeType && u.data
					? (c.selection.before = u.data.substring(m - 10, m))
					: u.previousSibling &&
					u.previousSibling.data &&
					(c.selection.before = u.previousSibling.data.substring(
						u.previousSibling.data.length - 10,
					)),
					3 === p.nodeType
						? (c.selection.after = p.data.substring(g, g + 10))
						: p.nextSibling &&
						p.nextSibling.data &&
						(c.selection.after = p.nextSibling.data.substring(0, 10)),
					eC(!0),
					eg((e) => [...e, c]);
			},
			t = JSON.parse(localStorage.getItem("highlights") || "[]");
		return (
			t.forEach((e) => {
				e.path === window.location.pathname && applyHighlight(e);
			}),
				setTimeout(() => eC(!1), 100),
				(eE.scrollY += 1),
				() => {
					let e = H.current.querySelectorAll(".highlighted");
					e.forEach((e) => {
						e.removeEventListener("click", handleHighlightClick);
					});
				}
		);
	}, [H]);
	let getMatchingFigNum = (e) => {
		if (null === H.current)
			return (
				setTimeout(() => {
					getMatchingFigNum(e);
				}, 20),
					""
			);
		let {id: t} = e,
			a = H.current.querySelector("#".concat(t)),
			{fig: n} = a.dataset;
		return n;
	};
	return (0, o.jsxs)(t5, {
		children: [
			(0, o.jsx)("audio", {
				ref: L,
				src: "/audio/pca/NOTHING.m4a",
			}),
			(0, o.jsxs)(t8, {
				children: [
					eE.width > 900 && (0, o.jsx)(Elements_SideGutters, {}),
					v ||
					(0, o.jsx)(TalkHero, {
						talkNumber: p,
						location: c,
						date: u,
						title: d.html,
					}),
					(0, o.jsx)(t9, {
						isSidebarOpen: t,
						ref: W,
						children:
							Z.length > 0 &&
							!eT &&
							(0, o.jsx)(Elements_ImageCanvas, {
								isSidebarOpen: t,
								imagePaths: Z,
								imageAspects: J,
								imageScales: U,
								imageXs: $,
								imageYs: et,
								imageRs: en,
								currentImage: D,
								imageLabels: eo,
								figureNumbers: er,
								heroHeightRatio: k ? 1.5 : 1,
							}),
					}),
					k
						? (0, o.jsx)(Elements_Preamble, {
							text: k.text,
							color: k.color,
							backgroundColor: k.backgroundColor,
							listenTime: b,
							readTime: y,
							handleListen: r,
						})
						: "",
					(0, o.jsx)(an, {
						isPreamble: k,
						isSidebarOpen: t,
						onClick: (e) => e.stopPropagation(),
						children: (0, o.jsx)(ao, {
							isSidebarOpen: t,
							ref: N,
							children: x.map((e, t) =>
								(0, o.jsx)(
									"span",
									{
										ref: (e) => {
											B.current[t] = e;
										},
										children: (0, o.jsx)(Elements_SidebarItemContainer, {
											openSavedWindow: S,
											fig: getMatchingFigNum(e),
											toggleSidebar: C,
											onClick: sidebarItemClick,
											number: t + 1,
											sidebarItem: e,
											isActive: Number(l) === t + 1,
										}),
									},
									t,
								),
							),
						}),
					}),
					(0, o.jsxs)(t6, {
						ref: O,
						isSidebarOpen: t,
						isPreamble: k,
						children: [
							(0, o.jsxs)(at, {
								children: [
									(0, o.jsxs)(TextRightIntro, {
										children: [
											(0, o.jsx)(Elements_TalkMeta, {
												date: u,
												location: m || c,
												talkNumber: p,
												chapterNumber: f,
											}),
											(0, o.jsx)(ae, {
												children: d.html,
											}),
										],
									}),
									(0, o.jsx)(aa, {
										ref: H,
										children: w,
									}),
								],
							}),
							(0, o.jsx)(ai, {
								onClick: sidebarItemClick,
								isSidebarPreview: h,
								isSidebarOpen: t,
							}),
							(0, o.jsx)(Elements_HighlightMenu, {
								highlightMenuPosition: ef,
								currentHighlightColor: ew,
								handleSaveHighlight: P,
								handleShareHighlight: (e) => {
									e.stopPropagation();
									let t = eG().getSelection(),
										a = t.toString();
									!a && eu && (a = eu.els.map((e) => e.innerText).join(" ")),
										navigator.clipboard.writeText(a),
										requestAnimationFrame(() => {
											alert("Copied! Go paste it wherever you want.");
										});
								},
								handleReadHighlight: (e) => {
									if ("speechSynthesis" in window) {
										let e = new SpeechSynthesisUtterance(
											document.getSelection().toString(),
										);
										(e.rate = 1),
											(e.pitch = 1),
											window.speechSynthesis.speak(e),
											window.removeEventListener("click", () =>
												window.speechSynthesis.cancel(),
											),
											window.addEventListener("click", () =>
												window.speechSynthesis.cancel(),
											);
									} else L.current.play();
									e.stopPropagation();
								},
								handleChangeHighlightColor: (e) => {
									if (e === ew) {
										deleteHighlight();
										return;
									}
									eu ? changeCurrentHighlightColor(e) : createHighlight(e),
										ex(e);
								},
							}),
							(0, o.jsx)(Elements_BottomGutters, {
								children: (0, o.jsx)(RevisitedGutter, {
									color: "#2d2d2d",
								}),
							}),
						],
					}),
				],
			}),
			j
				? (0, o.jsx)(Elements_Revisited, {
					color: j.color,
					backgroundColor: j.backgroundColor,
					changeMenuColors: E,
					title: j.title,
					text: j.text,
					location: m || c,
					talkNumber: p,
					chapterNumber: f,
				})
				: "",
			T
				? (0, o.jsx)(TalkInterview, {
					changeMenuColors: E,
					text: T.text,
					isSidebarOpen: !1,
					color: "#E7A966",
					backgroundColor: "#291B10",
				})
				: "",
			(0, o.jsx)(Elements_MiniMap, {
				highlights: eb,
			}),
			(0, o.jsx)(Elements_PrevNext, {
				prev: _,
				next: I,
				changeMenuColors: E,
				backgroundColor: "#0D0E14",
				color: "#c9c9c9",
			}),
			M &&
			(0, o.jsx)(Elements_SavedWindow, {
				hideSavedWindow: A,
			}),
			(0, o.jsx)("div", {
				style: {
					display: "block",
					height: "9px",
				},
			}),
		],
	});
};
