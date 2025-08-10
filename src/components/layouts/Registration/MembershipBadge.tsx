'use client'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
	Color,
	Mesh,
	Vector2,
	Vector3,
	Box3,
	Euler,
	Quaternion,
	RepeatWrapping,
	MeshStandardMaterial,
	MathUtils,
	Group,
	PointLight,
	CatmullRomCurve3,
} from 'three'
import {Center, OnCenterCallbackProps, Text3D, useGLTF, useTexture} from '@react-three/drei'
import {extend, ThreeElements, ThreeEvent, useFrame, useThree} from '@react-three/fiber'
import {
	BallCollider,
	CuboidCollider,
	RapierRigidBody,
	RigidBody,
	RigidBodyTypeString,
	useRopeJoint,
	useSphericalJoint,
} from '@react-three/rapier'
import {MeshLineGeometry, MeshLineMaterial, raycast} from 'meshline'
import {ScreenSizerProps} from '@react-three/drei/core/ScreenSizer'
import {FONTFACES} from '@/constants/api'
import {easing} from 'maath'
import {useFormContext, useWatch} from 'react-hook-form'
import {upperCase} from 'lodash-es'
import {cubic} from 'maath/easing'
import {useCursorHandlers} from '@/components/core/cursorWrapper'

extend({MeshLineGeometry, MeshLineMaterial})

declare module '@react-three/fiber' {
	interface ThreeElements {
		meshLine: Mesh & MeshLineGeometry & MeshLineMaterial & {
			raycast: ReturnType<typeof raycast>
		}
		meshLineMaterial: Partial<MeshLineMaterial>
		meshLineGeometry: Partial<MeshLineGeometry>
		screenSizer: Partial<ScreenSizerProps> & Partial<ThreeElements['object3D']>
	}
}
useGLTF.preload('/assets/plate/apr25_textures/badge/BADGEd-transformed.glb')

const TEXTURE_BASE_PATH = '/assets/plate/apr25_textures/badge'

