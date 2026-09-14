import { RPage } from "@/components/UX/Transition";
import { PurchaseStatus } from "../purchase-status";

type Props = {
  searchParams: Promise<{
    code?: string;
    message?: string;
    order?: string;
    paymentId?: string;
  }>;
};
export default async function LostPaymentReturnPage({ searchParams }: Props) {
  const { order, paymentId } = await searchParams;
  return (
    <RPage slug={["lostinseoul", "payment", "return"]} type="pages">
      <PurchaseStatus
        orderRef={order}
        paymentId={paymentId}
        showOrderReference={false}
      />
    </RPage>
  );
}
