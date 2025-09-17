import {
	MediaReq,
	SingleArticle,
} from "@/payload/collections/Posts/post-types";
import {Link} from "@/components/UX/Link";
import {FrontImage, FrontImageProps} from "@/components/UX/Media/FrontImage";
import {ComponentPropsWithoutRef} from "react";
import {cn} from "@/lib/utils";
import {formatDateTime} from "@/utilities/formatDateTime";
import {useTheme} from "@/providers/Theme";

export const CoverWrap = (
	props: {
		children: React.ReactNode;
	} & ComponentPropsWithoutRef<"div">,
) => {
	const {children, className, ...rest} = props;
	return (
		<div className={cn("-order-1 p-0", className)} {...rest}>
			<div className="relative h-full w-full">{children}</div>
		</div>
	);
};

export const CoverCard = (
	props: {
		children: React.ReactNode;
	} & ComponentPropsWithoutRef<"div">,
) => {
	const {children, className, ...rest} = props;
	return (
		<div className={cn(
			"cover_card relative mx-auto my-0 grid h-[clamp(400px,calc(75vh-var(--headerHeight)),700px)] w-full max-w-[1440px] overflow-hidden rounded-[10px] p-0 min-md:rounded-[20px]",
			className,
		)}
		     {...rest}
		>
			{children}
		</div>
	);
};

export const CoverTitleCard = (
	props: {
		children: React.ReactNode;
	} & ComponentPropsWithoutRef<"div">,
) => {
	const {children, className, ...rest} = props;
	return (
		<div className={cn("rp_title-card title-grid rounded-xl", className)}
		     {...rest}
		>
			{children}
		</div>
	);
};

export const CoverMeta = (
	props: {
		publishedAt: SingleArticle["publishedAt"];
		className?: string;
	} & ComponentPropsWithoutRef<"div">,
) => {
	const {publishedAt, className, ...rest} = props;

	return (
		<div className={cn(
			"rp_meta z-10 col-span-1 row-6 mt-[10px] font-sans text-[11.7px] leading-[1.17] uppercase md:text-[14px]",
			className,
		)}
		     {...rest}
		>
			{publishedAt && (
				<div>
					<time className="z-[10]" dateTime={publishedAt}>
						{formatDateTime(publishedAt)}
					</time>
				</div>
			)}
		</div>
	);
};
export const CoverTag = (
	props: {
		category?: SingleArticle["category"] | null;
	} & ComponentPropsWithoutRef<"a">,
) => {
	const {category, className} = props;

	return (
		<div className={cn("rp_title-tag")}>
			<Link href={`/archives/${category?.slug}`} className={cn("rp_tag", className)}>
				{category?.title || "Untitled category"}
			</Link>
		</div>
	);
};
export const CoverTitle = (
	props: {
		title?: SingleArticle["title"] | null;
	} & ComponentPropsWithoutRef<"div"> & { h1?: ComponentPropsWithoutRef<"h1"> },
) => {
	const {title, className, h1} = props;
	const {className: h1ClassName, ...h1Props} = h1 || {};

	return (
		<div className={cn("rp-title", className)}>
			<h1 className={cn(
				"text-faded-black group-dark:text-faded-white pointer-events-none m-0 font-black tracking-tighter uppercase",
				h1ClassName,
			)} data-themed="color, background-color, border-color"
			    {...h1Props}
			>
				{title}
			</h1>
		</div>
	);
};
export const CoverSubtitle = (
	props: {
		subtitle?: SingleArticle["subtitle"] | null;
		subtitleClassName?: string;
	} & ComponentPropsWithoutRef<"div">,
) => {
	const {subtitle, className, subtitleClassName} = props;

	return (
		<div className={cn("rp__sub-t", className)}>
			<p className={cn(
				"m-0 !text-[14.4px] leading-[1.3] md:!text-[17.6px]",
				subtitleClassName,
			)}>
				{subtitle}</p>
		</div>
	);
};
export const CoverImage = (
	props: {
		image?: SingleArticle["image"] | null;
	} & FrontImageProps,
) => {
	const {image, className} = props;

	return (
		<div className={cn("rp_pxf rp_img", className)}>
			{(image &&
				(typeof image === "string" ? (
					<FrontImage fill priority={false} loading="lazy" imgClassName={cn(
						"rp_lazy thumb css-filter size-large",
						props.imgClassName,
					)} resource={{
						id: image,
						createdAt: "",
						updatedAt: "",
						url: `/api/media/${image}`,
					}} />
				) : (
					<FrontImage fill priority={false} loading="lazy" imgClassName={cn(
						"rp_lazy thumb css-filter size-large",
						props.imgClassName,
					)} resource={image} caption={
						<Link className="link-underline" target="_blank" style={{color: "inherit"}}
						      rel="noreferrer" href="/">
							THE HIDEAWAY
						</Link>
					} />
				))) || (
				<div className={cn(
					"rp_lazy thumb css-filter size-large bg-edge-black/20",
					props.imgClassName,
				)} />
			)}
		</div>
	);
};
export const CoverAuthor = (
	props: {
		author?: SingleArticle["author"] | null;
		authorClassName?: string;
	} & ComponentPropsWithoutRef<"div">,
) => {
	const {author, className, authorClassName, ...rest} = props;

	return (
		<address className={cn("rp-author-info z-10")}>
			<div className={cn("rp__a-m text-[oklch(var(--off-fg)/1)]", className)}
			     {...rest}
			>
				{author && (
					<>
						By &nbsp;
						<Link href={`/@${author.slug}`}
						      className={cn("bg-transparent break-words", authorClassName)}>
							{author.name}
						</Link>
					</>
				)}
			</div>
		</address>
	);
};
