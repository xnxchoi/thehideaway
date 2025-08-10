import {ComponentPropsWithoutRef} from "react";
import {Link} from "../Link";

type LockedProps = {
	type?: "tier" | "allowList" | "admin" | "user";
	content?: string;
	tier?: NonNullable<any>["role"];
} & ComponentPropsWithoutRef<"div">;

export const Locked = ({type, content, tier, ...rest}: LockedProps) => {
	const message =
		type === "user"
			? "This content is only available for registered members"
			: type === "tier"
				? `This content is available for members with ${tier ?? "Some"} access or higher`
				: type === "allowList"
					? "Content requires authorization from the author"
					: "This content is restricted";
	const title =
		type === "user"
			? "Members Only"
			: type === "tier" || type === "allowList"
				? "Access Restricted"
				: "Access Locked";
	return (
		<div className="fixed w-screen h-screen z-50 flex items-center justify-center inset-0">
			<div
				className="z-2 relative flex-col flex items-center flex-wrap gap-[25px] justify-center rounded-[6px] backdrop-blur-sm py-[100px] w-full md:w-[calc((100vw-215px)*7/12+90px)] bg-[oklch(var(--off-fg)/.2)] ">
				<div
					className="border border-solid w-[60px] h-[60px] rounded-full grid place-items-center"
					style={{background: "0 0"}}>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" height="18"
					     viewBox="0 0 16 18" width="16">
						<path
							d="m12.5556 7.22222v-1.77778c0-2.45459-1.9899-4.44444-4.44449-4.44444-2.4546 0-4.44444 1.98985-4.44444 4.44444v1.77778m4.44444 3.99998v1.7778m-2.84444 4h5.68893c1.4934 0 2.2402 0 2.8106-.2906.5018-.2557.9097-.6637 1.1654-1.1654.2906-.5705.2906-1.3172.2906-2.8107v-1.2444c0-1.49348 0-2.24022-.2906-2.81065-.2557-.50177-.6636-.90972-1.1654-1.16538-.5704-.29065-1.3172-.29065-2.8106-.29065h-5.68893c-1.49348 0-2.24021 0-2.81064.29065-.50177.25566-.90972.66361-1.16538 1.16538-.29065.57043-.29065 1.31717-.29065 2.81065v1.2444c0 1.4935 0 2.2402.29065 2.8107.25566.5017.66361.9097 1.16538 1.1654.57043.2906 1.31716.2906 2.81064.2906z"
							stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
							strokeWidth="1.33333" />
					</svg>
				</div>
				<h2 className="sm-title">{title}</h2>
				<div>{message}</div>
				<div className="relative">
					<Link href="/register"
					      className="flex-[0_0_auto] relative flex flex-row justify-center items-center w-full gap-[12px] py-0 px-[16px] h-[41px] overflow-hidden rounded-lg border-solid border-[1px] border-[oklch(var(--faded-fg)/.8)] transition-colors duration-300 ease-in-out uppercase min-w-[120px] hover:text-[oklch(var(--bg)/1)] hover:border-[oklch(var(--bg)/.1)] hover:bg-[oklch(var(--faded-fg)/.3)]">
						<svg
							className="object-contain absolute m-0 w-[11px] h-full inline-block left-[16px]"
							xmlns="http://www.w3.org/2000/svg" fill="none" height="13"
							viewBox="0 0 11 13" width="11">
							<path clipRule="evenodd"
							      d="m.5.00000087.000001 8.99999913h8.292889l-2.32842 2.3284c-.19527.1953-.19527.5119 0 .7071.19526.1953.51184.1953.7071 0l3.18203-3.18195c.1952-.19526.1952-.51184 0-.7071l-3.18203-3.18198c-.19526-.19527-.51184-.19527-.7071 0-.19527.19526-.19527.51184 0 .7071l2.32842 2.32843h-7.29289v-7.99999921z"
							      fill="currentColor" fillRule="evenodd" />
						</svg>
						<span className="h-full text-center w-full">
              <span>{content ?? "Get Access"}</span>
            </span>
					</Link>
				</div>
			</div>
		</div>
	);
};
