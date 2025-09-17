"use client"
import {ComponentProps, ComponentPropsWithoutRef} from 'react'
import {Link} from 'src/components/UX/Link'
import {DateTime} from 'luxon'
import {HomeSquare} from '@/components/layouts/HomeSquare'
import {RP_BadgeTag} from '@/components/UX/RP_BadgeTag'
import {FrontImage} from '@/components/UX/Media/FrontImage'
import {ArticleOverview} from '@/payload/collections/Posts/post-types'
import {cn} from "@/lib/utils"
import {useTheme} from "@/providers/Theme"

export const HomeArticleLayout = (props: {
	posts: ArticleOverview[]
	className?: string
}) => {
	const {posts, className} = props
	const theme = useTheme((r) => r.theme)
	return (
		<div className="mx-2.5 my-0 max-w-[600px] sm:mx-auto lg:max-w-[98vw]">
			<div className={cn(
				`mb-[48px] justify-center gap-x-[20px] rounded-[2rem] p-[2rem] md:block lg:mr-[2rem] lg:ml-[2rem] xl:mb-[100px] xl:flex xl:gap-x-[90px] bg-linear-to-b to-transparent`,
				theme === "dark"
					? "from-[oklch(var(--off-black)/.95)]"
					: "from-[oklch(var(--faded-bg)/.95)] bg-blend-darken",
			)}>
				<div
					className="mb-6 border-b-[1px] border-solid border-[oklch(var(--off-fg)/.5)] md:min-w-1/2 md:flex-[1] md:border-b-0 md:pb-0 lg:min-w-[680px]">
					<div
						className="grid grid-cols-[1fr_1fr] gap-y-[20px] lg:grid-cols-[repeat(4,1fr)] lg:gap-x-[20px]">
						{posts[0] && <HomeSquare article={posts[0]} />}
						{posts[1] && (
							<Link href={"/posts/" + `${posts[1].slug}`}
							      className="grid gap-y-[20px] border-t-[1px] border-r-[1px] border-b-[1px] border-solid border-[color:oklch(var(--fg)/.5)] bg-transparent p-[20px] pl-0 break-words decoration-[none] lg:col-[1/3] lg:row-[2] lg:mr-[-10px] lg:grid-cols-[1fr_1fr] lg:gap-x-[20px]">
								<div
									className="relative min-h-[1px] w-full min-w-[1px] self-start rounded-[5px] pt-[100%] lg:row-[1/3]">
									{posts[1].image && (
										<FrontImage
											imgClassName="rounded-[5px] absolute object-cover top-0 block w-full h-full max-w-[100%] border-0 transition-opacity duration-400 backface-hidden"
											resource={posts[1].image as any} />
									)}
								</div>
								<RP_BadgeTag content={
									(posts[1]?.category &&
										typeof posts[1].category !== "string" &&
										posts[1].category.title) ||
									"RP"
								} />
								<p className="m-0 text-[16px] font-bold tracking-[-.01em] lg:col-[2] lg:row-[2] lg:self-end">
                  <span className="text-3xl text-balance">
                    {posts[1].title}
                  </span>
								</p>
							</Link>
						)}
						{posts[2] && (
							<Link href={"/posts/" + `${posts[2].slug}`}
							      className="grid gap-y-[20px] border-t-[1px] border-r-0 border-b-[1px] border-[color:oklch(var(--fg)/.5)] bg-transparent p-[20px] pr-0 break-words decoration-[none] lg:col-[3/5] lg:row-[2] lg:mr-[0px] lg:ml-[-10px] lg:grid-cols-[1fr_1fr] lg:gap-x-[20px]">
								<div
									className="relative min-h-[1px] w-full min-w-[1px] self-start rounded-[5px] pt-[100%] lg:row-[1/3] lg:aspect-square">
									{posts[2].image && (
										<FrontImage
											imgClassName="rounded-[5px] absolute object-cover top-0 block w-full h-full max-w-[100%] border-0 transition-opacity duration-400 backface-hidden"
											resource={posts[2].image as any} />
									)}
								</div>
								<RP_BadgeTag content={
									(posts[2]?.category &&
										typeof posts[2].category !== "string" &&
										posts[2].category.title) ||
									"RP"
								} />
								<p className="m-0 text-[16px] font-bold tracking-[-.01em] lg:col-[2] lg:row-[2] lg:self-end">
                  <span className="text-3xl text-balance">
                    {posts[2].title}
                  </span>
								</p>
							</Link>
						)}
					</div>
				</div>
				<ArticleList posts={posts} />
			</div>
		</div>
	)
}
const ArticleList = (props: { posts: (ArticleOverview)[] } & ComponentProps<'div'>) => {
	const {posts, ...rest} = props

	return (
		<div className="m-auto w-full max-w-[96vw] pt-[1rem] lg:m-0 lg:max-w-[420px]" {...rest}>
			<div>
				<div className="mb-0 flex items-center justify-between gap-x-[16px]">
					<h2 className="text-[16px]">Headliners</h2>
				</div>
			</div>
			{posts.length > 0
				? posts.map((doc, index) => {
					const {
						title,
						publishedAt,
						author,
						subtitle,
						image,
						slug,
						category,
						id,
						bookmarks,
						bookmarksCount,tags
					} = doc

					return (
						<Article articleID={id} index={index} bookmarks={bookmarks}
						   tags={tags}      bookmarksCount={bookmarksCount} category={category} image={image}
						         author={author} subtitle={subtitle} title={title!}
						         publishedAt={publishedAt || ""} slug={slug ?? ""} key={index} />
					)
				})
				: [1, 2, 3, 4, 5].map((r) => (
					<div key={'r-' + r}
					     className="mb-0 flex items-center justify-between gap-x-[16px]">
						<h2 className="text-[16px]"></h2>
					</div>
				))}
		</div>
	)
}

