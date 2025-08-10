import type {
	Margins,
	PageSize,
	StyleDictionary,
	TDocumentDefinitions,
} from "pdfmake/interfaces";
import {stack, textMake as txt} from "./assets";
import path from "path";
import pdfPrinter from "pdfmake";
import {readFile} from "fs/promises";

export function pdfMake() {
	const fonts = {
		Joly: {
			normal: path.resolve(
				process.env.NEXT_PUBLIC_SERVER_URL,
				"/public/assets/fonts/Weaved/JolyTextRegular.otf",
			),
			italics: path.resolve(
				process.env.NEXT_PUBLIC_SERVER_URL,
				"/public/assets/fonts/Weaved/JolyTextRegularItalic.otf",
			),
			bold: path.resolve(
				process.env.NEXT_PUBLIC_SERVER_URL,
				"/public/assets/fonts/Weaved/JolyDisplayBold.otf",
			),
			bolditalics: path.resolve(
				process.env.NEXT_PUBLIC_SERVER_URL,
				"/public/assets/fonts/Weaved/JolyDisplayBoldItalic.otf",
			),
		},
	};
	const PdfPrinter = new pdfPrinter(fonts);

	const info = {
		name: "John Doe",
		address: "123 Main St, Anytown, USA",
		email: "john.doe@example.com",
		phone: "123-456-7890",
		date: new Date(),
		dueDate: new Date(),
		status: "paid",
		total: 100,
	};
	const {date, email} = info;
	const docDefinition = {
		content: [
			stack([
				{
					text: "The Hideaway, a Restored Project\nSEOUL · PARIS",
					alignment: "center",
					style: "brand",
					margin: [0, 5, 0, 20],
				},
			]),
			txt({
				text:
					new Date(date).toLocaleDateString("en-US", {
						month: "long",
						day: "numeric",
						year: "numeric",
					}) || "",
				fontSize: 10,
				alignment: "right",
				margin: [0, 10, 0, 20],
			}),
		],
		pageSize: "A4" as PageSize,
		pageMargins: [30, 10, 30, 10] as Margins,
		defaultStyle: {
			font: "Joly",
			fontSize: 11,
			lineHeight: 1.15,
		},
		styles: {
			header: {
				fontSize: 11,
				lineHeight: 1.15,
				bold: true,
				margin: [0, 5, 0, 0] as Margins,
			},
			subheader: {
				fontSize: 11,
				lineHeight: 1.15,
				bold: true,
				margin: [0, 5, 0, 0] as Margins,
			},
			body: {
				fontSize: 11,
				lineHeight: 1.15,
			},
		} as StyleDictionary,
	} as TDocumentDefinitions;

	return [PdfPrinter, docDefinition] as [pdfPrinter, TDocumentDefinitions];
}
