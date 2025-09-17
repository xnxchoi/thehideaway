"use client";

import {
	ButtonHTMLAttributes,
	HTMLAttributes,
	use,
	useEffect,
	useState,
} from "react";
import {useRPStore} from "@/providers/RP_Pro";
import {RP_Btn} from "src/components/UX/Link";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropOutButton,
	LinkedDropdownItem,
} from "@/components/ui/dropdown-menu";
import {RPTooltip} from "@/components/UX/tooltip";
import {UserAvatar} from "@/lib/auth/betterauth-ui/src";
import {cn} from "@/lib/utils";
import * as m from "motion/react-m";
import {useBetterAuth} from "@/lib/auth/context";
import {User} from "@/payload-types";
import {useRPSession} from "@/lib/auth/session/RP_SessionProvider";

interface SlitProps extends HTMLAttributes<HTMLDivElement> {
	style: HTMLAttributes<HTMLDivElement>["style"] & {
		"--orz": string;
		"--id": number;
		"--ol": string;
		"--tm": string;
		"--thx": string;
	};
	size: "T" | "S";
}

// const Slit = forwardRef<HTMLDivElement, SlitProps>((props, ref) => {
//   let { size, ...rest } = props
//   return <div className={cn({ sh: size === 'S', tl: size === 'T' })} ref={ref} {...rest} />
// })
export type RP_DDProps = HTMLAttributes<HTMLDivElement> & {
	moves: HTMLElement[];
};

export interface DD_ToggleButtonProps
	extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
	style: HTMLAttributes<HTMLButtonElement>["style"] & {
		"--of"?: string | number;
	};
}

interface DDUser {
	name: string;
	role: string;
	slug: string;
	id: string;
	image?: string | null;
}

export function UserDropdown() {
	const user=useRPSession(r=>r)
	const dropdownOpen = useRPStore((store) => store.dropdownOpen);
	const setD = useRPStore((store) => store.setDropdownOpen);
	const [isOpen, setIsOpen] = useState(false);
	useEffect(() => {
		if (dropdownOpen) {
			setIsOpen(true);
		} else {
			setIsOpen(false);
		}
	}, [dropdownOpen]);

	return (
		<m.div initial={{opacity: 0,scaleX:0.01}} animate={{opacity: 1,
		scaleX:1,
		}} exit={{opacity: 0
		,
			scaleX:0.01,
		}} key={user.id}
		       transition={{duration: 0.3, ease: "easeOut"}}>
			<DropdownMenu open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
				<DropdownMenuTrigger asChild>
					<RP_Btn className={"has-tooltip flex items-center justify-center"}
					        style={{display: "flex"}} aria-label={`@${user.name}`}>
						<UserAvatar user={user} />
						<RPTooltip className="top text-sm" label={`@${user.name}`} />
					</RP_Btn>
				</DropdownMenuTrigger>
				<DropdownMenuContent sideOffset={15} className="right-[15px] w-56">
					<DropdownMenuLabel className={cn(
						"flex items-center px-3 py-3 font-sans text-sm leading-[1] font-light",
					)}>
						<span className="text-xs">@</span>
						<span className="text-sm">{user.name}</span>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<LinkedDropdownItem href={`/@${user?.slug}`}
						                    title={"Profile"}></LinkedDropdownItem>
						<LinkedDropdownItem href={`/prive`} title={"Settings"}></LinkedDropdownItem>
						<LinkedDropdownItem
							href={"/vault/collections/posts"}
							title="Your Posts"></LinkedDropdownItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropOutButton />
				</DropdownMenuContent>
			</DropdownMenu>
		</m.div>
	);
}
