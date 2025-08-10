"use client";
import {useState} from "react";
import {FieldLabel, useField} from "@payloadcms/ui";
import {Button} from "./components/button";
import {Popover, PopoverContent, PopoverTrigger} from "./components/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "./components/command";
import {cn} from "@/lib/utils";
import {Paintbrush} from "lucide-react";
import TailWindColors from "./TailwindColors";
import {SelectFieldClientProps} from "payload";
import {useDomCursor} from "@components/Cursor";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
	isFont?: boolean;
	isBackground?: boolean;
} & SelectFieldClientProps;

const createColorTailwindOption = () => {
	const result: { color: string; value: string; label: string }[] = [];
	for (const [category, colorArray] of Object.entries(TailWindColors)) {
		colorArray.forEach((color, index) => {
			const categoryLowe = category.toLowerCase();
			result.push({
				color,
				value: color,
				label:
					color +
					" " +
					(index == 0
						? `${category}-50`
						: index == 10
							? `${category}-950`
							: `${category}-${index * 100}`),
			});
		});
	}
	result.push({
		color: "#ffffff",
		value: "#ffffff",
		label: "#ffffff white",
	});
	result.push({
		color: "#000000",
		value: "#000000",
		label: "#000000 black",
	});
	return result;
};

const colors: { color: string; value: string; label: string }[] =
	createColorTailwindOption();
export const SelectColor: React.FC<Props> = (props) => {
	const {path} = props;
	const {isFont, isBackground, field} = props;
	const {value, setValue} = useField<string>({path});
	const [open, setOpen] = useState(false);
	const [backgroundColor, setBackgroundColor] = useState(
		(isBackground && colors.find((color) => color.value === value)?.value) ||
		"#FFFFFF",
	);
	const [fontColor, setFontColor] = useState(
		(isFont && colors.find((color) => color.color === value)?.value) ||
		"#000000",
	);
	const [selectColor, setSelectColor] = useState(
		colors.find((color) => color.color === value) || null,
	);
	const labelToUse = field.label ? field.label : "Color";

	const handleSelect = (value: string) => {
		const obj = colors.find((color) => color.value === value) || null;
		setSelectColor(obj);
		setValue(obj?.value);
		const color = obj?.color;
		isFont && color && setFontColor(color);
		isBackground && color && setBackgroundColor(color);
		setOpen(false);
	};
	const {onMouseEnter, onMouseLeave} = useDomCursor({});

	return (
		<div>
			{
				<FieldLabel htmlFor={`bfColourPickerField-${path?.replace(/\./gi, "__")}`}
				            label={labelToUse} />
			}
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger style={{
					border: 0,
				}} asChild>
					<Button variant={"default"} className={cn(
						"comp w-[220px] justify-start text-left font-normal",
						!selectColor && "text-muted-foreground ",
					)} style={{backgroundColor: backgroundColor}}>
						<div className="comp w-full flex items-center gap-2">
							{selectColor ? (
								<div
									className="comp h-4 w-4 rounded !bg-center !bg-cover transition-all"
									style={{
										backgroundColor: selectColor
											? selectColor.color
											: "transparent",
									}} />
							) : (
								<Paintbrush className="h-4 w-4" />
							)}
							<div className="comp truncate flex-1" style={{color: fontColor}}>
								{selectColor ? selectColor.label : "Pick a color"}
							</div>
						</div>
					</Button>
				</PopoverTrigger>
				<PopoverContent className="comp mb-[10px] p-0" side="right" align="start">
					<Command>
						<CommandInput className="comp" placeholder="Search color..."
						              autoFocus={false} />
						<CommandList>
							<CommandEmpty>No results found.</CommandEmpty>
							<CommandGroup>
								<div className="comp grid grid-cols-11 gap-2">
									{colors.map((clr) => (
										<Tooltip key={clr.color + clr.label + "tip"}>
											<TooltipTrigger style={{
												borderWidth: 0,
												border: "none",
												background: "transparent",
											}}>
												<CommandItem onMouseEnter={onMouseEnter}
												             onMouseLeave={onMouseLeave}
												             key={clr.color + clr.label}
												             value={clr.value}
												             style={{background: clr.value}}
												             className="comp rounded-md h-6 w-6 cursor-pointer active:scale-105"
												             onSelect={handleSelect} />
											</TooltipTrigger>
											<TooltipContent>
												<div
													className="comp flex items-center gap-2 z-[200]">
													{clr.label}
												</div>
											</TooltipContent>
										</Tooltip>
									))}
								</div>
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
};
export const SelectColorBackground: React.FC<Props> = (props) => {
	return <SelectColor {...props} isBackground={true} />;
};
export const SelectColorFont: React.FC<Props> = (props) => {
	return <SelectColor {...props} isFont={true} />;
};
