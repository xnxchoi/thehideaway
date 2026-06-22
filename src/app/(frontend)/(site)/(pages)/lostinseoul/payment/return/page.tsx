import { redirect } from "next/navigation";
import { cancelReturnedProductOrder } from "@/lib/lost-commerce/paymentReturn";

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
  const { code, order, paymentId } = await searchParams;

  if (code) {
    await cancelReturnedProductOrder(order);
    redirect(paymentPath("failure", { order, paymentId }));
  }

  redirect(paymentPath("success", { order, paymentId }));
}
