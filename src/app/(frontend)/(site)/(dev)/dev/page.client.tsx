"use client";

import type {SingleArticle} from "@/payload/collections/Posts/post-types";
import {RPage} from "@/components/UX/Transition";
import dynamic from "next/dynamic";
import {CitationRange} from "@/components/UX/Highlightr/types";
import {Signature} from "@/components/UX/Signature";

export default function PageClient({}: {}) {
	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center">
			<Signature></Signature>
		</div>
	);
}
/**<AnimatePresence mode={"sync"}>

        </AnimatePresence>
 *  <motion.div
 *             className={
 *               "bg-foreground/20 pointer-events-none fixed inset-0 z-[250] flex h-screen w-screen flex-col items-center justify-center backdrop-blur-2xl"
 *             }
 *             transition={{
 *               type: "tween",
 *               ease: "easeInOut",
 *               duration: 0.5,
 *             }}
 *             initial={{ opacity: 0 }}
 *             animate={{ opacity: 1 }}
 *             exit={{ opacity: 0 }}
 *           ></motion.div>
 */
