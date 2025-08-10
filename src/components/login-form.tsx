import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {authProviderIcons} from "@/components/icons/authProviders";
import {Link} from "@/components/UX/Link";
import type {ComponentProps} from "react";
import {authClient} from "@/lib/auth/client";

export function LoginForm({className, ...props}: ComponentProps<"div">) {
	return (
		<div className={cn("flex flex-col gap-9", className)} {...props}>
			<Card className="bg-[oklch(var(--faded-bg)/.5)]">
				<CardHeader className="text-center">
					<CardTitle className="text-3xl">Welcome back.</CardTitle>
					<CardDescription>Check in with your social account</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-9">
						<div className="flex flex-col gap-7">
							<form className="col" action={async () => {
								"use server";
								await authClient.signIn.social({
									provider: "google",
								});
							}}>
								<Button variant="outline"
								        className="focus-visible:ring-ring text-foreground hover:bg-[oklch(var(--off-bg)/.5)]  hover:*:text-rouge-500 *:transition-colors *:duration-300 *:ease inline-flex h-14 min-h-[35px] w-full items-center justify-center gap-[8px] rounded-md border border-[oklch(var(--faded-fg)/.65)] bg-[oklch(var(--off-bg)/.3)] px-4 py-3 text-lg font-medium whitespace-nowrap shadow-sm transition-colors duration-300 ease focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-6 [&_svg]:shrink-0">
									{authProviderIcons["Google"] || null}
									<span>
                    <span className="text-foreground">
                      Check in with Google
                    </span>
                  </span>
								</Button>
							</form>
						</div>
						<div className={
							"relative flex h-[3px] w-full items-center justify-center gap-[1px] bg-transparent"
						}>
							<div className={
								"relative -left-1 h-[1px] flex-[1_1_35%] bg-linear-to-r from-transparent to-[oklch(var(--fg)/.7)]"
							}></div>
							<div className={"px-[1px] text-center text-[12px]"}> Or</div>
							<div className={
								"relative -right-1 h-[1px] flex-[1_1_35%] bg-linear-to-r from-[oklch(var(--fg)/.7)] to-transparent"
							}></div>
						</div>
						<div className="grid gap-9">
							{/*  <div className="grid gap-5">*/}
							{/*    <Label htmlFor="email">Email</Label>*/}
							{/*    <Input id="email" type="email" placeholder="" required />*/}
							{/*  </div>*/}
							{/*  <div className="grid gap-5">*/}
							{/*    <div className="flex items-center">*/}
							{/*      <Label htmlFor="password">Password</Label>*/}
							{/*      <Link href="#" className="ml-auto text-lg underline-offset-4 hover:underline">*/}
							{/*        Forgot your password?*/}
							{/*      </Link>*/}
							{/*    </div>*/}
							{/*    <Input id="password" type="password" required />*/}
							{/*  </div>*/}
							{/*  <Button type="submit" className="w-full">*/}
							{/*    Login*/}
							{/*  </Button>*/}
						</div>
						<div className="text-center text-lg">
							Problems with your account?
							<span
								className="relative mx-1 p-0 inline-flex items-center justify-center group">
                <Link href="#"
                      className="decoration-0 no-underline hover:text-rouge-500 transition-colors duration-200 ease">
                  Contact us
                </Link>
                <span
	                className="absolute bottom-[1px] left-0 h-[1px] w-full scale-x-0 origin-left bg-rouge-500/80 transition-transform duration-300 ease group-hover:scale-x-100 z-0"></span>
                <span
	                className="absolute bottom-[1px] left-0 h-[1px] w-full scale-x-100 origin-right bg-foreground/80 transition-transform duration-300 ease group-hover:scale-x-0 z-0"></span>
              </span>
						</div>
					</div>
				</CardContent>
			</Card>
			<div
				className="text-muted-foreground *:[a]:hover:text-primary text-center text-lg text-balance *:[a]:underline *:[a]:underline-offset-4">
				By clicking continue, you agree to our
				<span className="relative mx-1 p-0 inline-flex items-center justify-center group">
          <Link href="/terms-of-service"
                className="decoration-0 no-underline hover:text-foreground transition-colors duration-200 ease">
            Terms of Service
          </Link>
          <span
	          className="absolute bottom-[1px] left-0 h-[1px] w-full scale-x-0 origin-left bg-foreground/80 transition-transform duration-300 ease group-hover:scale-x-100 z-0"></span>
          <span
	          className="absolute bottom-[1px] left-0 h-[1px] w-full scale-x-100 origin-right bg-muted-foreground/80 transition-transform duration-300 ease group-hover:scale-x-0 z-0"></span>
        </span>
				and{" "}
				<span className="relative mx-1 p-0 inline-flex items-center justify-center group">
          <Link href="/policy"
                className="decoration-0 no-underline hover:text-foreground transition-colors duration-200 ease">
            Privacy Policy
          </Link>
          <span
	          className="absolute bottom-[1px] left-0 h-[1px] w-full scale-x-0 origin-left bg-foreground/80 transition-transform duration-300 ease group-hover:scale-x-100 z-0"></span>
          <span
	          className="absolute bottom-[1px] left-0 h-[1px] w-full scale-x-100 origin-right bg-muted-foreground/80 transition-transform duration-300 ease group-hover:scale-x-0 z-0"></span>
        </span>
				.
			</div>
		</div>
	);
}
