"use client"

import React, {useCallback, useEffect} from "react"

import "./index.scss"
import {
	OperationProvider,
	useDocumentDrawerContext,
	useServerFunctions,
	useForm,
	useConfig,
	useDocumentEvents,
	DocumentFields,
	MoveDocToFolder,
	useDocumentInfo,
	WatchChildErrors,
	Form,
	type FormProps
} from "@payloadcms/ui"
import {handleAbortRef, abortAndIgnore} from "@payloadcms/ui/shared"
import {Upload_v4} from "../../Upload"
import {useFormsManager} from "../FormsManager"
import type {EditFormProps} from "./types"
import type {
	ClientCollectionConfig,
	CollectionConfig,
	Data,
	DataFromCollectionSlug,
	FormState,
	JsonObject,
	SanitizedUploadConfig,
	TypeWithID
} from "payload"
import type {FormOnSuccess} from "node_modules/@payloadcms/ui/dist/forms/Form/types"

const baseClass = "collection-edit"

// This component receives props only on _pages_
// When rendered within a drawer, props are empty
// This is solely to support custom edit views which get server-rendered

export function EditForm({
	                         resetUploadEdits,
	                         submitted,
	                         updateUploadEdits,
	                         uploadEdits,
                         }: EditFormProps) {
	const {
		action,
		collectionSlug: docSlug,
		docPermissions,
		getDocPreferences,
		hasSavePermission,
		initialState,
		isInitializing,
		Upload: CustomUpload,
	} = useDocumentInfo()

	const {drawerSlug, onSave: onSaveFromContext} = useDocumentDrawerContext()

	const {getFormState} = useServerFunctions()

	const {
		config: {folders},
		getEntityConfig,
	} = useConfig()

	const abortOnChangeRef = React.useRef<AbortController>(null)

	const collectionConfig = getEntityConfig({collectionSlug: docSlug})
	const {reportUpdate} = useDocumentEvents()

	const collectionSlug = collectionConfig?.slug

	const [schemaPath] = React.useState(collectionSlug)

	const onSave: FormOnSuccess<unknown, Record<string, unknown>> = useCallback(
		(jso) => {
			const json = jso as {
				collectionConfig?: ClientCollectionConfig | undefined;
				context?: Record<string, unknown>; result: Data;
				doc: TypeWithID;
			} & Record<string, unknown>
			const doc = (json?.doc || json?.result) as TypeWithID | undefined;
			if (!doc) return;
			const updatedAt = json?.result && typeof json.result === "object" && "updatedAt" in json.result && typeof json.result.updatedAt === "string" ? json.result.updatedAt : new Date().toISOString()
			collectionSlug && reportUpdate({
				doc,
				drawerSlug,
				entitySlug: collectionSlug,
				operation: "create",
				updatedAt,
			})

			if (typeof onSaveFromContext === "function") {
				void onSaveFromContext({
					...json,
					operation: "create",
				})
			}
			resetUploadEdits?.()
		},
		[collectionSlug, onSaveFromContext, reportUpdate, resetUploadEdits, drawerSlug],
	)

	const onChange: NonNullable<FormProps["onChange"]>[0] = useCallback(
		async ({formState: prevFormState, submitted}) => {
			if (!schemaPath) throw new Error()
			const controller = handleAbortRef(abortOnChangeRef as React.RefObject<AbortController>)

			const docPreferences = await getDocPreferences()

			const {state: newFormState} = await getFormState({
				collectionSlug,
				docPermissions,
				docPreferences,
				formState: prevFormState,
				operation: "create",
				schemaPath,
				signal: controller.signal,
				skipValidation: !submitted,
			})

			abortOnChangeRef.current = null

			return newFormState as FormState
		},
		[collectionSlug, schemaPath, getDocPreferences, getFormState, docPermissions],
	)

	useEffect(() => {
		const abortOnChange = abortOnChangeRef.current

		return () => {
			abortOnChange && abortAndIgnore(abortOnChange)
		}
	}, [])

	return (
		<OperationProvider operation="create">
			<Form
				action={action}
				className={`${baseClass}__form`}
				disabled={isInitializing || !hasSavePermission}
				initialState={isInitializing ? undefined : initialState}
				isInitializing={isInitializing}
				method="POST"
				onChange={[onChange]}
				onSuccess={onSave}
				submitted={submitted}
			>
				<DocumentFields
					BeforeFields={
						<React.Fragment>
							{CustomUpload || (
								<Upload_v4
									collectionSlug={collectionConfig!.slug}
									customActions={[
										collectionConfig && folders && "folders" in collectionConfig && collectionConfig?.folders && (
											<MoveDocToFolder
												buttonProps={{
													buttonStyle: "pill",
													size: "small",
												}}
												folderCollectionSlug={folders.slug}
												folderFieldName={folders.fieldName}
												key="move-doc-to-folder"
											/>
										),
									].filter(Boolean)}
									initialState={initialState}
									resetUploadEdits={resetUploadEdits}
									updateUploadEdits={updateUploadEdits}
									uploadConfig={(collectionConfig as CollectionConfig).upload as SanitizedUploadConfig}
									uploadEdits={uploadEdits}
								/>
							)}
						</React.Fragment>
					}
					docPermissions={docPermissions!}
					fields={collectionConfig!.fields}
					schemaPathSegments={[collectionConfig!.slug]}
				/>
				<ReportAllErrors/>
				<GetFieldProxy/>
			</Form>
		</OperationProvider>
	)
}

function GetFieldProxy() {
	const {getFields} = useForm()
	const {getFormDataRef} = useFormsManager()

	useEffect(() => {
		getFormDataRef.current = getFields
	}, [getFields, getFormDataRef])

	return null
}

function ReportAllErrors() {
	const {docConfig} = useDocumentInfo()
	const {activeIndex, setFormTotalErrorCount} = useFormsManager()
	const errorCountRef = React.useRef(0)

	const reportFormErrorCount = React.useCallback(
		(errorCount: number) => {
			if (errorCount === errorCountRef.current) {
				return
			}
			setFormTotalErrorCount({errorCount, index: activeIndex})
			errorCountRef.current = errorCount
		},
		[activeIndex, setFormTotalErrorCount],
	)

	if (!docConfig) {
		return null
	}

	return (
		<WatchChildErrors fields={docConfig.fields} path={[]} setErrorCount={reportFormErrorCount}/>
	)
}
