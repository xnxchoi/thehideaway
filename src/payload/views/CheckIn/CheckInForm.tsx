import {LoginForm} from '@/components/login-form'
import {GradientModule} from '@/components/UX/Gradient/Gradient'
import {Logo} from '@/graphics/Logo'
import {Link} from "@/payload/elements/Link";

const CheckInForm = () => {
	return (
		<div
			className="relative flex min-h-svh flex-col items-center justify-center gap-10 p-9 md:p-16">
			<div className={
				'absolute inset-[35px] z-[120] flex rounded-[35px] bg-[oklch(var(--opaque-bg)/.54)] backdrop-blur-[54px]'
			}></div>
			<div className="z-[120] flex w-full max-w-[384px] flex-col gap-9">
				<Link href="/" className="flex items-center gap-3.5 self-center font-medium">
					<div
						className="bg-transparent flex size-9 items-center justify-center rounded-lg">
						<Logo />
					</div>
					The Hideaway.
				</Link>
				<LoginForm />
			</div>
			<GradientModule />
		</div>
	)
}
export default CheckInForm
