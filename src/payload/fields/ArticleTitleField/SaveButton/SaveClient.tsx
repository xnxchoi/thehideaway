"use client";

import {
	useCourier, type CourierForm
} from "@/payload/elements/DocumentFields/RP_CourierProvider";
import {
	FormSubmit, useDocumentInfo, useEditDepth, useForm, useFormModified, useHotkey, useOperation, useTranslation
} from "@payloadcms/ui";
import type {SaveButtonClientProps} from "payload";
import {useCallback, useEffect, useRef} from "react";

export const RP_SaveButton = ({label: labelProp}: SaveButtonClientProps) => {
	const courierStatus = useCourier((r) => r.status);
	const setSaving = useCourier((r) => r.setSavingState);
	const {uploadStatus} = useDocumentInfo();
	const {t} = useTranslation();
	const {submit} = useForm();
	const modified = useFormModified();
	const label = labelProp || t("general:save");
	const setCourierRef = useCourier((r) => r.setButtonRef);
	const ref = useRef<HTMLButtonElement>(null!);
	const editDepth = useEditDepth();
	const operation = useOperation();
	const disabled = (operation === "update" && !modified) || uploadStatus === "uploading" || courierStatus === "uploading" || courierStatus === "pending";
	useEffect(() => {
		if (ref.current) {
			setCourierRef(ref.current);
		}
	}, [setCourierRef]);
	useHotkey({cmdCtrlKey: true, editDepth, keyCodes: ["s"]}, (e) => {
		if (disabled) {
			// absorb the event
		}

		e.preventDefault();
		e.stopPropagation();
		if (ref?.current) {
			ref.current.click();
		}
	});

	const handleSubmit = () => {
		setSaving(false);
		if (uploadStatus === "uploading") {
			return;
		}
		if (courierStatus === "pending" || courierStatus === "uploading") {
			return;
		}
		setSaving(true);
		return void submit().finally(() => {
			setSaving(false);
		});
	};

	return (<FormSubmit buttonId="action-save" disabled={disabled} onClick={handleSubmit} ref={ref} size="medium"
	                    type="button">
			{label}
		</FormSubmit>);
};
