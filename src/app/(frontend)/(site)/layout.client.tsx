"use client";

import {ReactNode, useEffect, useRef} from "react";
import {useRPStore} from "@/providers/RP_Pro";
import {AnimatePresence} from "motion/react";
import {ScrollIndicator} from "@/components/UX/ScrollIndicator";
import {useNotifications} from "@/providers/Notifications";

import {useRPSession} from "@/lib/auth/session/RP_SessionProvider";
import {useVoyageur} from "@/stores/Routing/RP_Voyageur";

// import dynamic from "next/dynamic";
// const LoaderLottie = dynamic(
//   () => import("@/components/UX/Loader/LoaderLottie"),
//   { ssr: false },
// );
export function Layout(l: { children: ReactNode }) {
	const {children} = l;

	const setNotifications = useNotifications();
	const pageType = useVoyageur((r) => r.pageType);
	const pageSlug = useVoyageur((r) => r.slug);
	const lastPage = useRef({
		type: pageType,
		slug: pageSlug,
	});
	const setPageIsTransitioning = useRPStore((l) => l.setPageIsTransitioning);
	const canInteract = useRPStore((l) => l.canInteract);
	const isPreloader = useRPStore((l) => l.isPreloader);
	const user = useRPSession((l) => l);
	const lastFetched = useRef<string>("2021-01-03T00:00:00.000Z");
	const to = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(() => {
		const {type, slug} = lastPage.current;
		if (type !== pageType || slug !== pageSlug) {
			to.current && clearTimeout(to.current);
			to.current = setTimeout(() => setPageIsTransitioning(false), 400);
		}
		lastPage.current = {
			type: pageType,
			slug: pageSlug,
		};
	}, [pageType, pageSlug, setPageIsTransitioning]);
	// const { data, isLoading } = useQuery({
	//   queryKey: ["notifications"],
	//   queryFn: async () => {
	//     const response = await fetch(
	//       `${process.env.NEXT_PUBLIC_SERVER_URL}/api/notifications/me?timestamp=${lastFetched.current}`,
	//       {
	//         method: "POST",
	//         headers: {
	//           "Content-Type": "application/json",
	//         },
	//         credentials: "include",
	//       },
	//     );
	//     if (!response.ok) {
	//       throw new Error("Failed to fetch notifications");
	//     }
	//     const data = await response.json();
	//     return data;
	//   },
	//   enabled: !!id,
	//   staleTime: 1000 * 60 * 5,
	// });
	// useEffect(() => {
	//   if (isLoading) {
	//     return;
	//   }
	//   lastFetched.current = DateTime.utc().toISO();
	//   data && data.notifications && setNotifications(data.notifications);
	// }, [isLoading, data, setNotifications]);
	useEffect(() => {
		if (isPreloader) {
			document.body.dataset.enableInteraction = "false";
			return;
		}
		document.body.dataset.enableInteraction = `${canInteract}`;
	}, [isPreloader, canInteract]);

	const containerRef = useRef<HTMLDivElement>(null!);

	return (
		<div ref={containerRef} className="rp-container" data-themed={"background-color"}>
			<AnimatePresence mode="sync" propagate={true}>
				{children}
			</AnimatePresence>
			<ScrollIndicator />
		</div>
	);
}
