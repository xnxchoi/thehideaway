import { generateLostLegalMetadata, LostLegalContent } from "../legal-page";

export const generateMetadata = () => generateLostLegalMetadata("refund");

export default function LostRefundPage() {
  return <LostLegalContent kind="refund" />;
}
