import {cn} from "@/lib/utils";
import {FeatureClientSchemaMap} from "@/payload/Lexical/defaults/types";
import {Popover} from "@base-ui/react";
import {EditorConfigContextType} from "@payloadcms/richtext-lexical";
import {BaseSelection, LexicalEditor} from "@payloadcms/richtext-lexical/lexical";
import {I18nClient} from "@payloadcms/translations";
import {ComponentProps, ComponentType, useMemo} from "react";

export const SubMenu = ({
	                        className,
	                        sideOffset = 0, handle,
	                        children,
	                        ...props
                        }: ComponentProps<typeof Popover.Positioner> &
	ComponentProps<typeof Popover.Popup> & {
	handle: Popover.Handle<ComponentType>
}) => {

	return <Popover.Root handle={handle}>
		{({payload: Payload}) => (
			<Popover.Portal>
				<Popover.Positioner sideOffset={8}
				                    className={`
                h-(--positioner-height) w-(--positioner-width)
                max-w-(--available-width)
                transition-[top,left,right,bottom,transform]
                duration-[0.35s]
                ease-[cubic-bezier(0.22,1,0.36,1)]
                data-instant:transition-none`}>
					<Popover.Popup
						className={`relative h-(--popup-height,auto) duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]
						 w-(--popup-width,auto) max-w-[calc(100vw-36px)] 
						 flex origin-[var(--transform-origin)] flex-col rounded-md bg-[canvas] transition-[width,height,opacity,scale] px-3 py-1.5 text-sm shadow-lg shadow-muted-faded-background outline outline-1 outline-muted-faded-foreground/50 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[instant]:duration-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-muted-faded-foreground/90`}
						{...props}> <Popover.Viewport
						className={`
                    relative h-full w-full overflow-clip p-0.5
                    [&_[data-current]]:w-[calc(var(--popup-width)-4px)]
                    [&_[data-current]]:translate-x-0
                    [&_[data-current]]:opacity-100
                    [&_[data-current]]:transition-[translate,opacity]
                    [&_[data-current]]:duration-[250ms,125ms]
                    [&_[data-current]]:ease-[cubic-bezier(0.22,1,0.36,1)]
                    data-[activation-direction~='left']:[&_[data-current][data-starting-style]]:-translate-x-1/2
                    data-[activation-direction~='left']:[&_[data-current][data-starting-style]]:opacity-0
                    data-[activation-direction~='right']:[&_[data-current][data-starting-style]]:translate-x-1/2
                    data-[activation-direction~='right']:[&_[data-current][data-starting-style]]:opacity-0
                    [&_[data-previous]]:w-[calc(var(--popup-width)-4px)]
                    [&_[data-previous]]:translate-x-0
                    [&_[data-previous]]:opacity-100
                    [&_[data-previous]]:transition-[translate,opacity]
                    [&_[data-previous]]:duration-[250ms,125ms]
                    [&_[data-previous]]:ease-[cubic-bezier(0.22,1,0.36,1)]
                    data-[activation-direction~='left']:[&_[data-previous][data-ending-style]]:translate-x-1/2
                    data-[activation-direction~='left']:[&_[data-previous][data-ending-style]]:opacity-0
                    data-[activation-direction~='right']:[&_[data-previous][data-ending-style]]:-translate-x-1/2
                    data-[activation-direction~='right']:[&_[data-previous][data-ending-style]]:opacity-0`}
					>

						{Payload !== undefined && <Payload/>}

					</Popover.Viewport>
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>)}</Popover.Root>
}
type NodeMenuItem = {
	/** This is optional and controls if the toolbar item is highlighted or not. */
	isActive?: ({
		            editor,
		            editorConfigContext,
		            selection,
	            }: {
		editor: LexicalEditor
		editorConfigContext: EditorConfigContextType
		selection: BaseSelection
	}) => boolean
	/** This is optional and controls if the toolbar item is clickable or not. If `false` is returned here, it will be grayed out and unclickable. */
	isEnabled?: ({
		             editor,
		             editorConfigContext,
		             selection,
	             }: {
		editor: LexicalEditor
		editorConfigContext: EditorConfigContextType
		selection: BaseSelection
	}) => boolean
	/** Each toolbar item needs to have a unique key. */
	key: string
	label?:
		| ((args: {
		featureClientSchemaMap: FeatureClientSchemaMap
		i18n: I18nClient<{}, string>
		schemaPath: string
	}) => string)
		| string
	/** Each toolbar item needs to have a unique key. */
	onSelect?: ({editor, isActive}: { editor: LexicalEditor; isActive: boolean }) => void
	order?: number
}
type NodeMenuToolbarGroup = {
	items: NodeMenuItem[]
	order?: number
	key: string
}
export const ActionRow = ({
	                          groups,

                          }: {
	groups: NodeMenuToolbarGroup[];

}) => {
	const groupsSorted = useMemo(() => {
	}, [])
}
const ActionRowButton = ({
	                         children,
	                         label,
	                         className,
	                         onClick,
	                         role,
	                         ...props
                         }: ComponentProps<"div"> & {
	label?: string
}) => {
	return <div
		className={cn("select-none transition-colors duration-20 ease-in inline-flex items-center justify-center gap-0 h-9 px-0 rounded-[4px] whitespace-nowrap text-[14px] font-normal leading-[1.2] w-9 text-off-foreground shrink-0 min-w-0", className)}
		role={role || "button"}
		aria-label={label}
		onClick={onClick} {...props}
	>
		{children}
	</div>
}
const ActionRowSeparator = ({className, ...props}: ComponentProps<"div">) => {
	return <div
		className={cn("w-px h-6 mx-1.5 bg-muted rounded-[2px]", className)} {...props}></div>
}
const AlignLeft = () => {
	return <ActionRowButton label="Left alignment">

	</ActionRowButton>
}
const AlignCenter = () => {
	return <ActionRowButton label={"Center alignment"}>

	</ActionRowButton>
}
const AlignRight = () => {
	return <ActionRowButton label={"Right alignment"}>

	</ActionRowButton>
}