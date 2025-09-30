"use client";
import {RPage} from "@/components/UX/Transition";
import {SplitSection} from "@/components/sections/split-section/SplitSection";

export default function SignUpPage() {
	return (
		<RPage key={"pages_register"} type="pages" slug={["register"]} theme={"dark"}>
			<SplitSection />
		</RPage>
	);
}
