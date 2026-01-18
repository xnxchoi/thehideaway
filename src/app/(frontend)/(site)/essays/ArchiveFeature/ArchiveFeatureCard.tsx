import {CoverCard} from "@/blocks/heros/ArtHero/components";
import {Link} from "@/components/UX/Link/Link";
import {FrontImage} from "@/components/UX/Media/FrontImage";
import {AspectRatio} from "@/components/UX/Media/types";
import {RP_BadgeTag} from "@/components/UX/RP_BadgeTag";
import {cn} from "@/lib/utils";
import {CollectionOverviewMap, OverviewSlugs} from "@/types/collections/index";
import {AuthorOverview} from "@/types/collections/users";
import type {ComponentProps, CSSProperties, ReactNode} from "react";

export type OverviewItem<T extends OverviewSlugs = OverviewSlugs> = {
	[x in OverviewSlugs]: {
		relationTo: x;
		value: CollectionOverviewMap[x]
	}
}[T]
type LayoutDirection = "left" | "right";

export function ArchiveFeatureCard(props: {
	contents: OverviewItem<"delta" | "posts">[];
	type?: LayoutDirection
}) {
	const {contents, type = "left"} = props;
	let first, second, third, fourth;
	if (contents.length > 0) {
		first = contents[0];
	}
	if (contents.length > 1) {
		second = contents[1];
	}
	if (contents.length > 2) {
		third = contents[2];
	}
	if (contents.length > 3) {
		fourth = contents[3];
	}
	return (
		<OuterWrap>
			{first && <FocusHero type={type} item={first}/>}
			{second && <SideHero type={type} item={second}/>}
			{third && fourth && <SplitBar type={type} items={[third, fourth]}/>}
		</OuterWrap>
	);
}

const highlightMap = {
	blue: "oklch(84.4% 0.065 214)",
	red: "oklch(62.4% 0.246 28.3)",
	pink: "oklch(81.7% 0.092 29.96)",
	orange: "oklch(78.58% 0.1658 74.9677)"
} as const;
type HighlightColorMap = typeof highlightMap;
type HighlightColor = keyof HighlightColorMap;
type HighlightColorValue = HighlightColorMap[keyof HighlightColorMap];

function OuterWrap({children, highlight = "red"}: {
	children: ReactNode;
	highlight?: HighlightColor
}) {
	return (
		<div className={"h-full p-0"}>
			<div className={"relative h-full w-full"}>
				<div
					className={
						"relative z-[150] flex w-[calc(100%-4rem)] max-w-[1440px] flex-col items-center justify-center px-0 py-[1rem]"
					}
				>
					<CoverCard
						style={
							{
								"--highlight": highlightMap[highlight as HighlightColor]
							} as CSSProperties & {
								"--highlight": HighlightColorValue
							}

						}
					>
						<div
							className={
								"grid gap-y-[6rem] lg:grid-cols-[repeat(6,1fr)] lg:gap-x-[2rem] lg:gap-y-[2.4rem]"
							}
						>
							{children}
						</div>
					</CoverCard>
				</div>
			</div>
		</div>
	);
}

