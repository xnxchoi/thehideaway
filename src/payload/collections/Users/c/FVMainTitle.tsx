// FVMainTitle.tsx
import {useEffect, useRef} from "react";
import {extend, useFrame, useThree} from "@react-three/fiber";
import {Color, Mesh, ShaderMaterial} from "three";
import {FVMaterial} from "../../../../components/layouts/Profile/FVTItle";

const FvMaterial = extend(FVMaterial);

export function FVMainTitle({width, height, top, left, tNormal, tShadow}) {
	const meshRef = useRef<
		Mesh & {
		material: ShaderMaterial & {
			tNormal: null;
			tShadow: null;
			cBlack: Color;
			inkbleed: number;
			opacity: number;
			edgeSharp: number;
		};
	}
	>(null!);
	const {size, viewport} = useThree();

	const getPxThree = (px) => (px / size.width) * viewport.width;

	const scaleRef = useRef({f1: 0, x: 1, y: 1});
	const translateRef = useRef({x: 0, y: 0});

	useEffect(() => {
		if (!meshRef.current) return;
		const mesh = meshRef.current;
		const mat = mesh.material;
		mat.tNormal = tNormal;
		mat.tShadow = tShadow;
	}, [tNormal, tShadow]);

	useFrame(() => {
		if (!meshRef.current) return;
		const mesh = meshRef.current;
		const scale = scaleRef.current;
		const translate = translateRef.current;

		scale.x = 1 - scale.f1 * 0.2;
		scale.y = 1 - scale.f1 * 0.2;

		mesh.scale.x = getPxThree(width) * scale.x;
		mesh.scale.y = getPxThree(height) * scale.y;

		mesh.position.x =
			-viewport.width / 2 +
			getPxThree(left) +
			getPxThree(width) / 2 +
			translate.x;
		mesh.position.y =
			viewport.height / 2 -
			getPxThree(top) -
			getPxThree(height) / 2 +
			translate.y;
		mesh.position.z = 3;
	});

	return (
		<mesh ref={meshRef}>
			<planeGeometry args={[1, 1]} />
			<FvMaterial />
		</mesh>
	);
}
