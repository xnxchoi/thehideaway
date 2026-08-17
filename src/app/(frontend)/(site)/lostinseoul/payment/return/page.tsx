import { redirect } from "next/navigation";
import { verifyReturnedProductPayment } from "@/lib/lost-commerce/paymentReturn";

type Props = {
  searchParams: Promise<{
    code?: string;
    message?: string;
    order?: string;
    paymentId?: string;
  }>;
};

function paymentPath(
  kind: "failure" | "success",
  input: {
    order?: string;
    paymentId?: string;
  }
): string {
  const params = new URLSearchParams();
  if (input.order) params.set("order", input.order);
  if (input.paymentId) params.set("paymentId", input.paymentId);

  const suffix = params.toString();
  return `/lostinseoul/payment/${kind}${suffix ? `?${suffix}` : ""}`;
}

export default async function LostPaymentReturnPage({ searchParams }: Props) {
  const { order, paymentId } = await searchParams;

  const result = await verifyReturnedProductPayment({ orderRef: order, paymentId });
  if (!result.ok && result.reason !== "payment-failed") {
    redirect("/lostinseoul/checkout");
  }
  const verifiedOrder = result.ok ? result.orderRef : order;
  redirect(
    paymentPath(result.ok ? "success" : "failure", {
      order: verifiedOrder,
      paymentId: result.ok ? paymentId : undefined
    })
  );
}
