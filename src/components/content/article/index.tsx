"use client";
import { SplitCard } from "@/blocks/heros/ArtHero";
import RichText from "@/payload/fields/RichText";
import { MoreLikeThis } from "@/blocks/RelatedPosts/Component";
import { InView } from "react-intersection-observer";
import { ComponentPropsWithRef } from "react";
import { SingleArticle } from "@/types/collections/posts";
import { Locked } from "@/components/UX/Locked/Locked";

type ArticleWrapperProps = Omit<
  ComponentPropsWithRef<"article">,
  "onChange"
> & {
  post: SingleArticle;

  onChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
};
export const Article = (props: ArticleWrapperProps) => {
  const { post, onChange, ...rest } = props;

  return (
    <article
      {...rest}
      className="rp-article relative"
      data-id={post.id}
      data-themed="background-color,color"
    >
      <SplitCard post={post} />
      <div className="mx-auto my-[28px] w-full max-w-(--maxContainerWidth) px-0 py-[32px]">
	      <div className="rp-content &>*:col-[main] [&>aside]:col-4">
          {post.disabled ? (
            <Locked />
          ) : (
            <RichText data={post.content} enableGutter={false} />
          )}
          <aside className="z-2 lg:col-4 lg:row-[2/span_20] lg:mx-auto lg:my-0 lg:w-full lg:max-w-[350px]">
            <div className="side-card">
              <div className="story-side dzk">
                <div className="side-head">More Like This</div>
                {post.relatedPosts && post.relatedPosts.length > 0 && (
                  <MoreLikeThis
                    docs={post.relatedPosts.filter(
                      (post) => typeof post === "object"
                    )}
                  />
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
      <InView
        id={`${post.id}`}
        className="next-loader absolute bottom-0 h-[15vh] w-full"
        onChange={onChange}
        threshold={0.8}
        as="div"
      />
      <div className="f-divider mt-[50px] h-px w-full min-w-px" />
    </article>
  );
};