const Article = (props: ComponentPropsWithoutRef<'div'> & Omit<ArticleOverview, 'id'> & {
	articleID: string;
	index: number
}) => {
	const {
		title,
		image,
		slug,
		publishedAt,
		author,
		index,
		category,
		subtitle,
		articleID,
	} = props
	return (
		<>
			<div
				className="absolute z-[10] mt-[32px] -ml-[4px] flex w-[14px] h-[14px] text-[9px] lg:h-[20px] lg:w-[20px] items-center justify-center rounded-[50%] bg-[oklch(var(--off-fg)/.4)] lg:text-[1.1rem] lg:mt-[20px] lg:ml-[-40px]">
				{index + 1}
			</div>
			<div
				className="relative flex flex-row-reverse justify-between border-b-[1px] border-[color:oklch(var(--fg)/.5)] pt-[16px] pr-0 pb-[15px] pl-0 lg:pt-[20px] lg:pb-[20px]">
				<div
					className="relative ml-[16px] aspect-[4/3] h-[75px] self-start bg-[oklch(var(--off-bg)/.1)]">
					{image && (
						<FrontImage alt={title}
						            className="border-color-[oklch(var(--off-bg)/.9)] radius-[4px] border-[1px] border-solid absolute inset-0"
						            resource={image} />
					)}
				</div>
				<div className="grow self-start">
					<div className="max-lg:py-[5px] max-lg:px-[10px]">
						<div className="max-lg:pl-[10px] relative">
							<div>
								<div className="text-[18px] tracking-normal lg:text-[20px]">
									<Link
										className="shadow-[inset 0 -1px 0 0 transparent] font-bold before:absolute before:inset-0 before:z-[1] before:h-full before:w-full before:content-['']"
										href={"/posts/" + `${slug}`}>
										{title}
									</Link>
								</div>
							</div>
							<div className="relative mt-[6px] leading-[1px]">
                <span className="inline text-[1.1rem] tracking-[0.1em] uppercase">
                  <span>{author.name}</span>
                </span>
								<span
									className="ml-[.75em] inline text-[1.1rem] tracking-[0.1em] uppercase">
                  <time dateTime={publishedAt}>
                    {publishedAt.length > 0 &&
	                    DateTime.fromISO(publishedAt).toRelative()}
                  </time>
                </span>
								<span
									className="mx-3 inline text-[1.1rem] tracking-[0.1em] text-[oklch(var(--faded-fg)/1)] font-sans uppercase before:content-['|']">
                  <Link className="mr-2 inline-block whitespace-nowrap"
                        href={"/posts/" + slug + "#comments"}>
                    <svg className="inline fill-current align-middle" width={12} height={12}
                         fill="none" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                      <title>Comments</title>
                      <desc>Comment Icon Bubble</desc>
                      <path fillRule="evenodd" clipRule="evenodd"
                            d="M2.8999 2.10001C2.76729 2.10001 2.64012 2.15268 2.54635 2.24645C2.45258 2.34022 2.3999 2.4674 2.3999 2.60001V9.3929L3.6928 8.10001H9.8999C10.0325 8.10001 10.1597 8.04733 10.2535 7.95356C10.3472 7.85979 10.3999 7.73261 10.3999 7.60001V2.60001C10.3999 2.4674 10.3472 2.34022 10.2535 2.24645C10.1597 2.15268 10.0325 2.10001 9.8999 2.10001H2.8999ZM1.83924 1.53935C2.12055 1.25804 2.50208 1.10001 2.8999 1.10001H9.8999C10.2977 1.10001 10.6793 1.25804 10.9606 1.53935C11.2419 1.82065 11.3999 2.20218 11.3999 2.60001V7.60001C11.3999 7.99783 11.2419 8.37936 10.9606 8.66067C10.6793 8.94197 10.2977 9.10001 9.8999 9.10001H4.10701L1.3999 11.8071V2.60001C1.3999 2.20218 1.55794 1.82065 1.83924 1.53935Z" />
                    </svg>
                    <span
	                    className="data-[count=0]:before:content-['+'] mx-[4px] my-0 inline-flex flex-[0_0_auto] leading-[20px] group"
	                    data-count={0}>
                      <span
	                      className="text-[1.1rem] tracking-widest text-[oklch(var(--faded-fg)/1)] uppercase group-data-[count=0]:hidden">
                        0
                      </span>
                    </span>
                  </Link>
                </span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
