import {Link} from "@/components/UX/Link/Link";
import React from "react";

export const PageRange: React.FC<{
	className?: string;
	collection?: string;
	prevPage?: number;
	nextPage?: number;
	page?: number;
	limit?: number;
	basePath: string;
	totalDocs?: number;
	totalPages?: number;
}> = (props) => {
	const {
		className,
		basePath, prevPage, nextPage, totalDocs, totalPages,
		page,
		limit,
	} = props;

	let indexStart = (page ? page - 1 : 1) * (limit || 1) + 1;
	if (totalPages && indexStart > totalPages) indexStart = 0;

	let indexEnd = (page || 1) * (limit || 1);
	if (totalPages && indexEnd > totalPages) indexEnd = totalPages;

	return (
		<div className="flex w-full">
						<span className="justify-start w-1/3 flex grow shrink">
							{prevPage && <Link className="inline-flex -m-6 p-6"
                                               href={`${basePath}/${prevPage}`}>Prev</Link>}
						</span>
			<span className="flex grow shrink w-1/3 justify-center">
							Page {indexStart} of {indexEnd}
						</span>
			<span
				className="justify-end w-1/3 flex grow shrink">{nextPage &&
                <Link className="inline-flex -m-6 p-6"
                      href={`${basePath}/${nextPage}`}>Next</Link>}</span>

		</div>
	);
};
