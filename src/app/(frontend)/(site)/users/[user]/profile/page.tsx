import type {Metadata} from "next";
import React from "react";
import {generateMeta} from "@/utilities/generateMeta";
import {queryUserBySlug} from "@collections/Users/operations/queryMemberBySlug";
import {ProfileSlide} from "@/components/layouts/Profile/ProfileSlide";
import {getPayload} from "payload";
import config from "@payload-config";

type Args = {
	params: Promise<{
		user?: string;
	}>;
};

export default async function Page({params: paramsPromise}: Args) {
	const {user = ""} = await paramsPromise;
	const page = await queryUserBySlug({userSlug: user});
	const payload = await getPayload({config: config});
	const slides = await payload.find({
		collection: "profile",
		where: {
			author: {
				equals: page?.id,
			},
		},
		pagination: false,
		overrideAccess: true,
		limit: 1,
		select: {
			hero: true,
			slides: true,
		},
	}).then((res) => res.docs[0] || null).catch((err) => {
		console.error(err);
		return null;
	});

	const firstSlide = {
		title:
			(slides?.slides?.[0]?.title || "The Hideaway") +
			" " +
			(user.startsWith("@") ? user.split("@")[1] : user),
		version: 1,
		type: "root",
		content: slides?.slides?.[0]?.content || {
			version: 1,
			type: "root",
			root: {
				version: 1,
				type: "root",
				children: [
					"The Hideaway is a community of creators, writers, and artists who share their stories and experiences through the internet.",
				],
			},
		},
		url:
			typeof slides?.slides?.[0]?.visuals === "string"
				? slides?.slides?.[0]?.visuals
				: "/media/IMG_6521-1920x1439.webp",
		mimeType:
			slides?.slides?.[0]?.visuals &&
			typeof slides.slides[0].visuals !== "string" &&
			"mimeType" in slides.slides[0].visuals &&
			slides.slides[0].visuals.mimeType
				? slides.slides[0].visuals.mimeType
				: "image/webp",
	};
	const secondSlide = {
		title: "The Hideaway",
		version: 1,
		type: "root",
		content: slides?.slides?.[1]?.content || {
			version: 1,
			type: "root",
			root: {
				version: 1,
				type: "root",
				children: [
					"The Hideaway is a community of creators, writers, and artists who share their stories and experiences through the internet.",
				],
			},
		},
		url:
			typeof slides?.slides?.[1]?.visuals === "string"
				? slides.slides[1].visuals
				: "/media/IMG_6355-1920x3415.jpg",
		mimeType:
			slides?.slides?.[1]?.visuals &&
			typeof slides.slides[1].visuals !== "string" &&
			"mimeType" in slides.slides[1].visuals &&
			slides.slides[1].visuals.mimeType
				? slides.slides[1].visuals.mimeType
				: "image/jpg",
	};
	const thirdSlide = {
		title: "The Hideaway",
		version: 1,
		type: "root",
		content: slides?.slides?.[2]?.content || {
			version: 1,
			type: "root",
			root: {
				version: 1,
				type: "root",
				children: [
					"The Hideaway is a community of creators, writers, and artists who share their stories and experiences through the internet.",
				],
			},
		},
		url:
			typeof slides?.slides?.[2]?.visuals === "string"
				? slides.slides[2].visuals
				: "/media/21succession-recap-articleLarge.webp",
		mimeType:
			slides?.slides?.[2]?.visuals &&
			typeof slides.slides[2].visuals !== "string" &&
			"mimeType" in slides.slides[2].visuals &&
			slides.slides[2].visuals.mimeType
				? slides.slides[2].visuals.mimeType
				: "image/webp",
	};
	const fourthSlide = {
		title: "The Hideaway",
		version: 1,
		type: "root",
		content: slides?.slides?.[3]?.content || {
			version: 1,
			type: "root",
			root: {
				version: 1,
				type: "root",
				children: [
					"The Hideaway is a community of creators, writers, and artists who share their stories and experiences through the internet.",
				],
			},
		},
		url:
			typeof slides?.slides?.[3]?.visuals === "string"
				? slides.slides[3].visuals
				: "/media/branded_2-1200x630.webp",
		mimeType:
			slides?.slides?.[3]?.visuals &&
			typeof slides.slides[3].visuals !== "string" &&
			"mimeType" in slides.slides[3].visuals &&
			slides.slides[3].visuals.mimeType
				? slides.slides[3].visuals.mimeType
				: "image/webp",
	};
	return (
		<>
			<ProfileSlide name={user} bio={user} places={["", "", ""]} image={""} textures={[
				{url: firstSlide.url, mimeType: firstSlide.mimeType},
				{url: secondSlide.url, mimeType: secondSlide.mimeType},
				{url: thirdSlide.url, mimeType: thirdSlide.mimeType},
				{url: fourthSlide.url, mimeType: fourthSlide.mimeType},
			]} hero={{
				subtitle: slides?.hero?.subtitle || "",
				gradient1: slides?.hero?.gradient1 || "#c8dee8",
				gradient2: slides?.hero?.gradient2 || "#ee9c5a",
				title: slides?.hero?.title || "",
			}} slides={[
				{
					title: firstSlide.title,
					content: {
						...firstSlide.content,
						version: 1,
						type: "rtl",
						children: [
							...firstSlide.content.root.children.map((r) => ({
								...r,
							})),
						],
						format: "justify",
						direction: "ltr",
						indent: 0,
					},
				},
				{
					title: secondSlide.title,
					content: {
						...secondSlide.content,
						version: 1,
						type: "rtl",
						children: [
							...secondSlide.content.root.children.map((r) => ({
								...r,
							})),
						],
						format: "justify",
						direction: "ltr",
						indent: 0,
					},
				},
				{
					title: thirdSlide.title,
					content: {
						...thirdSlide.content,
						version: 1,
						type: "rtl",
						children: [
							...thirdSlide.content.root.children.map((r) => ({
								...r,
							})),
						],
						format: "justify",
						direction: "ltr",
						indent: 0,
					},
				},
				{
					title: fourthSlide.title,
					content: {
						...fourthSlide.content,
						version: 1,
						type: "rtl",
						children: [
							...fourthSlide.content.root.children.map((r) => ({
								...r,
							})),
						],
						format: "justify",
						direction: "ltr",
						indent: 0,
					},
				},
			]} />
		</>
	);
}

export async function generateMetadata({
	params: paramsPromise,
}: Args): Promise<Metadata> {
	const {user = ""} = await paramsPromise;

	const page = await queryUserBySlug({
		userSlug: user,
	});
	if (!page) {
		return {
			title: "THIS IS NOT AN EXIT",
			description: "Wrong Turn.",
		};
	}
	const {portrait, ...rest} = page;
	return generateMeta({
		doc: {
			...rest,
			portrait: portrait?.url || "",
		},
	});
}
