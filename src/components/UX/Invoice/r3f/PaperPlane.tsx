import { RenderTexture } from "@react-three/drei";
import { PaperContent3D } from "@/components/UX/Invoice/r3f/PaperContent3D";
import { InvoiceDisplay } from "@/components/UX/Invoice";

/**
 * Cream paper plane that receives shadows from the sleeve. The text content
 * lives outside the R3F scene as a CSS overlay positioned over the View — see
 * InvoiceCertificate. Keeping the text in the page DOM avoids stacking
 * conflicts with the shared fixed-position canvas and keeps text crisp /
 * accessible / printable.
 */
type PaperPlaneProps = {
  width: number;
  height: number;
  invoice: InvoiceDisplay;
};

export function PaperPlane({ width, height, invoice }: PaperPlaneProps) {
  return (
    <group>
      <mesh receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          color="#fbfaf6"
          roughness={0.95}
          metalness={0}
        ></meshStandardMaterial>
      </mesh>
      <PaperContent3D invoice={invoice} />
    </group>
  );
}
