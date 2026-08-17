import { generateLostLegalMetadata, LostLegalContent } from "../legal-page";

export const generateMetadata = () => generateLostLegalMetadata("terms");

export default function LostTermsPage() {
  return <LostLegalContent kind="terms" />;
}
