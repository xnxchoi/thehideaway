"use client"


import {useTheme} from "@/providers/Theme"
import {Toaster as Sonner, toast, ToasterProps} from "sonner";

const Toaster = ({...props}: ToasterProps) => {
	const theme = useTheme(r => r.theme)

	return (
		<Sonner theme={theme as ToasterProps["theme"]} className="toaster group" toastOptions={{
			classNames: {
				toast:
					"group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
				description: "group-[.toast]:text-muted-foreground",
				actionButton:
					"group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-medium",
				cancelButton:
					"group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-medium",
			},
		}}
		        {...props} />
	)
}

export {Toaster};
export const errorToast = (message: string) =>
	toast.error(message, {
		duration: 3000,
		style: {
			backgroundColor: "oklch(var(--rouge-400)/1)",
			color: "oklch(var(--rouge-50)/1)",
		},
	});
export const successToast = (message: string) =>
	toast.success(message, {
		duration: 3000,
		style: {
			backgroundColor: "oklch(var(--bleu-400)/1)",
			color: "oklch(var(--bleu-50)/1)",
		},
	});