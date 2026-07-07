import {
  generateLostLegalMetadata,
  LostLegalPage
} from "../legal-page";

export const generateMetadata = () => generateLostLegalMetadata("refund");

export default function LostRefundPage() {
  return <LostLegalPage kind="refund" />;
}
