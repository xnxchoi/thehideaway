'use client'
import {
	Environment,
	Lightformer,
	Loader,
	PerspectiveCamera,
	View,
} from "@react-three/drei";
import {Physics} from '@react-three/rapier'
import {RP_Plate} from '@/components/layouts/Registration/Plate'
import {Color} from 'three'
import {useDeviceInfo} from '@/providers/RP_Pro'
import {MembershipBadge} from '@/components/layouts/Registration/MembershipBadge'
import {useInView} from 'react-intersection-observer'
import {useFormContext} from 'react-hook-form'

export type MemberCardsType = 'BADGE' | 'PLATE'

export function Lanyard(props: { type: MemberCardsType | string }) {
	const {type} = props
	return (
		<>
			<Registerer type={type} />
			<Loader barStyles={{
				backgroundColor: 'oklch(54.74% 0.2224 29.01/.5)',
				borderRadius: '1px',
			}} containerStyles={{
				transition: 'all 0.5s ease',
				zIndex: 247,
				backgroundColor: 'rgba(0,0,0,.1)',
				backdropFilter: 'blur(4px)',
				borderRadius: '10px',
				padding: '10px',
				position: 'absolute',
			}} />
		</>
	)
}

function Registerer(props: {
	type: MemberCardsType | string
} = {type: 'BADGE' as MemberCardsType}) {
	const {type} = props
	const {device, isTouchDevice} = useDeviceInfo()
	const isMouse = device.type !== 'mobile' && !isTouchDevice
	const {watch} = useFormContext()
	const {inView, ref} = useInView()
	const [name1, name2] = watch(['firstName', 'lastName'])
	return (<div ref={ref} className="relative h-full w-full">
		<View style={{right: '0', top: '0', bottom: '0', position: 'absolute', left: '0'}}>
			<PerspectiveCamera position={[0, 0, 13]} fov={type === 'BADGE' ? 25 : 35}
			                   makeDefault={inView} />
			<ambientLight intensity={Math.PI} />
			{type === 'BADGE' && (
				<Physics debug={false} interpolate={true} gravity={[0, -40, 0]} timeStep={1 / 60}>
					<MembershipBadge name1={name1} name2={name2} />
				</Physics>) || (<RP_Plate name1={name1} name2={name2} />)}
			<Environment background blur={0.75}>
				<color attach="background" args={[new Color('rgb(1,1,1)')]} />
				<Lightformer intensity={16} color={'rgb(64, 64, 64)'}
					// position={[-2, -5, 1.1]} position={[0, -3.8, 2]} rotation={[2.14, 0.97, 2.16]} rotation={[3, 0.3, 6.3]}
					         scale={[16, 1, 1]} />
				<Lightformer intensity={2} color="white" position={[0, -1, 5]}
				             rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
				<Lightformer intensity={3} color="white" position={[-1, -1, 1]}
				             rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
				<Lightformer intensity={3} color="white" position={[1, 1, 1]}
				             rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
				<Lightformer intensity={10} color="white" position={[-10, 0, 14]}
				             rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
			</Environment>
		</View></div>)
}