function FocusHero({
	                   item,
	                   type = "left"
                   }: {
	item: OverviewItem<"posts" | "delta">;
	type?: LayoutDirection
}) {
	const {value, relationTo} = item;
	const {
		title,
		author,
		category,
		slug,
	} = value;
	return (
		<div
			className={cn(
				"relative col-[1] grid items-center gap-y-[2rem] rounded-[1rem] bg-[oklch(from_var(--highlight,--faded-fg)_l_c_h/.8)] p-[2rem] text-center lg:mb-0 lg:grid-cols-[1fr_1fr] lg:gap-x-[2rem]",
				type === "left"
					? "lg:col-[1/5] lg:row-[1/3]"
					: "lg:col-[3/-1] lg:row-[1/3]"
			)}
		>
			<Link
				className={"absolute inset-0 z-0 h-full w-full"}
				href={`/${relationTo === "posts" ? "essays" : "delta"}/${slug}`}
			/>
			<div
				className={
					"col-[1] min-h-px w-full min-w-px self-start rounded-[1rem] pt-[100%] lg:row-[1/5] relative overflow-hidden"
				}
			>
				{"image" in value && !!value.image && typeof value.image === "object" && (
					<FrontImage pictureClassName="absolute inset-0"
					            imgClassName="rounded-[5px] absolute object-cover top-0 block w-auto h-auto max-w-[100%] border-0 transition-opacity duration-400 backface-hidden"
					            resource={value.image}
					/>
				)}
			</div>
			<RP_BadgeTag
				wrapperClassName={
					"order-2 col-[2/-1] [&_>*]:!text-foreground [&_>*]:!border-foreground"
				}
				content={category.title}
			/>
			<p
				className={
					"order-3 col-[2/-1] m-0 text-3xl leading-[.9] font-bold tracking-[-.01em] uppercase lg:text-[4.2rem]"
				}
			>
				{title}
			</p>
			<div
				className={
					"order-5 col-[2] inline-block font-sans text-[1.12rem] uppercase"
				}
			>
				<div
					className={
						"mx-auto mt-0 mb-[2rem] block h-[1.28rem] w-[1.28rem] bg-current clip-sun"
					}
				></div>
				{"By " + author.name}
			</div>
			<p
				className={
					"order-4 m-0 block leading-[1.2] lg:col-[2] lg:text-[1.6rem]"
				}
			>
				{("subtitle" in value && value.subtitle) || ""}
			</p>
		</div>
	);
}

function SunIcon() {
	return <div
		className={
			"mx-auto mt-0 mb-[2rem] block h-[1.28rem] w-[1.28rem] bg-current clip-sun"
		}
	></div>;
}

function Subtitle({subtitle}: { subtitle: string | undefined | ReactNode }) {
	return <p
		className={
			"order-4 col-[2] row-[5] m-0 block leading-[1.2] lg:text-[1.6rem]"
		}
	>
		{subtitle}
	</p>;
}

function AuthorName({name}: Pick<AuthorOverview, "name">) {
	return <div
		className={
			"order-2 col-[2] row-[6] inline-block font-sans text-[1.12rem] uppercase"
		}
	>
		<SunIcon/>
		{"By " + name}
	</div>;
}

function Title({
	               className, children, ...props
               }: ComponentProps<"p">) {
	return <p
		className={
			cn("m-0 text-[1.5rem] leading-[.9] font-bold tracking-[-.01em]", className)
		}
		{...props}
	>
		{children}
	</p>;
}

function HeroImage({
	                   className,
	                   image,
	                   aspectRatio,
	                   imgClassName,
	                   ...rest
                   }: Omit<ComponentProps<"div">, "children"> & Pick<OverviewItem<"posts">["value"], "image"> & {
	aspectRatio?: AspectRatio;
	imgClassName?: string
}) {
	return <div
		className={cn("relative", className)}
		{...rest}
	>
		{image && (
			<FrontImage
				imgClassName={cn("rounded-[5px] absolute object-cover top-0 block w-full h-full max-w-full border-0 transition-opacity duration-400 backface-hidden", imgClassName)}
				resource={image}
				aspectRatio={aspectRatio}
			/>
		)}
	</div>;
}

function SideHero({
	                  item,
	                  type = "left"
                  }: {
	item: OverviewItem<"posts" | "delta">;
	type?: LayoutDirection
}) {
	const {relationTo, value} = item;
	const {
		title,

		author,

		category,
		slug,
	} = item.value;
	return (
		<div
			className={cn(
				"relative grid grid-cols-[2rem_1fr_2rem] grid-rows-[1fr] gap-y-[2rem] rounded-[1rem] bg-faded-foreground text-faded-background",
				type === "left"
					? "lg:col-[5/-1] lg:row-[1/4]"
					: "lg:col-[1/3] lg:row-[1/4]"
			)}
		>
			<ItemLink slug={slug} collection={relationTo}/>
			<HeroImage className="col-[1/-1] row-[1/8] self-start rounded-[1rem] lg:h-full"
			           image={"image" in value ? value.image : null} aspectRatio={{
				base: 0,
				lg: 100 / 177,
			}}
			/>
			<RP_BadgeTag
				wrapperClassName={"order-2 col-[2] row-[3]"}
				content={category.title}
			/>
			<Title className="order-3 col-[2] row-[4] uppercase lg:text-[3.2rem]">{title}</Title>
			<AuthorName name={author.name}/>
			<Subtitle subtitle={"subtitle" in value ? value.subtitle : undefined}/>
		</div>
	);
}

