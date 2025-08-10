import React from 'react'

// Define each SVG component as a property of `g`
const g = {
	ArrowNorthEast: ({className}) => (
		<svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
		     className={className}>
			<path d="M1.4 14.65L0.35 13.6L12.2 1.75H5.25V0.249999H14.75V9.75H13.25V2.8L1.4 14.65Z"
			      fill="currentColor" />
		</svg>),
	BorderRadiusCornerBottomLeft: ({className}) => (
		<svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg"
		     className={className}>
			<path fillRule="evenodd" clipRule="evenodd"
			      d="M-2.18557e-05 0L0 500L500 500C223.858 500 -9.78513e-06 276.142 -2.18557e-05 0Z"
			      fill="currentColor" data-themed="fill,color" />
		</svg>),
	BorderRadiusCornerBottomRight: ({className}) => (
		<svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg"
		     className={className}>
			<path fillRule="evenodd" clipRule="evenodd"
			      d="M0 500L500 500L500 0C500 276.142 276.142 500 0 500Z" fill="currentColor"
			      data-themed="fill,color" />
		</svg>),
	BorderRadiusCornerTopLeft: ({className}) => (
		<svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg"
		     className={className}>
			<path fillRule="evenodd" clipRule="evenodd" d="M500 0H0V500C0 223.858 223.858 0 500 0Z"
			      fill="currentColor" data-themed="fill,color" />
		</svg>),
	BorderRadiusCornerTopRight: ({className}) => (
		<svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg"
		     className={className}>
			<path fillRule="evenodd" clipRule="evenodd"
			      d="M500 500L500 4.19617e-05L1.90735e-05 -2.18557e-05C276.142 0.000249614 500 223.858 500 500Z"
			      fill="currentColor" data-themed="fill,color" />
		</svg>),
	CaretDown: ({className}) => (
		<svg viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"
		     className={className}>
			<path d="M1 1L5 5L9 1" stroke="currentColor" />
		</svg>),
	Checkmark: ({className}) => (
		<svg viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg"
		     className={className}>
			<path fillRule="evenodd" clipRule="evenodd"
			      d="M9.5 19.5C14.7467 19.5 19 15.2467 19 10C19 4.7533 14.7467 0.5 9.5 0.5C4.2533 0.5 0 4.7533 0 10C0 15.2467 4.2533 19.5 9.5 19.5ZM13.6116 5.6875L7.96053 12.7513L4.35554 9.1463L3.64844 9.8534L8.04345 14.2484L14.3924 6.3122L13.6116 5.6875Z"
			      fill="currentColor" />
		</svg>),
	Close: ({className}) => (
		<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"
		     className={className}>
			<path data-themed="stroke" d="M2.625 2.625L9.375 9.375" stroke="currentColor" />
			<path data-themed="stroke" d="M2.625 9.375L9.375 2.625" stroke="currentColor" />
		</svg>),
	FooterSymbols: ({className}) => (
		<svg viewBox="0 0 24 64" fill="none" xmlns="http://www.w3.org/2000/svg"
		     className={className}>
			<path
				d="M0 9.19463L6.92202 6.91811L9.19726 0H14.8114L17.0866 6.91811L24 9.1918V11.999L14.9742 9.03055L12.0043 0.00039457L9.03446 9.03055L0.00430082 12.0004L9.03446 14.9703L12.0042 24H9.197L6.92202 17.0827L0 14.8062V9.19463Z"
				fill="currentColor" />
		</svg>),
	LoadingSwirl: ({className}) => (
		<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"
		     className={className}>
			<path
				d="M16 8C16 6.41775 15.5308 4.87103 14.6518 3.55544C13.7727 2.23985 12.5233 1.21447 11.0615 0.608967C9.59966 0.00346625 7.99113 -0.15496 6.43928 0.153721C4.88743 0.462403 3.46197 1.22433 2.34315 2.34315C1.22433 3.46197 0.462403 4.88743 0.153721 6.43928C-0.15496 7.99113 0.00346631 9.59966 0.608967 11.0615C1.21447 12.5233 2.23985 13.7727 3.55544 14.6518C4.87103 15.5308 6.41775 16 8 16V15.2C6.57598 15.2 5.18393 14.7777 3.9999 13.9866C2.81586 13.1954 1.89302 12.0709 1.34807 10.7553C0.80312 9.43969 0.660536 7.99201 0.93835 6.59535C1.21616 5.19869 1.9019 3.91577 2.90883 2.90883C3.91577 1.9019 5.19869 1.21616 6.59535 0.93835C7.99201 0.660536 9.43969 0.80312 10.7553 1.34807C12.0709 1.89302 13.1954 2.81586 13.9866 3.9999C14.7777 5.18393 15.2 6.57598 15.2 8H16Z"
				fill="url(#paint0_angular_264_14509)" />
			<defs>
				<radialGradient id="paint0_angular_264_14509" cx="0" cy="0" r="1"
				                gradientUnits="userSpaceOnUse"
				                gradientTransform="translate(8 8) rotate(90) scale(8)">
					<stop stopColor="currentColor" />
					<stop
						{...{
							offset: '1', stopColor: 'currentColor', stopOpacity: '0',
						}} />
				</radialGradient>
			</defs>
		</svg>),
	Mail: ({className}) => (
		<svg className={className} viewBox="0 0 10 8" fill="none"
		     xmlns="http://www.w3.org/2000/svg">
			<rect x="0.5" y="1" width="9" height="6" rx="0.5" stroke="currentColor"
			      data-themed="stroke" />
			<path d="M0.5 1.5L4.4453 4.1302C4.7812 4.35413 5.2188 4.35413 5.5547 4.1302L9.5 1.5"
			      stroke="currentColor" data-themed="stroke" />
		</svg>),
	Moon: ({className}) => (
		<svg viewBox="0 0 7 10" fill="none" xmlns="http://www.w3.org/2000/svg"
		     className={className}>
			<path fillRule="evenodd" clipRule="evenodd"
			      d="M0.333986 9.71549C2.27597 9.0291 3.66732 7.17703 3.66732 5C3.66732 2.82297 2.27597 0.970903 0.333984 0.284509C0.855283 0.100257 1.41626 0 2.00065 0C4.76207 0 7.00065 2.23858 7.00065 5C7.00065 7.76142 4.76207 10 2.00065 10C1.41626 10 0.855285 9.89974 0.333986 9.71549Z"
			      fill="currentColor" />
		</svg>),
	Sun: ({className}) => (
		<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"
		     className={className}>
			<path
				d="M1.39091 9.86727L2.16 10.6364L3.14182 9.66L2.36727 8.88546M6 2.72727C4.19455 2.72727 2.72727 4.19455 2.72727 6C2.72727 7.80545 4.19455 9.27273 6 9.27273C7.80545 9.27273 9.27273 7.80545 9.27273 6C9.27273 4.18909 7.80545 2.72727 6 2.72727ZM10.3636 6.54545H12V5.45455H10.3636M8.85818 9.66L9.84 10.6364L10.6091 9.86727L9.63273 8.88546M10.6091 2.18182L9.84 1.41818L8.85818 2.39455L9.63273 3.16909M6.54545 0H5.45455V1.63636H6.54545M3.14182 2.39455L2.16 1.41818L1.39091 2.18182L2.36727 3.16909L3.14182 2.39455ZM0 6.54545H1.63636V5.45455H0M6.54545 10.3636H5.45455V12H6.54545"
				fill="currentColor" />
		</svg>),
	Mute: ({className}) => (
		<svg className={className} viewBox="0 0 32 32" fill="none"
		     xmlns="http://www.w3.org/2000/svg">
			<path
				d="M10 21H4C3.73478 21 3.48043 20.8946 3.29289 20.7071C3.10536 20.5196 3 20.2652 3 20V12C3 11.7348 3.10536 11.4804 3.29289 11.2929C3.48043 11.1054 3.73478 11 4 11H10L19 4V28L10 21Z"
				stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M30 13L24 19" stroke="currentColor" strokeLinecap="round"
			      strokeLinejoin="round" />
			<path d="M30 19L24 13" stroke="currentColor" strokeLinecap="round"
			      strokeLinejoin="round" />
		</svg>),
	Unmute: ({className}) => (
		<svg className={className} viewBox="0 0 32 32" fill="none"
		     xmlns="http://www.w3.org/2000/svg">
			<path
				d="M27.3633 9.63745C28.2001 10.4723 28.8639 11.464 29.3169 12.5558C29.7699 13.6475 30.003 14.8179 30.003 16C30.003 17.182 29.7699 18.3524 29.3169 19.4441C28.8639 20.5359 28.2001 21.5276 27.3633 22.3625"
				stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
			<path
				d="M10 21H4C3.73478 21 3.48043 20.8946 3.29289 20.7071C3.10536 20.5196 3 20.2652 3 20V12C3 11.7348 3.10536 11.4804 3.29289 11.2929C3.48043 11.1054 3.73478 11 4 11H10L19 4V28L10 21Z"
				stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M10 11V21" stroke="currentColor" strokeLinecap="round"
			      strokeLinejoin="round" />
			<path
				d="M23.8242 13.175C24.1961 13.5455 24.4912 13.9858 24.6926 14.4706C24.8939 14.9553 24.9976 15.4751 24.9976 16C24.9976 16.525 24.8939 17.0448 24.6926 17.5295C24.4912 18.0143 24.1961 18.4546 23.8242 18.825"
				stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
		</svg>),
}

// Centralized Icon component
export const Icon = ({name, className}) => {
	const Component = g[name]
	return Component ? <Component className={className} /> : null
}

