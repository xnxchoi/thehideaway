import type {FilterOptionsProps, GlobalConfig, Where} from "payload";

import {link} from "@/payload/fields/link";

import {revalidateFooter} from "./hooks/revalidateFooter";
import {Media} from "@/payload-types";

export const Footer: GlobalConfig = {
	slug: "footer",
	access: {
		read: () => true,
	},
	admin: {
		hidden: ({user}) => {
			if (!user) return true;
			if (user?.role === "admin") return false;
			return true;
		},
	},
	fields: [
		{
			name: "title",
			type: "text",
			required: false,
			defaultValue: "The Smoker's Lounge",
		},
		{
			name: "navItems",
			type: "array",
			required: false,
			fields: [
				link({
					appearances: false,
				}),
			],
			maxRows: 6,
		},
		{
			name: "column1Links",
			type: "array",
			fields: [
				link({
					appearances: false,
				}),
			],
			maxRows: 3,
		},
		{
			name: "column2Links",
			type: "array",
			fields: [
				link({
					appearances: false,
				}),
			],
			maxRows: 3,
		},
		{
			name: "column3Links",
			type: "array",
			fields: [
				link({
					appearances: false,
				}),
			],
			maxRows: 3,
		},
		{
			name: "defaults",
			type: "group",
			fields: [
				{
					name: "desktop",
					type: "relationship",
					relationTo: "media",
				},
				{
					name: "mobile",
					type: "relationship",
					relationTo: "media",
				},
			],
		},
		{
			name: "videoLoop",
			type: "group",
			fields: [
				{
					name: "desktop",
					required: false,
					type: "relationship",
					relationTo: "media",
					filterOptions: ({
						data,
						siblingData,
					}: FilterOptionsProps<Media>): Where => {
						return {
							filesize: {
								less_than: 76000000,
							},
							mimeType: {
								contains: "video",
							},
						};
					},
				},
				{
					name: "mobile",
					type: "relationship",
					relationTo: "media",
					required: false,
					filterOptions: ({
						data,
						siblingData,
					}: FilterOptionsProps<Media>): Where => {
						return {
							and: [
								{
									filesize: {
										less_than: 76000000,
									},
								},
								{
									mimeType: {
										contains: "video",
									},
								},
							],
						};
					},
				},
			],
		},
		{
			name: "mobileOverlay",
			type: "number",
			max: 100,
			min: 0,
			required: false,
			defaultValue: 70,
		},
		{
			name: "desktopOverlay",
			type: "number",
			max: 100,
			min: 0,
			required: false,
			defaultValue: 70,
		},
	],
	hooks: {
		afterChange: [revalidateFooter],
	},
};
