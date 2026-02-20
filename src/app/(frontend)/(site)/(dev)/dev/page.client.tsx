"use client";

import {Surf} from "@/components/content/surf/surf";

export default function PageClient({}: {}) {
	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center">
			<Surf/>
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
