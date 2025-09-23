import { currentUser } from "@/lib/auth/context/servers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const user = await currentUser();
  if (!user) return redirect("/auth/sign-in");
  if (!("slug" in user) || !user.slug) return redirect("/");
  return redirect("/@" + user.slug);
}
