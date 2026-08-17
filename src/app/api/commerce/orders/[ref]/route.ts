import config from "@payload-config";
import { headers as nextHeaders } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";

import { getCommerceOrder } from "@/lib/commerce/get-order";
import { createPayloadCommerceRepository } from "@/lib/commerce/payload-repository";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ ref: string }> }
): Promise<NextResponse> {
  const payload = await getPayload({ config });
  const auth = await payload.auth({ headers: await nextHeaders() });
  if (!auth.user) {
    return NextResponse.json(
      { success: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { ref } = await context.params;
    const order = await getCommerceOrder({
      repository: createPayloadCommerceRepository(payload),
      ref,
      userId: String(auth.user.id),
      isAdmin: auth.user.role === "admin"
    });
    return NextResponse.json({ success: true, data: { order } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "order-not-found" || code === "invalid-order-ref") {
      return NextResponse.json(
        { success: false, error: "order-not-found" },
        { status: 404 }
      );
    }
    payload.logger?.error?.("[commerce/orders/ref] order lookup failed");
    return NextResponse.json(
      { success: false, error: "order-lookup-failed" },
      { status: 500 }
    );
  }
}
