import {
  generateLostLegalMetadata,
  LostLegalPage
} from "../legal-page";

export const generateMetadata = () => generateLostLegalMetadata("terms");

export default function LostTermsPage() {
  return <LostLegalPage kind="terms" />;
}
