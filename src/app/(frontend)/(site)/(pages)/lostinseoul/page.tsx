import {ParallaxGrid} from "@/components/sections/ParallaxGrid";
import {RPage} from "@/components/UX/Transition";

export default async function Page() {
	const imagesUrl = [
		{url: "/media/IMG\_0243.jpeg"},
		{url: "/media/IMG\_4878.jpeg"},
		{url: "/media/IMG\_5206.jpeg"},
		{url: "/media/IMG\_5260.jpeg"},
		{url: "/media/IMG\_6355.jpeg"},
		{url: "/media/IMG\_6521.jpeg"},
		{url: "/media/IMG\_7569.jpeg"},
	];
	return (
		<RPage slug={["lostinseoul"]} type={"pages"}>
			<ParallaxGrid images={imagesUrl} title={"Lost in Seoul"} />
		</RPage>
	);
}
