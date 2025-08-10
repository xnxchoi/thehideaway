import React, {Fragment} from "react";

import {ArchiveBlock} from "@/payload/blocks/ArchiveBlock/Component";
import {CallToActionBlock} from "@/payload/blocks/CallToAction/Component";
import {ContentBlock} from "@/payload/blocks/Content/Component";
import {MediaBlock} from "@/payload/blocks/MediaBlock/Component";
import type {Page} from "@/payload-types";
import {FOTDBlock} from "@/payload/blocks/FOTD/Component";
import {HeroSquareBlock} from "@/payload/blocks/HeroSquareBlock/Component";
import {Flatten} from "@/utilities/typeUtilities";

const blockComponents = {
	archive: ArchiveBlock,
	content: ContentBlock,
	cta: CallToActionBlock,
	mediaBlock: MediaBlock,
	fotd: FOTDBlock,
	heroSquare: HeroSquareBlock,
};
type BlockLayout = Flatten<NonNullable<Page["layout"]>>;
export const RenderBlocks: React.FC<{
	blocks: NonNullable<Page["layout"]> | undefined | null;
}> = (props) => {
	const {blocks} = props;

	const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0;

	if (hasBlocks) {
		return (
			<>
				{blocks.map((block, index) => {
					const {blockType} = block;

					if (blockType && blockType in blockComponents) {
						const Block = blockComponents[blockType];

						if (Block) {
							return (
								<div className="my-16" key={index}>
									<Block {...(block as any)} />
								</div>
							);
						}
					}
					return null;
				})}
			</>
		);
	}

	return null;
};
