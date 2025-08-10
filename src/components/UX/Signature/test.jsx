import {useMemo, useRef} from "react";
import pathInfos from "./paths.js";

const animation = () => {
	const transitions = useMemo(
		() => pathInfos.transitions,
		[pathInfos.transitions],
	);
	const finalPaths = useMemo(() => pathInfos.final, [pathInfos.final]);
	const s_1 = useRef(null);
	const s_2 = useRef(null);
	const s_3 = useRef(null);
	const e = useRef(null);
	const a = useRef(null);
	const n = useRef(null);
	const comma = useRef(null);
	const small_s = useRef(null);
	const period = useRef(null);
	const c_1 = useRef(null);
	const c_2 = useRef(null);
	const h = useRef(null);
	const o_1 = useRef(null);
	const o_2 = useRef(null);
	const i = useRef(null);
	const anime = useMemo(() => {
		Object.fromEntries(transitions, (v, k) => {
			const anim = {
				targets: v,
				d: {
					value: finalPaths[k],
					duration: 1000,
					easing: "easeInOutSine",
				},
				loop: false,
			};
		});
	}, [transitions, finalPaths]);
};
