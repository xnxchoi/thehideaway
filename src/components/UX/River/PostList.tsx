import {Where} from 'payload'

export const PostList = () => {
	const queryString: Where = {}
	fetch(process.env.NEXT_PUBLIC_API_URL + '/api/posts?').then((res) => res.json())
	return (
		<div className={'folder-inner'}>
			<div className={'flow-river-container'}>
				<div className={'flow-river-card'}>
					<div className={'layout-river'}>
						<div className={'ha-ha-header-area'}>
							<h2 className={'ha-header-title'}>SURF OF THE DAY</h2>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
// }<div class="folder-inner">
//   <div class="flow-river-container">
//     <div class="flow-river-card">
//       <div class="layout-river">
//         <div>
//           <div class="ha-ha-header-area">
//             <div>
//               <h2 class="brxe-heading ha-header-title">오늘의 서핑</h2>
//               <div class="ha-feed-beacon"></div>
//             </div>
//             <p class="ha-feed-info">
//               <span class="brxe-text-basic ha-refresh">피드 업데이트 : 30분 전</span>
//               <span class="ha-main-link"> </span>
//             </p>
//           </div>
//           <div class="ha-ha-header-border"></div>
//         </div>
//         <div id="feature_15525" class="brxe-dcbbqvcard-story-wrapper feature_15525"
//              data-interactions='[{"id":"raudjh"}]' data-interaction-id="44c7a3"
//              data-interaction-loop-id="dcbbqv:4:post:15525">
//           <article class="ha-card-content-pair">
//             <div>
//               <div class="story-info-wrapper">
//                 <div class="content-meta-header">
//                   <a class="inline-block highlight-author-info" data-mouse="arrow-right-min" style="color:#fff"
//                      href="https://hideawayseoul.com/x/sean-choi/" aria-label="Sean Choi" data-state="FOCUS">
//                     Sean Choi
//                   </a>
//                   <span style="margin:0 4px 0 2px">|</span>
//                   <time class="surf-time-readable" datetime="6:17 오전">
//                     7개월 전
//                   </time>
//                 </div>
//                 <div class="c-title-wrap">
//                   <a href="https://hideawayseoul.com/feature/3-late-summer/" rel="" title="" aria-label=""
//                      aria-current="page" class="title-link" style="z-index: 2" data-state="FOCUS">
//                     <h2 class="story-title-heading">3 | Late summer.</h2>
//                   </a>
//                   <div class="mobile-thumbnail">
//                     <div class="thumbnail-frame">
//                       <a href="https://hideawayseoul.com/feature/3-late-summer/" rel="" title="" aria-label=""
//                          aria-current="page" class="thumbnail-link" aria-hidden="true" data-state="FOCUS">
//                         <img width="2067" height="2560"
//                              src="data:image/svg+xml,%3Csvg%20xmlns=&#39;http://www.w3.org/2000/svg&#39;%20viewBox=&#39;0%200%202067%202560&#39;%3E%3C/svg%3E"
//                              class="attachment-post-thumbnail size-post-thumbnail wp-post-image" alt="" decoding="async"
//                              data-src="https://hideawayseoul.com/wp-content/uploads/2024/06/serhii-tyaglovsky-u2ug1a6tqew-scaled.jpg"
//                              data-type="string" data-sizes="(max-width: 2067px) 100vw, 2067px"
//                              data-srcset="https://hideawayseoul.com/wp-content/uploads/2024/06/serhii-tyaglovsky-u2ug1a6tqew-scaled.jpg 2067w, https://hideawayseoul.com/wp-content/uploads/2024/06/serhii-tyaglovsky-u2ug1a6tqew-242x300.jpg 242w, https://hideawayseoul.com/wp-content/uploads/2024/06/serhii-tyaglovsky-u2ug1a6tqew-827x1024.jpg 827w, https://hideawayseoul.com/wp-content/uploads/2024/06/serhii-tyaglovsky-u2ug1a6tqew-768x951.jpg 768w, https://hideawayseoul.com/wp-content/uploads/2024/06/serhii-tyaglovsky-u2ug1a6tqew-1240x1536.jpg 1240w, https://hideawayseoul.com/wp-content/uploads/2024/06/serhii-tyaglovsky-u2ug1a6tqew-1654x2048.jpg 1654w, https://hideawayseoul.com/wp-content/uploads/2024/06/serhii-tyaglovsky-u2ug1a6tqew-1200x1486.jpg 1200w, https://hideawayseoul.com/wp-content/uploads/2024/06/serhii-tyaglovsky-u2ug1a6tqew-600x743.jpg 600w" />
//                       </a>
//                     </div>
//                   </div>
//                 </div>
//                 <div>
//                   <span class="story-category-wrapper"
//                         style="writing-mode:vertical-lr;text-orientation:sideways"></span>
//                   <div class="story-excerpt-container">
//                     Late Summer. Evelyn and I are sitting at a diner. Neither of us are looking ✷
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <div class="story-thumbnail-wrapper">
//               <div class="pc-thumbnail">
//                 <div class="thumbnail-frame">
//                   <a href="https://hideawayseoul.com/feature/3-late-summer/" rel="" title="" aria-label=""
//                      aria-current="page" class="thumbnail-link" aria-hidden="true" tabindex="-1" style="z-index: 3"
//                      data-state="FOCUS">
//                     {' '}
//                     <span
//                       style="box-sizing:border-box;display:block;overflow:hidden;width:initial;height:initial;background:none;opacity:1;border:0;margin:0;padding:0;position:absolute;top:0;left:0;bottom:0;right:0">
//                       <img width="2067" height="2560"
//                            src="data:image/svg+xml,%3Csvg%20xmlns=&#39;http://www.w3.org/2000/svg&#39;%20viewBox=&#39;0%200%202067%202560&#39;%3E%3C/svg%3E"
//                            class="attachment-post-thumbnail size-post-thumbnail wp-post-image" alt="" decoding="async"
//                            data-src="https://hideawayseoul.com/wp-content/uploads/2024/06/serhii-tyaglovsky-u2ug1a6tqew-scaled.jpg"
//                            data-type="string" data-sizes="(max-width: 2067px) 100vw, 2067px"
//                            data-srcset="https://hideawayseoul.com/wp-content/uploads/2024/06/serhii-tyaglovsky-u2ug1a6tqew-scaled.jpg 2067w, https://hideawayseoul.com/wp-content/uploads/2024/06/serhii-tyaglovsky-u2ug1a6tqew-242x300.jpg 242w, https://hideawayseoul.com/wp-content/uploads/2024/06/serhii-tyaglovsky-u2ug1a6tqew-827x1024.jpg 827w, https://hideawayseoul.com/wp-content/uploads/2024/06/serhii-tyaglovsky-u2ug1a6tqew-768x951.jpg 768w, https://hideawayseoul.com/wp-content/uploads/2024/06/serhii-tyaglovsky-u2ug1a6tqew-1240x1536.jpg 1240w, https://hideawayseoul.com/wp-content/uploads/2024/06/serhii-tyaglovsky-u2ug1a6tqew-1654x2048.jpg 1654w, https://hideawayseoul.com/wp-content/uploads/2024/06/serhii-tyaglovsky-u2ug1a6tqew-1200x1486.jpg 1200w, https://hideawayseoul.com/wp-content/uploads/2024/06/serhii-tyaglovsky-u2ug1a6tqew-600x743.jpg 600w" />{' '}
//                     </span>
//                   </a>
//                 </div>
//               </div>
//             </div>
//             <div class="content-meta-footer">
//               <div class="meta-footer-left flex items-center">
//                 <a data-mouse="nav-dot" data-mouse-lock="tl" href="https://hideawayseoul.com/topics/fiction/"
//                    style="padding-right: 8px;" data-state="FOCUS">
//                   <span class="Gyx" style="color: oklch(from var(--fg) l c h/.86);
//                                    border-color:oklch(from var(--fg) l c h/.86);
//                                    overflow: hidden;
//                                    white-space: nowrap;
//                                    text-overflow: ellipsis;">
//                     Fiction
//                   </span>
//                 </a>
//                 <p class="coral-count">
//                   <span class="coral-count-number">8분</span>
//                 </p>
//               </div>
//               <button class="meta-footer-right" data-state="FOCUS">
//                 <a class="button button--outline--rounded relative edit__button edit-btn" data-no-swup=""
//                    href="https://hideawayseoul.com/suite/write/?in_edit&amp;storyType=feature&amp;storyId=15525&amp;storyBy=6"
//                    data-post-type="feature" data-post-id="15525" data-post-author="6" data-state="FOCUS">
//                   Edit
//                 </a>
//                 <div class="button delete-button button--outline--rounded edit__button relative" data-post-id="15525"
//                      data-post-type="feature" data-post-author="6" data-state="FOCUS">
//                   <div class="button__message main_message message-on" data-contains="message">
//                     DELETE
//                   </div>
//                   <div class="button__message button__choices" data-contains="choices">
//                     <div class="choice-button no-button">no</div>
//                     <div class="choice-button yes-button" data-action="post_delete">
//                       YES
//                     </div>
//                   </div>
//                 </div>
//               </button>
//             </div>
//           </article>
//         </div>
//         <div id="feature_15524" class="brxe-dcbbqvcard-story-wrapper feature_15524"
//              data-interactions='[{"id":"raudjh"}]' data-interaction-id="cfb72e"
//              data-interaction-loop-id="dcbbqv:5:post:15524">
//           <article class="ha-card-content-pair">
//             <div>
//               <div class="story-info-wrapper">
//                 <div class="content-meta-header">
//                   <a class="inline-block highlight-author-info" data-mouse="arrow-right-min" style="color:#fff"
//                      href="https://hideawayseoul.com/x/sean-choi/" aria-label="Sean Choi" data-state="FOCUS">
//                     Sean Choi
//                   </a>
//                   <span style="margin:0 4px 0 2px">|</span>
//                   <time class="surf-time-readable" datetime="6:15 오전">
//                     7개월 전
//                   </time>
//                 </div>
//                 <div class="c-title-wrap">
//                   <a
//                     href="https://hideawayseoul.com/feature/its-friday-and-ben-sent-me-an-invite-to-his-new-year-party/"
//                     rel="" title="" aria-label="" aria-current="page" class="title-link" style="z-index: 2"
//                     data-state="FOCUS">
//                     <h2 class="story-title-heading">
//                       It’s Friday and Ben sent me an invite to his New-Year party. </h2>
//                   </a>
//                   <div class="mobile-thumbnail">
//                     <div class="thumbnail-frame">
//                       <a
//                         href="https://hideawayseoul.com/feature/its-friday-and-ben-sent-me-an-invite-to-his-new-year-party/"
//                         rel="" title="" aria-label="" aria-current="page" class="thumbnail-link" aria-hidden="true"
//                         data-state="FOCUS"></a>
//                     </div>
//                   </div>
//                 </div>
//                 <div>
//                   <span class="story-category-wrapper"
//                         style="writing-mode:vertical-lr;text-orientation:sideways"></span>
//                   <div class="story-excerpt-container">
//                     It’s Friday and Ben sent me an invite to his New-Year party. I want to ✷
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <div class="story-thumbnail-wrapper">
//               <div class="pc-thumbnail">
//                 <div class="thumbnail-frame">
//                   <a
//                     href="https://hideawayseoul.com/feature/its-friday-and-ben-sent-me-an-invite-to-his-new-year-party/"
//                     rel="" title="" aria-label="" aria-current="page" class="thumbnail-link" aria-hidden="true"
//                     tabindex="-1" style="z-index: 3" data-state="FOCUS">
//                     {' '}
//                     <span
//                       style="box-sizing:border-box;display:block;overflow:hidden;width:initial;height:initial;background:none;opacity:1;border:0;margin:0;padding:0;position:absolute;top:0;left:0;bottom:0;right:0"></span>
//                   </a>
//                 </div>
//               </div>
//             </div>
//             <div class="content-meta-footer">
//               <div class="meta-footer-left flex items-center">
//                 <a data-mouse="nav-dot" data-mouse-lock="tl" href="https://hideawayseoul.com/topics/fiction/"
//                    style="padding-right: 8px;" data-state="FOCUS">
//                   <span class="Gyx" style="color: oklch(from var(--fg) l c h/.86);
//                                    border-color:oklch(from var(--fg) l c h/.86);
//                                    overflow: hidden;
//                                    white-space: nowrap;
//                                    text-overflow: ellipsis;">
//                     Fiction
//                   </span>
//                 </a>
//                 <p class="coral-count">
//                   <span class="coral-count-number">11분</span>
//                 </p>
//               </div>
//               <button class="meta-footer-right" data-state="FOCUS">
//                 <a class="button button--outline--rounded relative edit__button edit-btn" data-no-swup=""
//                    href="https://hideawayseoul.com/suite/write/?in_edit&amp;storyType=feature&amp;storyId=15524&amp;storyBy=6"
//                    data-post-type="feature" data-post-id="15524" data-post-author="6" data-state="FOCUS">
//                   Edit
//                 </a>
//                 <div class="button delete-button button--outline--rounded edit__button relative" data-post-id="15524"
//                      data-post-type="feature" data-post-author="6" data-state="FOCUS">
//                   <div class="button__message main_message message-on" data-contains="message">
//                     DELETE
//                   </div>
//                   <div class="button__message button__choices" data-contains="choices">
//                     <div class="choice-button no-button">no</div>
//                     <div class="choice-button yes-button" data-action="post_delete">
//                       YES
//                     </div>
//                   </div>
//                 </div>
//               </button>
//             </div>
//           </article>
//         </div>
//         <div id="feature_15523" class="brxe-dcbbqvcard-story-wrapper feature_15523"
//              data-interactions='[{"id":"raudjh"}]' data-interaction-id="6200f4"
//              data-interaction-loop-id="dcbbqv:6:post:15523">
//           <article class="ha-card-content-pair">
//             <div>
//               <div class="story-info-wrapper">
//                 <div class="content-meta-header">
//                   <a class="inline-block highlight-author-info" data-mouse="arrow-right-min" style="color:#fff"
//                      href="https://hideawayseoul.com/x/sean-choi/" aria-label="Sean Choi" data-state="FOCUS">
//                     Sean Choi
//                   </a>
//                   <span style="margin:0 4px 0 2px">|</span>
//                   <time class="surf-time-readable" datetime="6:13 오전">
//                     7개월 전
//                   </time>
//                 </div>
//                 <div class="c-title-wrap">
//                   <a href="https://hideawayseoul.com/feature/1-people-are-afraid-of-connections/" rel="" title=""
//                      aria-label="" aria-current="page" class="title-link" style="z-index: 2" data-state="FOCUS">
//                     <h2 class="story-title-heading">1 “People are afraid of connections,”</h2>
//                   </a>
//                   <div class="mobile-thumbnail">
//                     <div class="thumbnail-frame">
//                       <a href="https://hideawayseoul.com/feature/1-people-are-afraid-of-connections/" rel="" title=""
//                          aria-label="" aria-current="page" class="thumbnail-link" aria-hidden="true"
//                          data-state="FOCUS"></a>
//                     </div>
//                   </div>
//                 </div>
//                 <div>
//                   <span class="story-category-wrapper"
//                         style="writing-mode:vertical-lr;text-orientation:sideways"></span>
//                   <div class="story-excerpt-container">playlist for freudian slips, part 1.</div>
//                 </div>
//               </div>
//             </div>
//             <div class="story-thumbnail-wrapper">
//               <div class="pc-thumbnail">
//                 <div class="thumbnail-frame">
//                   <a href="https://hideawayseoul.com/feature/1-people-are-afraid-of-connections/" rel="" title=""
//                      aria-label="" aria-current="page" class="thumbnail-link" aria-hidden="true" tabindex="-1"
//                      style="z-index: 3" data-state="FOCUS">
//                     {' '}
//                     <span
//                       style="box-sizing:border-box;display:block;overflow:hidden;width:initial;height:initial;background:none;opacity:1;border:0;margin:0;padding:0;position:absolute;top:0;left:0;bottom:0;right:0"></span>
//                   </a>
//                 </div>
//               </div>
//             </div>
//             <div class="content-meta-footer">
//               <div class="meta-footer-left flex items-center">
//                 <a data-mouse="nav-dot" data-mouse-lock="tl" href="https://hideawayseoul.com/topics/fiction/"
//                    style="padding-right: 8px;" data-state="FOCUS">
//                   <span class="Gyx" style="color: oklch(from var(--fg) l c h/.86);
//                                    border-color:oklch(from var(--fg) l c h/.86);
//                                    overflow: hidden;
//                                    white-space: nowrap;
//                                    text-overflow: ellipsis;">
//                     Fiction
//                   </span>
//                 </a>
//                 <p class="coral-count">
//                   <span class="coral-count-number">9분</span>
//                 </p>
//               </div>
//               <button class="meta-footer-right" data-state="FOCUS">
//                 <a class="button button--outline--rounded relative edit__button edit-btn" data-no-swup=""
//                    href="https://hideawayseoul.com/suite/write/?in_edit&amp;storyType=feature&amp;storyId=15523&amp;storyBy=6"
//                    data-post-type="feature" data-post-id="15523" data-post-author="6" data-state="FOCUS">
//                   Edit
//                 </a>
//                 <div class="button delete-button button--outline--rounded edit__button relative" data-post-id="15523"
//                      data-post-type="feature" data-post-author="6" data-state="FOCUS">
//                   <div class="button__message main_message message-on" data-contains="message">
//                     DELETE
//                   </div>
//                   <div class="button__message button__choices" data-contains="choices">
//                     <div class="choice-button no-button">no</div>
//                     <div class="choice-button yes-button" data-action="post_delete">
//                       YES
//                     </div>
//                   </div>
//                 </div>
//               </button>
//             </div>
//           </article>
//         </div>
//         <div id="post_7323" class="brxe-dcbbqvcard-story-wrapper post_7323" data-interactions='[{"id":"raudjh"}]'
//              data-interaction-id="367f99" data-interaction-loop-id="dcbbqv:7:post:7323">
//           <article class="ha-card-content-pair">
//             <div>
//               <div class="story-info-wrapper">
//                 <div class="content-meta-header">
//                   <a class="inline-block highlight-author-info" data-mouse="arrow-right-min" style="color:#fff"
//                      href="https://hideawayseoul.com/x/john-venn/" aria-label="John Venn" data-state="FOCUS">
//                     John Venn
//                   </a>
//                   <span style="margin:0 4px 0 2px">|</span>
//                   <time class="surf-time-readable" datetime="2:27 오전">
//                     1년 전
//                   </time>
//                 </div>
//                 <div class="c-title-wrap">
//                   <a
//                     href="https://hideawayseoul.com/fiction/%eb%8b%a8%ed%8e%b8-%ed%83%80%eb%b0%94%ec%8a%a4%ec%bd%94-%eb%93%a4%ec%9d%b4%eb%b6%93%ea%b8%b0/"
//                     rel="" title="" aria-label="" aria-current="page" class="title-link" style="z-index: 2"
//                     data-state="FOCUS">
//                     <h2 class="story-title-heading">[단편] 타바스코 들이붓기</h2>
//                   </a>
//                   <div class="mobile-thumbnail">
//                     <div class="thumbnail-frame">
//                       <a
//                         href="https://hideawayseoul.com/fiction/%eb%8b%a8%ed%8e%b8-%ed%83%80%eb%b0%94%ec%8a%a4%ec%bd%94-%eb%93%a4%ec%9d%b4%eb%b6%93%ea%b8%b0/"
//                         rel="" title="" aria-label="" aria-current="page" class="thumbnail-link" aria-hidden="true"
//                         data-state="FOCUS"></a>
//                     </div>
//                   </div>
//                 </div>
//                 <div>
//                   <span class="story-category-wrapper"
//                         style="writing-mode:vertical-lr;text-orientation:sideways"></span>
//                   <div class="story-excerpt-container">
//                     2018.07.19 아 그… 그 새끼… 아, 너 비둘기 새끼 본 적 있어? 욕은 하지 마십시오. ✷
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <div class="story-thumbnail-wrapper">
//               <div class="pc-thumbnail">
//                 <div class="thumbnail-frame">
//                   <a
//                     href="https://hideawayseoul.com/fiction/%eb%8b%a8%ed%8e%b8-%ed%83%80%eb%b0%94%ec%8a%a4%ec%bd%94-%eb%93%a4%ec%9d%b4%eb%b6%93%ea%b8%b0/"
//                     rel="" title="" aria-label="" aria-current="page" class="thumbnail-link" aria-hidden="true"
//                     tabindex="-1" style="z-index: 3" data-state="FOCUS">
//                     {' '}
//                     <span
//                       style="box-sizing:border-box;display:block;overflow:hidden;width:initial;height:initial;background:none;opacity:1;border:0;margin:0;padding:0;position:absolute;top:0;left:0;bottom:0;right:0"></span>
//                   </a>
//                 </div>
//               </div>
//             </div>
//             <div class="content-meta-footer">
//               <div class="meta-footer-left flex items-center">
//                 <a data-mouse="nav-dot" data-mouse-lock="tl" href="https://hideawayseoul.com/topics/fiction/"
//                    style="padding-right: 8px;" data-state="FOCUS">
//                   <span class="Gyx" style="color: oklch(from var(--fg) l c h/.86);
//                                    border-color:oklch(from var(--fg) l c h/.86);
//                                    overflow: hidden;
//                                    white-space: nowrap;
//                                    text-overflow: ellipsis;">
//                     Fiction
//                   </span>
//                 </a>
//                 <p class="coral-count">
//                   <span class="coral-count-number">2분</span>
//                 </p>
//               </div>
//               <button class="meta-footer-right" data-state="FOCUS"></button>
//               <button data-post-id="7323" class="bookmark-btn" data-state="FOCUS">
//                 <svg width="23" height="23" viewBox="0 0 0.54 0.54" data-name="Line Color"
//                      xmlns="http://www.w3.org/2000/svg" class="icon line-color">
//                   <path d="m.27.383-.158.09V.09A.022.022 0 0 1 .134.068h.27A.022.022 0 0 1 .426.09v.383Z"
//                         style="fill:none;stroke:#fff;stroke-linecap:round;stroke-linejoin:round;stroke-width:.03"></path>
//                 </svg>
//               </button>
//             </div>
//           </article>
//         </div>
//         <div id="post_7088" class="brxe-dcbbqvcard-story-wrapper post_7088" data-interactions='[{"id":"raudjh"}]'
//              data-interaction-id="d83c7a" data-interaction-loop-id="dcbbqv:8:post:7088">
//           <article class="ha-card-content-pair">
//             <div>
//               <div class="story-info-wrapper">
//                 <div class="content-meta-header">
//                   <a class="inline-block highlight-author-info" data-mouse="arrow-right-min" style="color:#fff"
//                      href="https://hideawayseoul.com/x/john-venn/" aria-label="John Venn" data-state="FOCUS">
//                     John Venn
//                   </a>
//                   <span style="margin:0 4px 0 2px">|</span>
//                   <time class="surf-time-readable" datetime="1:28 오전">
//                     1년 전
//                   </time>
//                 </div>
//                 <div class="c-title-wrap">
//                   <a
//                     href="https://hideawayseoul.com/fiction/%eb%8b%a8%ed%8e%b8-%eb%8f%85%ec%88%98%eb%a6%ac-%eb%b6%80%eb%a6%ac%eb%8a%94-%ec%99%9c-%eb%85%b8%eb%9e%84%ea%b9%8c/"
//                     rel="" title="" aria-label="" aria-current="page" class="title-link" style="z-index: 2"
//                     data-state="FOCUS">
//                     <h2 class="story-title-heading">[단편] 독수리 부리는 왜 노랄까?</h2>
//                   </a>
//                   <div class="mobile-thumbnail">
//                     <div class="thumbnail-frame">
//                       <a
//                         href="https://hideawayseoul.com/fiction/%eb%8b%a8%ed%8e%b8-%eb%8f%85%ec%88%98%eb%a6%ac-%eb%b6%80%eb%a6%ac%eb%8a%94-%ec%99%9c-%eb%85%b8%eb%9e%84%ea%b9%8c/"
//                         rel="" title="" aria-label="" aria-current="page" class="thumbnail-link" aria-hidden="true"
//                         data-state="FOCUS"></a>
//                     </div>
//                   </div>
//                 </div>
//                 <div>
//                   <span class="story-category-wrapper"
//                         style="writing-mode:vertical-lr;text-orientation:sideways"></span>
//                   <div class="story-excerpt-container">
//                     2018.07.18 독수리 부리는 왜 노랄까? 잘못들었슴다? 독수리 부리는 왜 노랄까? 왜 두
//                     번 말하십니까 니가 ✷
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <div class="story-thumbnail-wrapper">
//               <div class="pc-thumbnail">
//                 <div class="thumbnail-frame">
//                   <a
//                     href="https://hideawayseoul.com/fiction/%eb%8b%a8%ed%8e%b8-%eb%8f%85%ec%88%98%eb%a6%ac-%eb%b6%80%eb%a6%ac%eb%8a%94-%ec%99%9c-%eb%85%b8%eb%9e%84%ea%b9%8c/"
//                     rel="" title="" aria-label="" aria-current="page" class="thumbnail-link" aria-hidden="true"
//                     tabindex="-1" style="z-index: 3" data-state="FOCUS">
//                     {' '}
//                     <span
//                       style="box-sizing:border-box;display:block;overflow:hidden;width:initial;height:initial;background:none;opacity:1;border:0;margin:0;padding:0;position:absolute;top:0;left:0;bottom:0;right:0"></span>
//                   </a>
//                 </div>
//               </div>
//             </div>
//             <div class="content-meta-footer">
//               <div class="meta-footer-left flex items-center">
//                 <a data-mouse="nav-dot" data-mouse-lock="tl" href="https://hideawayseoul.com/topics/fiction/"
//                    style="padding-right: 8px;" data-state="FOCUS">
//                   <span class="Gyx" style="color: oklch(from var(--fg) l c h/.86);
//                                    border-color:oklch(from var(--fg) l c h/.86);
//                                    overflow: hidden;
//                                    white-space: nowrap;
//                                    text-overflow: ellipsis;">
//                     Fiction
//                   </span>
//                 </a>
//                 <p class="coral-count">
//                   <span class="coral-count-number">2분</span>
//                 </p>
//               </div>
//               <button class="meta-footer-right" data-state="FOCUS"></button>
//               <button data-post-id="7088" class="bookmark-btn" data-state="FOCUS">
//                 <svg width="23" height="23" viewBox="0 0 0.54 0.54" data-name="Line Color"
//                      xmlns="http://www.w3.org/2000/svg" class="icon line-color">
//                   <path d="m.27.383-.158.09V.09A.022.022 0 0 1 .134.068h.27A.022.022 0 0 1 .426.09v.383Z"
//                         style="fill:none;stroke:#fff;stroke-linecap:round;stroke-linejoin:round;stroke-width:.03"></path>
//                 </svg>
//               </button>
//             </div>
//           </article>
//         </div>
//       </div>
//       <div class="layout-rail">
//         <div class="flex-auto">
//           <div class="rail-cart _1">
//             <h2 class="rail-cart-heading">Latest</h2>
//             <div class="rail-cart-title">
//               <span>Latest</span>
//             </div>
//             <div class="rail-cart-heading-desktop">Latest</div>
//             <ol class="cart-inner-content-list">
//               <li class="cart-list-item">
//                 <h3>
//                   <a href="https://hideawayseoul.com/feature/4-its-been-over-ten-days/" rel="" class="cart-item-title"
//                      title="" aria-label="" data-state="FOCUS">
//                     4 | It’s been over ten days
//                   </a>
//                 </h3>
//                 <div class="cart-item-meta">
//                   <span class="cart-item-author">
//                     <a href="https://hideawayseoul.com/x/sean-choi/" title="Sean Choi" data-state="FOCUS">
//                       Sean Choi
//                     </a>
//                   </span>
//                   <span>6:19 오전 </span>
//                 </div>
//               </li>
//               <li class="cart-list-item">
//                 <h3>
//                   <a href="https://hideawayseoul.com/feature/3-late-summer/" rel="" class="cart-item-title" title=""
//                      aria-label="" data-state="FOCUS">
//                     3 | Late summer.
//                   </a>
//                 </h3>
//                 <div class="cart-item-meta">
//                   <span class="cart-item-author">
//                     <a href="https://hideawayseoul.com/x/sean-choi/" title="Sean Choi" data-state="FOCUS">
//                       Sean Choi
//                     </a>
//                   </span>
//                   <span>6:17 오전 </span>
//                 </div>
//               </li>
//               <li class="cart-list-item">
//                 <h3>
//                   <a
//                     href="https://hideawayseoul.com/feature/its-friday-and-ben-sent-me-an-invite-to-his-new-year-party/"
//                     rel="" class="cart-item-title" title="" aria-label="" data-state="FOCUS">
//                     It’s Friday and Ben sent me an invite to his New-Year party.
//                   </a>
//                 </h3>
//                 <div class="cart-item-meta">
//                   <span class="cart-item-author">
//                     <a href="https://hideawayseoul.com/x/sean-choi/" title="Sean Choi" data-state="FOCUS">
//                       Sean Choi
//                     </a>
//                   </span>
//                   <span>6:15 오전 </span>
//                 </div>
//               </li>
//               <li class="cart-list-item">
//                 <h3>
//                   <a href="https://hideawayseoul.com/feature/1-people-are-afraid-of-connections/" rel=""
//                      class="cart-item-title" title="" aria-label="" data-state="FOCUS">
//                     1 “People are afraid of connections,”
//                   </a>
//                 </h3>
//                 <div class="cart-item-meta">
//                   <span class="cart-item-author">
//                     <a href="https://hideawayseoul.com/x/sean-choi/" title="Sean Choi" data-state="FOCUS">
//                       Sean Choi
//                     </a>
//                   </span>
//                   <span>6:13 오전 </span>
//                 </div>
//               </li>
//             </ol>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
//   <a id="brxe-odssbh" class="brxe-button button button--large--outline--rounded bricks-button"
//      href="https://hideawayseoul.com/all-stories" rel="nofollow" data-state="FOCUS">
//     ALL STORIES
//   </a>
// </div>
