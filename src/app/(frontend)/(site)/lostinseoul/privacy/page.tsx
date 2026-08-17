import { generateLostLegalMetadata, LostLegalContent } from "../legal-page";

export const generateMetadata = () => generateLostLegalMetadata("privacy");

export default function LostPrivacyPage() {
  return <LostLegalContent kind="privacy" />;
}
