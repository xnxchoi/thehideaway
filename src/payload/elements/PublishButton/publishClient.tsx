"use client";

import type {PublishButtonClientProps} from "payload";

import * as qs from "qs-esm";
import {Fragment, useCallback, useEffect, useMemo, useRef, useState} from "react";

import {
	MenuArrow,
	MenuItem,
	MenuPopup,
	MenuSeparator,
	MenuTrigger
} from "@/payload/components/Popover";
import {useCourier} from "@/payload/elements/DocumentFields/RP_CourierProvider";
import {Menu} from "@base-ui/react";
import {
	FormSubmit,
	useConfig,
	useDocumentInfo,
	useEditDepth,
	useForm,
	useFormModified,
	useHotkey,
	useLocale,
	useModal,
	useOperation,
	useTranslation
} from "@payloadcms/ui";
import {ScheduleDrawer} from "@payloadcms/ui/elements/PublishButton/ScheduleDrawer";
import {traverseForLocalizedFields} from "@payloadcms/ui/utilities/traverseForLocalizedFields";

export function PublishButton({label: labelProp}: {label?:string}&PublishButtonClientProps) {
	const {
		id,
		collectionSlug,
		docConfig,
		globalSlug,
		hasPublishedDoc,
		hasPublishPermission,
		setHasPublishedDoc,
		setMostRecentVersionIsAutosaved,
		setUnpublishedVersionCount,
		unpublishedVersionCount,
		uploadStatus
	} = useDocumentInfo();

	const {config, getEntityConfig} = useConfig();
	const {submit} = useForm();
	const modified = useFormModified();
	const editDepth = useEditDepth();
	const {code: localeCode} = useLocale();
	const [menuOpen, setMenuOpen] = useState(false);
	const {isModalOpen, toggleModal} = useModal();
	const menuRef = useRef<HTMLDivElement>(null!);
	const setCourierRef = useCourier((r) => r.setButtonRef);
	const courierStatus = useCourier((r) => r.status);
	const setSaving = useCourier((r) => r.setSavingState);
	const drawerSlug = `schedule-publish-${id}`;
	const ref = useRef<HTMLButtonElement>(null!);

	const {
		localization,
		routes: {api},
		serverURL
	} = config;

	const {t} = useTranslation();
	const label = labelProp || t("version:publishChanges");

	const entityConfig = useMemo(() => {
		if (collectionSlug) {
			return getEntityConfig({collectionSlug});
		}

		if (globalSlug) {
			return getEntityConfig({globalSlug});
		}
	}, [collectionSlug, globalSlug, getEntityConfig]);
	useEffect(() => {
		if (ref.current) {
			setCourierRef(ref.current);
		}
	}, [setCourierRef]);
	const hasNewerVersions = unpublishedVersionCount > 0;

	const schedulePublish =
		typeof entityConfig?.versions?.drafts === "object" &&
		entityConfig?.versions?.drafts.schedulePublish;

	const canPublish =
		hasPublishPermission &&
		(modified || hasNewerVersions || !hasPublishedDoc) &&
		uploadStatus !== "uploading" &&
		courierStatus !== "uploading";

	const scheduledPublishEnabled = Boolean(schedulePublish);

	// If autosave is enabled the modified will always be true so only conditionally check on modified state
	const hasAutosave = Boolean(
		typeof entityConfig?.versions?.drafts === "object" &&
		entityConfig?.versions?.drafts.autosave
	);

	const canSchedulePublish = Boolean(
		scheduledPublishEnabled &&
		hasPublishPermission &&
		(globalSlug || (collectionSlug && id)) &&
		(hasAutosave || !modified)
	);

	const [hasLocalizedFields, setHasLocalizedFields] = useState(false);

	useEffect(() => {
		if (entityConfig?.fields) {
			const hasLocalizedField = traverseForLocalizedFields(
				entityConfig?.fields
			);
			setHasLocalizedFields(hasLocalizedField);
		}
	}, [entityConfig?.fields]);

	const canPublishSpecificLocale =
		localization && hasLocalizedFields && hasPublishPermission;

	const operation = useOperation();

	const disabled = operation === "update" && !modified;

	const saveDraft = useCallback(async () => {
		if (disabled) {
			return;
		}

		const search = `?locale=${localeCode}&depth=0&fallback-locale=null&draft=true`;
		let action;
		let method = "POST";

		if (collectionSlug) {
			action = `${serverURL}${api}/${collectionSlug}${id ? `/${id}` : ""}${search}`;
			if (id) {
				method = "PATCH";
			}
		}

		if (globalSlug) {
			action = `${serverURL}${api}/globals/${globalSlug}${search}`;
		}

		await submit({
			action,
			method,
			overrides: {
				_status: "draft"
			},
			skipValidation: true
		});
	}, [
		submit,
		collectionSlug,
		globalSlug,
		serverURL,
		api,
		localeCode,
		id,
		disabled
	]);

	useHotkey({cmdCtrlKey: true, editDepth, keyCodes: ["s"]}, (e) => {
		e.preventDefault();
		e.stopPropagation();
		if (courierStatus === "uploading") {
			return;
		}
		if (
			saveDraft &&
			docConfig &&
			docConfig.versions?.drafts &&
			docConfig.versions?.drafts?.autosave
		) {
			void saveDraft();
		}
	});

	const publish = useCallback(async () => {
		setSaving(false);

		if (uploadStatus === "uploading" || courierStatus === "uploading") {
			return;
		}
		setSaving(true);

		const result = await submit({
			overrides: {
				_status: "published"
			}
		});

		if (result) {
			setUnpublishedVersionCount(0);
			setMostRecentVersionIsAutosaved(false);
			setHasPublishedDoc(true);
		}
		setSaving(false);
	}, [
		setSaving,
		uploadStatus,
		courierStatus,
		submit,
		setUnpublishedVersionCount,
		setMostRecentVersionIsAutosaved,
		setHasPublishedDoc
	]);

	const publishSpecificLocale = useCallback(
		async (locale: string) => {
			if (uploadStatus === "uploading" || courierStatus === "uploading") {
				return;
			}

			const params = qs.stringify({
				depth: 0,
				publishSpecificLocale: locale
			});

			const action = `${serverURL}${api}${globalSlug ? `/globals/${globalSlug}` : `/${collectionSlug}${id ? `/${id}` : ""}`}${params ? "?" + params : ""}`;

			const result = await submit({
				action,
				overrides: {
					_status: "published"
				}
			});

			if (result) {
				setHasPublishedDoc(true);
			}
		},
		[
			courierStatus,
			api,
			collectionSlug,
			globalSlug,
			id,
			serverURL,
			setHasPublishedDoc,
			submit,
			uploadStatus
		]
	);

	const publishAll =
		!localization ||
		(localization && localization.defaultLocalePublishOption !== "active");

	const activeLocale =
		localization &&
		localization?.locales.find((locale) =>
			typeof locale === "string"
				? locale === localeCode
				: locale.code === localeCode
		);

	const activeLocaleLabel =
		activeLocale &&
		(typeof activeLocale.label === "string"
			? activeLocale.label
			: (activeLocale.label?.[localeCode] ?? undefined));

	const defaultPublish = publishAll
		? publish
		: () =>
			publishSpecificLocale(activeLocale ? activeLocale.code || "en" : "en");
	const defaultLabel = publishAll
		? label
		: t("version:publishIn", {locale: activeLocaleLabel});

	const secondaryPublish = publishAll
		? () =>
			publishSpecificLocale(activeLocale ? activeLocale.code || "en" : "en")
		: publish;
	const secondaryLabel = publishAll
		? t("version:publishIn", {locale: activeLocaleLabel})
		: t("version:publishAllLocales");

	if (!hasPublishPermission) {
		return null;
	}

	return (
		<Fragment>
			<div
				className={
					"flex h-full items-center gap-0 bg-muted-faded-background/30"
				}
			>
				<FormSubmit
					className={
						"border-px h-12! rounded-r-xs! border-r! border-solid! border-r-muted-faded-foreground/40! bg-muted-faded-foreground/80! text-sm!"
					}
					buttonId="action-save"
					disabled={!canPublish}
					ref={ref}
					enableSubMenu={canSchedulePublish}
					onClick={defaultPublish}
					size="medium"
					type="button"
				>
					{localization ? defaultLabel : label}
				</FormSubmit>
				{(canPublishSpecificLocale || canSchedulePublish) && (
					<Menu.Root open={menuOpen} onOpenChange={setMenuOpen}>
						<MenuTrigger className={"h-fit rounded-r-2xl px-1"}/>
						<Menu.Portal>
							<Menu.Positioner className="outline-none" sideOffset={10}>
								<MenuPopup>
									<MenuArrow/>
									<div
										style={{
											position: "relative",
											width: "100%",
											height: "100%",
											display: "flex",
											flexDirection: "column"
										}}
										ref={menuRef}
									>
										{canSchedulePublish && (
											<MenuItem
												id="schedule-publish"
												onClick={() => [toggleModal(drawerSlug), close()]}
											>
												{t("version:schedulePublish")}
											</MenuItem>
										)}
										<MenuSeparator/>
										{canPublishSpecificLocale && (
											<MenuItem id="publish-locale"
											          onClick={secondaryPublish}>
												{secondaryLabel}
											</MenuItem>
										)}
									</div>
								</MenuPopup>
							</Menu.Positioner>
						</Menu.Portal>
					</Menu.Root>
				)}
			</div>
			{canSchedulePublish && isModalOpen(drawerSlug) && (
				<ScheduleDrawer
					defaultType={!hasNewerVersions ? "unpublish" : "publish"}
					schedulePublishConfig={
						(typeof schedulePublish === "object" && schedulePublish) ||
						undefined
					}
					slug={drawerSlug}
				/>
			)}
		</Fragment>
	);
}
