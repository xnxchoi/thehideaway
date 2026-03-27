import {currentUser} from "@/lib/auth/context/get-context-props";
import { redirect } from "next/navigation";


export default async function MePage() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");
  if (!("slug" in user) || !user.slug) return redirect("/");
  return redirect("/@" + user.slug);
}
