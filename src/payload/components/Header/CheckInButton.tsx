"use client"
import {Link} from "@/components/UX/Link/Link";
import {useGSAP} from "@gsap/react";
import {gsap} from "gsap";
import * as m from "motion/react-m";
import {usePathname} from "next/navigation";
import {useEffect, useState} from "react";

export const CheckInButton = () => {
	const [isCheckInPage, setIsCheckInPage] = useState(false);
	const pathName = usePathname()
	useEffect(() => {
		setIsCheckInPage(
			pathName.includes("check-in") || pathName.includes("sign-in")
		);
	}, [pathName]);
	useGSAP(() => {
		gsap.to("#checker", {
			autoAlpha: isCheckInPage ? 0 : 1,
			duration: 0.3,
			ease: "power4.inOut"
		});
	}, [isCheckInPage]);
	return (
		<m.div
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}
			key={"checker"}
			transition={{duration: 0.3, ease: "easeOut"}}
		>
			<Link
				id={"checker"}
				className={"rp_btn bt_sm text-[12px]"}
				href={"/sign-in"}
			>
				Check In
			</Link>
		</m.div>
	);
};
