"use client"

import {getTranslation} from "@payloadcms/translations"
import {reduceFieldsToValues} from "payload/shared"
import React from "react"

import {ActionsBar} from "../ActionsBar/index"
import {discardBulkUploadModalSlug, DiscardWithoutSaving} from "../DiscardWithoutSaving/index"
import {EditForm} from "../EditForm/index"
import {FileSidebar} from "../FileSidebar/index"
import {useFormsManager} from "../FormsManager/index"
import {DrawerHeader} from "../Header/index"
import "./index.scss"
import {DocumentInfoProvider, useAuth, useConfig, useModal, useTranslation} from "@payloadcms/ui"
import type {CollectionSlug} from "payload"
import type {User} from "@/payload-types"

const baseClass = "bulk-upload--file-manager"

export function AddingFilesView() {
	const {
		activeIndex,
		collectionSlug,
		docPermissions,
		documentSlots,
		forms,
		hasPublishPermission,
		hasSavePermission,
		hasSubmitted,
		resetUploadEdits,
		updateUploadEdits,
	} = useFormsManager()
	const activeForm = forms[activeIndex]
	const {getEntityConfig} = useConfig()
	const {i18n} = useTranslation()
	const {user} = useAuth()
	const {openModal} = useModal()

	const collectionConfig = getEntityConfig({collectionSlug})

	return (
		<div className={baseClass}>
			<FileSidebar/>

			<div className={`${baseClass}__editView`}>
				<DrawerHeader
					onClose={() => openModal(discardBulkUploadModalSlug)}
					title={getTranslation(collectionConfig.labels.singular, i18n)}
				/>
				{activeForm && user && collectionSlug ? (
					<DocumentInfoProvider
						collectionSlug={collectionSlug as CollectionSlug}
						currentEditor={user as User & { collection: "users" }}
						docPermissions={docPermissions}
						hasPublishedDoc={false}
						hasPublishPermission={hasPublishPermission}
						hasSavePermission={hasSavePermission}
						id={undefined}
						initialData={reduceFieldsToValues(activeForm.formState, true)}
						initialState={activeForm.formState}
						isLocked={false}
						key={`${activeIndex}-${forms.length}`}
						lastUpdateTime={0}
						mostRecentVersionIsAutosaved={false}
						unpublishedVersionCount={0}
						Upload={documentSlots.Upload}
						versionCount={0}
					>
						<ActionsBar collectionConfig={collectionConfig}/>
						<EditForm
							resetUploadEdits={resetUploadEdits}
							submitted={hasSubmitted}
							updateUploadEdits={updateUploadEdits}
							uploadEdits={activeForm?.uploadEdits}
						/>
					</DocumentInfoProvider>
				) : null}
			</div>

			<DiscardWithoutSaving/>
		</div>
	)
}
