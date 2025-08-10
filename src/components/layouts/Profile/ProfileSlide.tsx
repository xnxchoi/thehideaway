"use client";
import React from "react";
import {gsap} from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import RichText from "@/payload/fields/RichText";
import {Slider} from "@/components/layouts/Profile/Slider";
import {cn} from "@/lib/utils";
import {InkedTitle} from "@/components/layouts/Profile/FVTItle";
import {
	MemberAboutLeftSlideProps,
	ProfileSlideProps,
	StickySectionProps,
} from "@/components/layouts/Profile/types";

const textureDummyData: ProfileSlideProps["textures"] = [
	{url: "/media/IMG_6521-1920x1439.webp", mimeType: "image/webp"},
	{url: "/media/IMG_6355-1920x3415.jpg", mimeType: "image/jpg"},
	{
		url: "/media/21succession-recap-articleLarge.webp",
		mimeType: "image/webp",
	},
	{url: "/media/branded_2-1200x630.webp", mimeType: "image/webp"},
];
export const ProfileSlide = ({
	places,
	name,
	bio,
	hero,
	userId,
	slides = [],
	textures = textureDummyData,
}: ProfileSlideProps) => {
	gsap.registerPlugin(ScrollTrigger);
	const marqueeTitle =
		"BRIDGING THE GAP BETWEEN THE PUBLIC AND THE INTIMATE - THE HIDEAWAY, A RESTORED PROJECT - SEOUL, BOSTON, PARIS, LONDON & LA";
	return (
		<div id={"profil"} className={"relative h-full w-full uppercase"}>
			<InkedTitle id={"blot-title"} name={name} />
			<div className={"relative z-[1]"} id={"container"}>
				<div className={cn(
					"items-center flex h-screen l-0 w-[55%] sticky top-0 justify-center",
					{"-mb-[100vh]": true},
				)}>
					<div className={"w-[20vw] aspect-[3/4] relative"}>
						<div className={"w-full h-full rounded-xl"} id={"frame"}
						     data-themed={"box-shadow, background-color"}
						     data-gl-type="about-sticky-img-slider"></div>
					</div>
				</div>
				<div className={"flex items-start"}>
					<LeftSlide bio={bio} places={places} name={name} />
					<div className={"w-1/2 relative"}>
						{slides.map((slide, index) => (
							<StickySection key={slide.title + index} title={slide.title}
							               content={slide.content} index={index} />
						))}
					</div>
				</div>
			</div>
			<Slider textures={{
				tSlide1: {
					tex: null!,
					image: {
						src: textures[0]!.url,
					},
					video: undefined,
				},
				tSlide2: {
					tex: null!,
					image: {
						src: textures[1]!.url,
					},
					video: undefined,
				},
				tSlide3: {
					tex: null!,
					image: {
						src: textures[2]!.url,
					},
					video: undefined,
				},
				tSlide4: {
					tex: null!,
					image: {
						src: textures[3]!.url,
					},
					video: undefined,
				},
			}} gradient1={hero.gradient1} gradient2={hero.gradient2} userId={userId} />
		</div>
	);
};
const LeftSlide = (props: MemberAboutLeftSlideProps) => {
	const {places, name, bio} = props;
	return (
		<div className={
			"flex items-center justify-center sticky top-0 left-0 w-1/2 h-screen"
		}>
			<div className={"w-full h-full relative"}>
				<div className={"p-[3.125vw] w-full h-full"}>
					<div className={"w-[80%]"}>
						<p className={
							"tracking-[-0.025em] leading-[1.2] text-[max(1.875vw,22px)]"
						}>
							{bio}
						</p>
					</div>
				</div>
				<div className={
					"h-full justify-between flex items-center w-[max(1.041vw,10px)] top-0 right-[.25em] bottom-0 absolute"
				} style={{
					paddingTop: "max(0.781vw,10px)",
					paddingBottom: "max(0.781vw,10px)",
					writingMode: "vertical-rl",
				}}>
					<div className={
						"justify-center flex items-center pr-[.06em] w-[max(1.041vw,10px)] text-[max(.729vw,13px)] uppercase"
					}>
						{places &&
							places.length > 0 &&
							places.slice(0, 3).reduce(
								(prev, currentValue, index) =>
									index === 0
										? prev + currentValue
										: prev + " - " + currentValue,
								"",
							)}
					</div>
					<div className={
						"justify-center flex items-center pr-[.06em] w-[max(1.041vw,10px)] text-[max(.729vw,13px)] uppercase"
					}>
						{name}
					</div>
				</div>
			</div>
		</div>
	);
};
const StickySection = (props: StickySectionProps) => {
	return (
		<div ref={props.ref} data-slide={props.index} className={"sticky top-0 h-screen"} style={{
			paddingTop: `calc(3.125vw * 2 * ${props.index} - 3.125vw * var(--f2) * .5 * ${props.index})`,
		}}>
			<div className={
				"items-center flex h-full py-0 px-[3.125vw] relative w-full bg-[#f4f4f4] dark:bg-[#0f0a0a] rounded-xl overflow-hidden"
			} data-themed={"background-color, color"}>
				<div className={
					"w-full top-0 absolute flex items-center h-[calc(3.125vw*2*1-3.125vw*var(--f2)*.5*1)]"
				}>
					<div className={"w-[3.125vw]"} style={{letterSpacing: ".075em"}}>
						({props.index + 1})
					</div>
					<h2 className={"pb-[.05em] text-[max(1.25vw,18px)] italic opacity-100"}
					    style={{textTransform: "none"}}>
						{props.title}
					</h2>
				</div>
				<div className={"w-[90%] pl-[3.125vw]"}>
					<div>
						<div className={"leading-[1.4]"} style={{textTransform: "none"}}>
							{props.content && <RichText data={{root: props.content}} />}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
