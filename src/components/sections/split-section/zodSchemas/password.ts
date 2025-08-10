import {z} from "zod/v4";
import {useTranslations} from "next-intl";

export const passwordSchema = () => {
	const t = useTranslations("Register.error.password");
	return z.string().min(8, {error: t("minLength")}).max(20, {error: t("maxLength")}).
		refine((password) => /[A-Z]/.test(password), {
			error: t("uppercase"),
		}).refine((password) => /[a-z]/.test(password), {
			error: t("lowercase"),
		}).refine((password) => /[0-9]/.test(password), {error: t("number")}).
		refine((password) => /[!@#$%^&*]/.test(password), {
			error: t("specialCharacter"),
		})
}