function ItemLink({slug, collection}:
                  {
	                  slug: string;
	                  collection: "posts" | "delta"
                  }) {
	return <Link
		className={"absolute inset-0 z-0 h-full w-full"}
		href={`/${collection === "posts" ? "essays" : "delta"}/${slug}`}
	/>;
}

function SplitBar({
	                  items,
	                  type = "left"
                  }: {
	items: [OverviewItem<"posts" | "delta">, OverviewItem<"posts" | "delta">];
	type?: LayoutDirection
}) {
	const [{value: item1, relationTo: collection1}, {
		value: item2,
		relationTo: collection2
	}] = items;
	const {
		title: title1,

		category: category1,
		slug: slug1,
	} = item1;
	const {
		title: title2,

		category: category2,
		slug: slug2,
	} = item2;
	return (
		<>
			<div
				className={cn(
					"lg:border-b-solid lg:border-t-solid lg:border-r-solid relative grid grid-cols-[minmax(100px,1fr)_repeat(3,1fr)] grid-rows-[repeat(2,auto)_1fr] gap-x-[2rem] border-0 border-faded-foreground lg:border-t-[1px] lg:border-r-[1px] lg:border-b-[1px] lg:p-[2.4rem_2rem_2.4rem_0] lg:px-0 lg:py-[2.4rem]",
					type === "left"
						? "gap-y-[1rem] lg:col-[1/3]"
						: "gap-y-[2rem] lg:col-[3/5]"
				)}
			>
				<ItemLink slug={slug1} collection={collection1}/>
				<HeroImage
					className="col-[1] row-[1/4] min-h-[1px] w-full min-w-[1px] self-start rounded-[5px] pt-[100%] lg:aspect-square"
					image={"image" in item1 ? item1.image : null}/>

				<RP_BadgeTag
					wrapperClassName={
						"order-2 col-[2/-1] [&_>*]:!text-foreground [&_>*]:!border-foreground"
					}
					content={category1.title}
				/>
				<Title className="order-3 col-[2/-1] text-[16px] lg:text-[18px]">
					{title1}
				</Title>
			</div>
			<div
				className={cn(
					"lg:border-b-solid lg:border-t-solid relative grid grid-cols-[minmax(100px,1fr)_repeat(3,1fr)] grid-rows-[repeat(2,auto)_1fr] border-0 border-faded-foreground lg:ml-[-2rem] lg:border-t-[1px] lg:border-b-[1px] lg:px-[2rem] lg:py-[2.4rem]",
					type === "left"
						? "gap-x-[2rem] gap-y-[1rem] lg:col-[3/5]"
						: "gap-x-[2rem] gap-y-[2rem] lg:col-[5/-1]"
				)}
			>
				<ItemLink slug={slug2} collection={collection2}/>
				<HeroImage image={"image" in item2 ? item2.image : null}

				           aspectRatio={1}
				           className="col-[1] row-[1/4] min-h-[1px] w-full min-w-[1px] self-start rounded-[5px]"
				/>
				<RP_BadgeTag
					wrapperClassName={
						"order-2 col-[2/-1] [&_>*]:!text-foreground [&_>*]:!border-foreground"
					}
					content={category2.title}
				/>
				<Title className="order-3 col-[2/-1] text-[16px] lg:text-[18px]">
					{title2}
				</Title>
			</div>
		</>
	);
}