export function MembershipBadge({maxSpeed = 50, minSpeed = 10, name1, name2}: {
	maxSpeed?: number;
	minSpeed?: number,
	name1: string,
	name2: string
}) {
	const TIMEOUT_FIRE_DELAY = 200
	const TRANSITION_DURATION = 0.15 // 150ms
	const BATCH_DELAY = 50 // milliseconds
	const band = useRef<
			ThreeElements['mesh'] & { geometry: MeshLineGeometry; material: MeshLineMaterial }
		>(null!),
		fixed = useRef<RapierRigidBody & { lerped: Vector3 }>(null!),
		j1 = useRef<RapierRigidBody & { lerped: Vector3 }>(null!),
		j2 = useRef<RapierRigidBody & { lerped: Vector3 }>(null!),
		j3 = useRef<RapierRigidBody & { lerped: Vector3 }>(null!),
		card = useRef<RapierRigidBody & Mesh>(null!)
	const {width, height} = useThree((state) => state.size)
	const boxSizer = useRef(new Box3()),
		boxSizeGetter = useRef(new Vector3())
	const vec = useRef(new Vector3()),
		ang = useRef(new Vector3()),
		rot = useRef(new Vector3()),
		dir = useRef(new Vector3())
	const eulerV = useRef(new Euler())
	const segmentProps: {
		type: RigidBodyTypeString
		canSleep: boolean
		colliders?: any
		angularDamping: number
		linearDamping: number
	} = {
		type: 'dynamic',
		canSleep: true,
		colliders: false,
		angularDamping: 2,
		linearDamping: 2,
	}

	const model = useGLTF(`${TEXTURE_BASE_PATH}/BADGEd-transformed.glb`)
	const bandTexture = useTexture('/assets/model/ha.png')
	const [maxW, setMaxW] = useState(1)
	const [maxH, setMaxH] = useState(1)

	const [cardSize, setCardSize] = useState({width: 3.1, height: 2})

	const handler = useCursorHandlers('three')
	const {onPointerOver, onPointerOut} = handler

	const [curve] = useState(
		() => new CatmullRomCurve3([new Vector3(), new Vector3(), new Vector3(), new Vector3()]),
	)
	const [dragged, drag] = useState<false | Vector3>(false)
	const [hovered, hover] = useState(false)
	const light = useRef<PointLight>(null!)
	const textBottomMat = useRef<MeshStandardMaterial>(null!),
		textTopMat = useRef<MeshStandardMaterial>(null!)
	const centerRef = useRef<Group>(null!)
	const nameRef = useRef<Mesh>(null!)

	const [smoothText, setSmoothText] = useState(`${name1} ${name2}`)
	const to = useRef<ReturnType<typeof setTimeout>>(null!)

	useEffect(() => {
		if (model) {
			console.log(model)
			if (model.nodes['card']) {
				const size = boxSizer.current.setFromObject(model.nodes['card']).
					getSize(boxSizeGetter.current)
				setCardSize({
					width: size.x,
					height: size.y,
				})
				console.log('card', size.x, size.y)
			}
			if (model.nodes['name']) {
				const size = boxSizer.current.setFromObject(model.nodes['name']).
					getSize(boxSizeGetter.current)
				const currentW = size.x
				const currentH = size.y
				setMaxH(currentH)
				setMaxW(currentW)
			}
		}
	}, [model])

	const currentValue = useRef(0) // Opacity or normalized value
	const targetDirection = useRef(false) // true = toward 0, false = toward 1
	const transitioning = useRef(false)
	const queuedDirection = useRef<boolean | null>(null)
	const elapsedTransitionTime = useRef(0)
	const batchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
	const requestTransition = useCallback((direction: boolean) => {
		if (batchTimeout.current) clearTimeout(batchTimeout.current)

		batchTimeout.current = setTimeout(() => {
			if (transitioning.current) {
				if (targetDirection.current !== direction) {
					queuedDirection.current = direction
				}
			} else if (currentValue.current !== (direction ? 0 : 1)) {
				transitioning.current = true
				elapsedTransitionTime.current = 0
				targetDirection.current = direction
			}
		}, BATCH_DELAY)
	}, [])

	const secondTO = useRef<ReturnType<typeof setTimeout>>(null!)
	useEffect(() => {
		if (to.current) {
			clearTimeout(to.current)
		}
		to.current = setTimeout(() => {
			requestTransition(true) // 👈 Trigger fade-out here
			if (secondTO.current) {
				clearTimeout(secondTO.current)
			}
			secondTO.current = setTimeout(() => {
				setSmoothText(upperCase(name1 + ' ' + name2))
			}, 150)
		}, TIMEOUT_FIRE_DELAY)
	}, [name1, name2, requestTransition])

	const textPhysicalMeshProps = useMemo(
		() => ({
			transparent: true,
			anisotropy: 1,
			metalness: 1,
			opacity: 1,
			color: 'rgb(144,144,144)',
			sheen: 1,
			anisotropyRotation: 0.66,
			sheenRoughness: 1,
			roughness: 0.4,
		}),
		[],
	)

	const topLayerTextProps = useMemo(
		() => ({
			transparent: true,
			opacity: 1,
			sheenRoughness: 1,
			sheen: 1,
			color: 'rgb(11, 11, 11)',
			roughness: 0.3,
			metalness: 1,
		}),
		[],
	)
	const text3dProps = useMemo(
		() => ({
			bevelEnabled: true,
			bevelSegments: 15,
			depth: 26,
			bevelThickness: 0.1,
			bevelSize: 0.04,
			bevelOffset: 0.001,
			font: FONTFACES.COPPERPLATE.HEAVY,
			size: 0.8,
			height: 1,
			letterSpacing: 0.15,
		}),
		[],
	)

	useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]) // prettier-ignore
	useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]) // prettier-ignore
	useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]) // prettier-ignore
	useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.56, 0]]) // prettier-ignore
	const spun = useRef(true)
	useEffect(() => {
		setTimeout(() => spun.current = false, 5500)
	}, [])

	const timePast = useRef(0)
	useFrame((state, delta) => {
		easing.damp3(
			light.current.position,
			[state.pointer.x * 12, 0.1, 8 + state.pointer.y * 4],
			0.2,
			delta,
		)

		if (transitioning.current && textTopMat.current) {
			elapsedTransitionTime.current += delta
			const progress = Math.min(elapsedTransitionTime.current / TRANSITION_DURATION, 1)

			// CSS-like 'ease' interpolation
			const easedProgress = cubic.inOut(progress)

			const from = currentValue.current // 👈 Use current opacity as starting point
			const to = targetDirection.current ? 0 : 1

			textTopMat.current.opacity = from + (to - from) * easedProgress
			textBottomMat.current.opacity = from + (to - from) * easedProgress
			if (progress >= 1) {
				transitioning.current = false
				elapsedTransitionTime.current = 0
				currentValue.current = to // 👈 Update currentValue on completion

				if (
					queuedDirection.current !== null &&
					queuedDirection.current !== targetDirection.current
				) {
					targetDirection.current = queuedDirection.current
					queuedDirection.current = null
					transitioning.current = true
				}
			}
		}
		if (dragged) {
			timePast.current += delta * 100
			console.log(timePast.current)
			vec.current.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
			dir.current.copy(vec.current).sub(state.camera.position).normalize()
			vec.current.add(dir.current.multiplyScalar(state.camera.position.length()))
			;[card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp())
			card.current?.setNextKinematicTranslation({
				x: vec.current.x - dragged.x,
				y: vec.current.y - dragged.y,
				z: vec.current.z - dragged.z,
			})
		}
		if (fixed.current) {
			// Fix most of the jitter when over pulling the card
			;[j1, j2].forEach((ref) => {
				if (!ref.current.lerped) ref.current.lerped = new Vector3().copy(
					ref.current.translation())
				const clampedDistance = Math.max(
					0.1,
					Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())),
				)
				ref.current.lerped.lerp(
					ref.current.translation(),
					delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)),
				)
			})
			// Calculate catmul curve
			curve?.points?.[0]?.copy(j3.current.translation())
			curve?.points?.[1]?.copy(j2.current.lerped)
			curve?.points?.[2]?.copy(j1.current.lerped)
			curve?.points?.[3]?.copy(fixed.current.translation())
			if (band.current.geometry && 'setPoints' in band.current.geometry) {
				band.current.geometry.setPoints(curve.getPoints(33))
			}
			// Tilt it back towards the screen
			ang.current.copy(card.current.angvel())
			rot.current.copy(card.current.rotation())
			const rr = card.current.rotation()
			let currentYRotation = eulerV.current.setFromQuaternion(
				new Quaternion(rr.x, rr.y, rr.z, rr.w),
				'YXZ',
			).y

			// Wrap current rotation to be between -Math.PI and Math.PI
			currentYRotation =
				MathUtils.euclideanModulo(currentYRotation + Math.PI, Math.PI * 2) - Math.PI

			// Determine the target rotation based on the "spun" state
			const targetYRotation =
				(spun.current ? Math.PI : 0) + (dragged || !hovered ? 0 : -state.pointer.x * (Math.PI / 3)) // 0 deg if not spun, 180 deg (Math.PI) if spun

			// Calculate the difference to the target rotation
			let angleDifference = targetYRotation - currentYRotation

			// Wrap the angleDifference to be within -Math.PI to Math.PI for the shortest path
			angleDifference = MathUtils.euclideanModulo(angleDifference + Math.PI,
				Math.PI * 2) - Math.PI

			// Clamp angular velocity for stability
			const maxAngularVelocity = 2 // Adjust for the desired max speed
			const velocityY = Math.max(
				-maxAngularVelocity,
				Math.min(maxAngularVelocity, angleDifference * 5),
			) // "5" is the rotation speed factor

			card.current.setAngvel({x: ang.current.x, y: velocityY, z: ang.current.z}, true)
			// : card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, false)
		}
	})
	useEffect(() => {
		if (!dragged) {
			if (timePast.current > 20 && timePast.current < 100) {
				spun.current = !spun.current
			}
			timePast.current = 0
		}
	}, [dragged])

	curve.curveType = 'catmullrom'
	bandTexture.wrapS = bandTexture.wrapT = RepeatWrapping

	return (
		<>
			<group position={[0, 4, 0]} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
				<RigidBody ref={fixed} {...segmentProps} type="fixed" />
				<RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
					<BallCollider args={[0.1]} />
				</RigidBody>
				<RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
					<BallCollider args={[0.1]} />
				</RigidBody>
				<RigidBody position={[1.5, 0, 0.01]} ref={j3} {...segmentProps}>
					<BallCollider args={[0.1]} />
				</RigidBody>
				<RigidBody position={[2, 0, -0.01]} ref={card}
				           {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
					<CuboidCollider args={[0.8, 1.125, 0.01]} />
					<group scale={2.25} position={[0, -1.2, -0.01]}
					       onPointerOver={() => hover(true)} onPointerOut={() => hover(false)}
					       onPointerUp={(
						       e: Omit<ThreeEvent<PointerEvent>, 'target'> & {
							       target: Element
						       },
					       ) => (e.target.releasePointerCapture(e.pointerId), drag(false))}
					       onPointerDown={(
						       e: Omit<ThreeEvent<PointerEvent>, 'target'> & {
							       target: Element
						       },
					       ) => (
						       e.target?.setPointerCapture(e.pointerId),
							       drag(new Vector3().copy(e.point).
								       sub(vec.current.copy(card.current.translation())))
					       )}>
						<mesh geometry={(model.nodes.card as Mesh).geometry!}
						      material={(model.nodes.card as Mesh).material!} />
						<mesh geometry={(model.nodes['front_btm_engraving'] as Mesh).geometry!}
						      material={(model.nodes['front_btm_engraving'] as Mesh).material!} />
						<mesh geometry={(model.nodes.frame as Mesh).geometry!}>
							<meshPhysicalMaterial
								{...model.materials['frame_metal']} metalness={1.0}
								anisotropyRotation={0.8} sheen={1} anisotropy={14}
								normalScale={[0.01, -0.01]}
								color={new Color().setRGB(161 / 255, 161 / 255, 161 / 255)}
								normalMap={(model.materials['frame_metal'] as MeshStandardMaterial).normalMap} />
						</mesh>
						<mesh geometry={(model.nodes['logo'] as Mesh).geometry!}
						      material={(model.nodes['logo'] as Mesh).material!} />
						<mesh geometry={(model.nodes.clip as Mesh).geometry!}>
							<meshStandardMaterial metalness={1}
							                      color={new Color().setRGB(14 / 255, 14 / 255,
								                      14 / 255)} roughness={0.4} />
						</mesh>
						<mesh geometry={(model.nodes.clamp as Mesh).geometry!}>
							<meshStandardMaterial metalness={1}
							                      color={new Color().setRGB(14 / 255, 14 / 255,
								                      14 / 255)} roughness={0.4} />
						</mesh>
						<mesh geometry={(model.nodes['back_engraving'] as Mesh).geometry!}
						      material={(model.nodes['back_engraving'] as Mesh).material!} />
						<mesh geometry={(model.nodes['details'] as Mesh).geometry!}
						      material={(model.nodes['details'] as Mesh).material!} />
						<mesh geometry={(model.nodes['name'] as Mesh).geometry!}
						      material={(model.nodes['name'] as Mesh).material!} ref={nameRef}>
							<Center scale={[1, 1, 0.1]} position={[0, 0.2, 0.01]} ref={centerRef}
							        onCentered={(props: OnCenterCallbackProps) => {
								        const {width, height, container} = props
								        const scaleW = maxW / width,
									        scaleH = maxH / height
								        const scaleto = Math.min(scaleW, scaleH)
								        container.scale.setX(scaleto)
								        container.scale.setY(scaleto)
								        container.scale.setZ(0.01)
								        secondTO.current = setTimeout(() => {
									        requestTransition(false) // 👈 Trigger fade-in here
								        }, 150)
							        }}>
								<Text3D {...text3dProps}>
									<meshStandardMaterial
										{...textPhysicalMeshProps}
										color={new Color().setRGB(144 / 255, 144 / 255, 144 / 255)}
										ref={textTopMat} />
									{smoothText}
								</Text3D>
								<Text3D {...text3dProps} height={1.15} bevelEnabled={false}>
									<meshStandardMaterial {...topLayerTextProps}
									                      ref={textBottomMat} />
									{smoothText}
								</Text3D>
							</Center>
						</mesh>
						<mesh geometry={(model!.nodes!.pic! as Mesh).geometry!}
						      material={model!.materials!.base} />
					</group>
				</RigidBody>
			</group>
			<mesh ref={band}>
				<meshLineGeometry />
				<meshLineMaterial color={new Color().setRGB(144 / 255, 144 / 255, 144 / 255)}
				                  depthTest={false} useMap={1} map={bandTexture}
				                  repeat={new Vector2(-3, 1)}
				                  resolution={new Vector2(width, height)} lineWidth={1.1} />
			</mesh>
			<spotLight angle={0.5} penumbra={0.5} ref={light} castShadow={true} intensity={10}
			           shadow-mapSize={1024} shadow-bias={-0.001}>
				<orthographicCamera attach="shadow-camera" args={[-10, 10, -10, 10, 0.1, 50]} />
			</spotLight>
		</>
	)
}
