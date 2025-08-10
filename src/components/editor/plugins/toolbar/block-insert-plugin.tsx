"use client"

import {PlusIcon} from "lucide-react"

import {useEditorModal} from "@/components/editor/editor-hooks/use-modal"
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectTrigger,
} from "@/components/ui/select"

export function BlockInsertPlugin({children}: { children: React.ReactNode }) {
	const [modal] = useEditorModal()

	return (
		<>
			{modal}
			<Select value={""}>
				<SelectTrigger className="!h-10 w-min gap-1.5">
					<PlusIcon className="size-6" />
					<span>Insert</span>
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>{children}</SelectGroup>
				</SelectContent>
			</Select>
		</>
	)
}
