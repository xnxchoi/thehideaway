export const MotionHero = () => {
	return <section className="h-[100svh] relative">
		<div className="m-0 p-0 absolute inset-0 flex border-0 flex-col lg:flex-row">
			<div className="w-full h-full relative overflow-hidden lg:absolute lg:inset-0" style={{
				clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
				transition: 'clip-path .5s cubic-bezier(.76,0,.24,1)',
			}}>
				<video autoPlay loop muted playsInline
				       className="w-full h-full inset-0 object-cover z-[1]" src="/videos/hero.mp4"
				       style={{transition: 'transform .5s cubic-bezier(.76,0,.24,1)'}} />
			</div>
		</div>
		<div
			className="uppercase items-center flex-col flex w-full h-full relative z-[5] lg:flex-row">
			<div className="absolute top-[50%] left-[50%] transform-[translate(-50%,-50%)] w-full h-[35%] m-y-auto
      justify-between items-center pointer-events-none">
				<div
					className="w-full h-full flex flex-col justify-center items-center max-w-[28ch] m-auto"></div>
			</div>
		</div>
	</section>
}