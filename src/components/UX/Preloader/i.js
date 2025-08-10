Preloader = () => {
	let l = (0, x.Z)((l) => l.globalSettings.navigation),
		c = (0, x.Z)((l) => l.isPreloader),
		d = (0, p.useRef)(null),
		m = (0, p.useRef)(null),
		y = (0, p.useRef)(null),
		[w] = (0, p.useState)(new Date()),
		{loadAssets: E} = (function () {
			let l = (0, p.useRef)(null),
				cleanup = () => {
					l.current && l.current.remove();
				},
				c = (0, p.useCallback)(async () => {
					cleanup();
					let c = document.querySelectorAll('img[data-preloader="true"]'),
						d = document.querySelectorAll('picture[data-preloader="true"]'),
						h = [],
						p = [],
						m = [];
					for (let l = 0; l < c.length; l++) h.push(c[l]);
					for (let l = 0; l < d.length; l++) h.push(d[l]);
					if (
						((l.current = document.createElement("div")),
							l.current.classList.add(C().loadableImageContainer),
							document.body.appendChild(l.current),
							l.current)
					) {
						for (let c = 0; c < h.length; c++) {
							var g;
							let d = h[c],
								p = "PICTURE" === d.nodeName,
								_ =
									(null == d
										? void 0
										: null === (g = d.parentElement) || void 0 === g
											? void 0
											: g.nodeName) !== "PICTURE";
							if (p || _) {
								let c = d.cloneNode(!0);
								m.push(c), l.current.appendChild(c);
							}
						}
						await (0, b.Dc)(300);
						for (let l = 0; l < m.length; l++) {
							let c = m[l],
								d = "";
							if ("IMG" === c.nodeName) d = c.currentSrc;
							else {
								let l = c.querySelectorAll("img")[0];
								d = l.currentSrc;
							}
							d && !p.includes(d) && p.push(d);
						}
						return p;
					}
				}, []),
				d = (0, p.useCallback)(
					async (l) => {
						let d = await c();
						(null == d ? void 0 : d.length) &&
						(0, b.W1)({
							urls: d,
							onComplete: () => {
								l && l(), cleanup();
							},
						});
					},
					[c],
				);
			return {
				loadAssets: d,
				getSrcArrayToLoad: c,
			};
		})(),
		P = (0, x.Z)((l) => l.navigationPageItemData),
		M = (0, x.Z)((l) => l.setEnablePreloaderAnimation),
		A = (0, x.Z)((l) => l.setPreloaderAnimationType),
		O = (0, x.Z)((l) => l.cursorTheme),
		I = (0, x.Z)((l) => l.preloaderAnimationType),
		L = (0, p.useRef)(!1),
		{isHome: R} = (0, v.Z)(),
		j = null,
		N = null,
		V = null,
		D = null,
		Z = null,
		F = null;
	return ((null == l ? void 0 : l.preloader) &&
	((j = l.preloader.title1),
		(N = l.preloader.title2),
		(V = l.preloader.title3),
		(D = l.preloader.randomTexts[0]),
		(Z = l.preloader.randomTexts[1]),
		(F = l.preloader.randomTexts[2])),
		(0, p.useEffect)(() => {
			if (L.current) return;
			L.current = !0;
			let l = localStorage.getItem(T),
				c = new Date(),
				d = c.getTime();
			if (!l && R) {
				localStorage.setItem(T, "".concat(d)), A("SLOW"), M(!0);
				return;
			}
			let h = parseInt(l);
			d - h > 864e5 && R
				? (localStorage.setItem(T, "".concat(d)), A("SLOW"))
				: A("FAST"),
				M(!0);
		}, [M, A, R]),
		(0, p.useEffect)(() => {
			if (!P || "SLOW" !== I) return;
			let fire = async () => {
				await (0, b.Dc)(250), E();
			};
			fire();
		}, [E, P, I]),
		c)
		? (0, h.jsxs)("div", {
			className: g()(
				S().Preloader,
				{
					[S().debug]: !1,
				},
				{
					[S()[O]]: O,
				},
			),
			ref: y,
			children: [
				(0, h.jsxs)("div", {
					className: k,
					ref: d,
					children: [
						j &&
						N &&
						V &&
						D &&
						Z &&
						F &&
						"FAST" !== I &&
						(0, h.jsxs)(h.Fragment, {
							children: [
								(0, h.jsx)(_.Z, {
									id: "TITLE_1",
									text: j,
									className: g()(S().translatingText, S().large),
									introPosition: {
										number: 4,
										corner: "TOP_RIGHT",
										offset: {
											x: "RIGHT_1",
										},
									},
									positions: [
										{
											number: 3,
											corner: "TOP_RIGHT",
										},
										{
											number: 4,
											corner: "TOP_RIGHT",
										},
										{
											number: 3,
											corner: "TOP_LEFT",
										},
									],
									introPositionMobile: {
										number: 4,
										corner: "BOTTOM_LEFT",
									},
									positionsMobile: [
										{
											number: 1,
											corner: "BOTTOM_LEFT",
										},
										{
											number: 1,
											corner: "BOTTOM_LEFT",
											offset: {
												x: "LEFT_2",
											},
										},
										{
											number: 1,
											corner: "BOTTOM_LEFT",
											offset: {
												x: "LEFT_2",
												y: "DOWN_2",
											},
										},
									],
								}),
								(0, h.jsx)(_.Z, {
									id: "TITLE_2",
									text: N,
									className: g()(S().translatingText, S().large),
									introPosition: {
										number: 8,
										corner: "TOP_LEFT",
										offset: {
											x: "RIGHT_2",
										},
									},
									positions: [
										{
											number: 8,
											corner: "TOP_LEFT",
										},
										{
											number: 7,
											corner: "TOP_LEFT",
											offset: {
												x: "LEFT_2",
											},
										},
										{
											number: 3,
											corner: "TOP_LEFT",
											offset: {
												x: "LEFT_2",
											},
										},
									],
									introPositionMobile: {
										number: 8,
										corner: "BOTTOM_LEFT",
									},
									positionsMobile: [
										{
											number: 11,
											corner: "BOTTOM_LEFT",
										},
										{
											number: 12,
											corner: "BOTTOM_LEFT",
											offset: {
												x: "RIGHT_1",
											},
										},
										{
											number: 12,
											corner: "BOTTOM_LEFT",
											offset: {
												x: "RIGHT_1",
												y: "UP_3",
											},
										},
									],
								}),
								(0, h.jsx)(_.Z, {
									id: "TITLE_3",
									text: V,
									className: g()(S().translatingText, S().large),
									introPosition: {
										number: 21,
										corner: "TOP_LEFT",
										offset: {
											x: "LEFT_2",
										},
									},
									positions: [
										{
											number: 21,
											corner: "TOP_LEFT",
										},
										{
											number: 22,
											corner: "TOP_LEFT",
											offset: {
												x: "RIGHT_1",
											},
										},
										{
											number: 18,
											corner: "TOP_LEFT",
											offset: {
												x: "RIGHT_1",
											},
										},
									],
									introPositionMobile: {
										number: 16,
										corner: "TOP_LEFT",
									},
									positionsMobile: [
										{
											number: 13,
											corner: "TOP_LEFT",
										},
										{
											number: 13,
											corner: "TOP_LEFT",
											offset: {
												x: "LEFT_4",
											},
										},
										{
											number: 13,
											corner: "TOP_LEFT",
											offset: {
												x: "LEFT_4",
												y: "DOWN_1",
											},
										},
									],
								}),
								(0, h.jsx)(_.Z, {
									id: "RANDOM_TEXT_1",
									hideMobile: !0,
									text: D,
									className: g()(S().translatingText),
									introPosition: {
										number: 12,
										corner: "TOP_LEFT",
										offset: {
											x: "RIGHT_1",
										},
									},
									positions: [
										{
											number: 12,
											corner: "TOP_LEFT",
										},
										{
											number: 11,
											corner: "TOP_LEFT",
											offset: {
												x: "LEFT_1",
											},
										},
										{
											number: 11,
											corner: "TOP_LEFT",
											offset: {
												x: "LEFT_5",
											},
										},
									],
								}),
								(0, h.jsx)(_.Z, {
									id: "RANDOM_TEXT_2",
									hideMobile: !0,
									text: Z,
									className: g()(S().translatingText),
									introPosition: {
										number: 11,
										corner: "BOTTOM_LEFT",
										offset: {
											x: "RIGHT_3",
										},
									},
									positions: [
										{
											number: 11,
											corner: "BOTTOM_LEFT",
										},
										{
											number: 11,
											corner: "BOTTOM_LEFT",
											offset: {
												y: "DOWN_1",
											},
										},
										{
											number: 11,
											corner: "BOTTOM_LEFT",
											offset: {
												y: "DOWN_1",
												x: "LEFT_1",
											},
										},
									],
								}),
								(0, h.jsx)(_.Z, {
									id: "RANDOM_TEXT_3",
									hideMobile: !0,
									text: F,
									className: g()(S().translatingText),
									introPosition: {
										number: 17,
										corner: "TOP_RIGHT",
										offset: {
											x: "LEFT_2",
										},
									},
									positions: [
										{
											number: 17,
											corner: "TOP_RIGHT",
										},
										{
											number: 18,
											corner: "TOP_RIGHT",
											offset: {
												x: "RIGHT_2",
											},
										},
										{
											number: 18,
											corner: "TOP_RIGHT",
											offset: {
												x: "RIGHT_2",
												y: "DOWN_1",
											},
										},
									],
								}),
								(0, h.jsx)(_.Z, {
									id: "RANDOM_TEXT_4",
									hideMobile: !0,
									text: ""
										.concat(
											w.getHours() > 12 ? w.getHours() - 12 : w.getHours(),
											":",
										)
										.concat(
											10 > w.getMinutes()
												? "0".concat(w.getMinutes())
												: w.getMinutes(),
											" ",
										)
										.concat(
											new Date()
												.toLocaleTimeString("en-us", {
													timeZoneName: "short",
												})
												.split(" ")[2],
										),
									className: g()(S().translatingText),
									introPosition: {
										number: 12,
										corner: "BOTTOM_RIGHT",
										offset: {
											x: "RIGHT_2",
										},
									},
									positions: [
										{
											number: 12,
											corner: "BOTTOM_RIGHT",
											offset: {
												x: "RIGHT_1",
											},
										},
										{
											number: 23,
											corner: "BOTTOM_LEFT",
										},
										{
											number: 21,
											corner: "TOP_LEFT",
										},
									],
								}),
							],
						}),
						Array(12)
							.fill(null)
							.map((l, c) =>
								(0, h.jsxs)(
									"span",
									{
										className: S().gridPositioningBox,
										"data-grid-box": c + 1,
										children: [
											(0, h.jsx)("span", {
												"data-position": "TOP_LEFT",
											}),
											(0, h.jsx)("span", {
												"data-position": "TOP_RIGHT",
											}),
											(0, h.jsx)("span", {
												"data-position": "BOTTOM_LEFT",
											}),
											(0, h.jsx)("span", {
												"data-position": "BOTTOM_RIGHT",
											}),
											(0, h.jsx)("span", {
												className: S().gridPositioningBox__number,
												children: c + 1,
											}),
										],
									},
									c,
								),
							),
					],
				}),
				(0, h.jsx)("div", {
					className: S().rightContent,
					ref: m,
					children: Array(12)
						.fill(null)
						.map((l, c) =>
							(0, h.jsxs)(
								"span",
								{
									className: S().gridPositioningBox,
									"data-grid-box": 12 + c + 1,
									children: [
										(0, h.jsx)("span", {
											"data-position": "TOP_LEFT",
										}),
										(0, h.jsx)("span", {
											"data-position": "TOP_RIGHT",
										}),
										(0, h.jsx)("span", {
											"data-position": "BOTTOM_LEFT",
										}),
										(0, h.jsx)("span", {
											"data-position": "BOTTOM_RIGHT",
										}),
										(0, h.jsx)("span", {
											className: S().gridPositioningBox__number,
											children: 12 + c + 1,
										}),
									],
								},
								c,
							),
						),
				}),
			],
		})
		: null;
};
