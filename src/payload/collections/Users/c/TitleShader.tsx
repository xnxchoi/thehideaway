// ShaderMaterial definition
import {shaderMaterial} from "@react-three/drei";
import {Color} from "three";

export const FVMaterial = shaderMaterial(
	{
		tNormal: null,
		tShadow: null,
		cBlack: new Color(0x000000),
		inkbleed: 1,
		opacity: 1,
		edgeSharp: 0.2,
	}, // Vertex shader
	`varying vec2 vUv;
void main(){
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}`, // Fragment shader
	`
    varying vec2 vUv;
uniform sampler2D tNormal;
uniform sampler2D tShadow;
uniform vec3 cBlack;
uniform float inkbleed;
uniform float opacity;
uniform float edgeSharp;
    void main() {
	    vec4 iNormal = texture( tNormal, vUv );
	    vec4 iShadow = texture( tShadow, vUv );

	
	    float rad = radians( vUv.y * 180.0 );
	    float delay = 1.0 - cos( rad );
	
    
	
	    float fadePower = clamp( inkbleed * 0.5 + sin( inkbleed * 0.5 * delay ), 0.0, 1.0 );
	    float alpha = pow( iShadow.r, 4.0 ) * fadePower + iShadow.r * iNormal.a * fadePower * 20.0;
	    alpha *= 0.5;
	    alpha = 1.0 - step( alpha, 0.5 );

	
	float edgeRatio = 0.8;
	float edgeSmooth = iNormal.a * ( max( inkbleed - edgeRatio, 0.0 ) * ( 1.0 / (1.0 - edgeRatio) ) );
	alpha += edgeSmooth;

	float f_alpha = alpha < edgeSharp ? 0.0 : alpha;
	gl_FragColor = vec4( cBlack, f_alpha * opacity );
	gl_FragColor = LinearTosRGB( gl_FragColor );
}
  `,
);
