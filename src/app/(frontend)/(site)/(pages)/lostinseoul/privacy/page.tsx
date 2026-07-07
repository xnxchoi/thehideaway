import {
  generateLostLegalMetadata,
  LostLegalPage
} from "../legal-page";

export const generateMetadata = () => generateLostLegalMetadata("privacy");

export default function LostPrivacyPage() {
  return <LostLegalPage kind="privacy" />;
}
