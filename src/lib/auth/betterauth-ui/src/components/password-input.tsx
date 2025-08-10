"use client";

import {EyeIcon, EyeOffIcon} from "lucide-react";
import {type ComponentProps, useState} from "react";
import * as m from "motion/react-m";
import {cn} from "../lib/utils";
import {Button} from "@/components/ui/button";

import {Input} from "@/components/ui/input";
import {AnimatePresence} from "motion/react";

export function PasswordInput({
	className,
	enableToggle,
	onChange,
	...props
}: ComponentProps<typeof Input> & { enableToggle?: boolean }) {
	const [disabled, setDisabled] = useState(true);
	const [isVisible, setIsVisible] = useState(false);
	const isEnabled = enableToggle ?? true;
	return (
		<>
			<Input className={cn(isEnabled && "pr-10", className, "w-input")}
			       {...props} type={isVisible && isEnabled ? "text" : "password"}
			       onChange={(event) => {
				       setDisabled(!event.target.value);
				       onChange?.(event);
			       }} />
			{isEnabled && (
				<div className={
					"absolute bottom-1 top-0 right-0 flex flex-col items-center"
				}>
					<Button className="!bg-transparent" disabled={disabled} size="icon"
					        type="button" variant="ghost" onClick={() => setIsVisible(!isVisible)}>
						<AnimatePresence initial={false} mode={"sync"}>
							{isVisible && (
								<m.svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
								       viewBox="0 0 24 24" fill="none" stroke="currentColor"
								       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
								       className="lucide lucide-eye-icon lucide-eye" initial={{
									scaleY: 0,
									transition: {
										type: "tween",
										duration: 0.3,
										ease: "easeIn",
									},
								}} animate={{
									scaleY: 1,
									transition: {
										type: "tween",
										duration: 0.5,
										delay: 0.5,
										ease: "easeIn",
									},
								}} exit={{
									scaleY: 0,
									transition: {
										type: "tween",
										duration: 0.5,
										ease: "easeIn",
									},
								}}>
									<path
										d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
									<circle cx="12" cy="12" r="3" />
								</m.svg>
							)}{!isVisible && (
							<m.svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
							       viewBox="0 0 24 24" fill="none" stroke="currentColor"
							       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
							       className="lucide lucide-eye-closed-icon lucide-eye-closed"
							       initial={{
								       scaleY: 0,
								       transition: {
									       type: "tween",
									       duration: 0.3,
									       ease: "easeIn",
								       },
							       }} animate={{
								scaleY: 1,
								transition: {
									type: "tween",
									delay: 0.5,
									duration: 0.5,
									ease: "easeIn",
								},
							}} exit={{
								scaleY: 0,
								transition: {
									type: "tween",
									duration: 0.5,
									ease: "easeIn",
								},
							}}>
								<path d="m15 18-.722-3.25" />
								<path d="M2 8a10.645 10.645 0 0 0 20 0" />
								<path d="m20 15-1.726-2.05" />
								<path d="m4 15 1.726-2.05" />
								<path d="m9 18 .722-3.25" />
							</m.svg>
						)}
						</AnimatePresence>
					</Button>
					<style>{`
                        .hide-password-toggle::-ms-reveal,
                        .hide-password-toggle::-ms-clear {
                            visibility: hidden;
                            pointer-events: none;
                            display: none;
                        }
                    `}</style>
				</div>
			)}
		</>
	);
}
