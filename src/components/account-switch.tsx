"use client"

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Button} from "@/components/UX/Link"
import {
	Command,
	CommandGroup,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import {authClient} from "@/lib/auth/client"
import {useBetterAuth} from "@/lib/auth/context"
import {ChevronDown, PlusCircle} from "lucide-react"
import {useRouter} from "next/navigation"
import {use, useState} from "react"
import {User} from "@/payload-types"

export default function AccountSwitcher() {
	const {currentUserPromise, deviceSessionsPromise} = useBetterAuth()
	const currentUser = use(currentUserPromise) as
		| (User & { collection: "users" })
		| null
	const deviceSessions = use(deviceSessionsPromise)
	const [open, setOpen] = useState(false)
	const router = useRouter()

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button data-expanded={open} role="combobox" aria-expanded={open}
				        aria-label="Select a user"
				        className="w-[250px] justify-between text-foreground font-sans outline-groove outline-1 flex items-center rounded-[12px] px-4 shadow-sm/25 dark:shadow-md/30 hover:bg-[oklch(var(--muted-faded-fg)/.1)] transition-colors duration-200 ease-out-power3 group"
				        style={{
					        outlineColor: "oklch(var(--muted-faded-fg)/.3)",
				        }}>
					<div className="flex items-center gap-2 py-1.5 px-1">
						{open ? 'Accounts ' : "Currently :"} <Avatar className="mr-2 h-6 w-6">
						<AvatarImage src={currentUser?.image || ""} alt={currentUser?.name ?? ""} />
						<AvatarFallback>{currentUser?.name?.charAt(0)}</AvatarFallback>
					</Avatar>
						<span className="truncate font-medium">{currentUser?.name}</span></div>
					<div
						className="group-data-[expanded=true]:rotate-180 transition-transform duration-200 ease-out-power3">
						<ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" /></div>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="text-foreground bg-[var(--button-background-inverted))] font-sans z-[150] backdrop-blur-[4px] border-border w-[250px] border p-0 shadow-md">
				<Command>
					<CommandList>
						<CommandGroup heading="Current Account"
						              className={" [&_[cmdk-group-heading]]:text-foreground!"}>
							<CommandItem onSelect={() => {
							}} className="hover:bg-accent/50 w-full justify-between"
							             key={`current-account-${currentUser?.id}`}>
								<div className="flex items-center">
									<Avatar className="mr-2 h-5 w-5">
										<AvatarImage src={currentUser?.image || ""}
										             alt={currentUser?.name ?? ""} />
										<AvatarFallback className="bg-foreground/10">
											{currentUser?.name?.charAt(0)}
										</AvatarFallback>
									</Avatar>
									<span className="text-foreground/80 font-medium">
                    {currentUser?.name}
                  </span>
								</div>
							</CommandItem>
						</CommandGroup>
						<CommandSeparator className={"bg-[oklch(var(--n-s-fg)/.3)]!"} />
						<CommandGroup className={" [&_[cmdk-group-heading]]:text-foreground!"}
						              heading="Switch Account">
							{deviceSessions &&
								deviceSessions.filter(
									(session) => session.userId !== currentUser?.id,
								).map((userSession, index) => (
									<CommandItem key={index} onSelect={async () => {
										await authClient.multiSession.setActive({
											sessionToken: userSession.token,
										})
										setOpen(false)
									}}
									             className="hover:bg-accent hover:text-rouge-400 transition-colors duration-200">
										<Avatar className="mr-2 h-5 w-5">
											<AvatarImage src={""} alt={userSession.userId} />
											<AvatarFallback className="bg-secondary/20">
												{userSession.userId.charAt(0)}
											</AvatarFallback>
										</Avatar>
										<div className="flex w-full flex-col">
											<span className="">{userSession.userId}</span>
											<span className="truncate">{userSession.userId}</span>
										</div>
									</CommandItem>
								))}
						</CommandGroup>
					</CommandList>
					<CommandSeparator className={"bg-[oklch(var(--n-s-fg)/.3)]!"} />
					<CommandList>
						<CommandGroup>
							<CommandItem onSelect={() => {
								router.push("/sign-in")
								setOpen(false)
							}}
							             className="hover:bg-rouge-400 hover:text-rouge-400 group transition-colors duration-200">
								<PlusCircle
									className="text-foreground group-hover:text-rouge-500/80 mr-2 h-5 w-5 transition-colors duration-200" />
								<span
									className="font-medium text-foreground group-hover:text-rouge-500/80 transition-colors duration-200">
                  Add Account
                </span>
							</CommandItem>
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
