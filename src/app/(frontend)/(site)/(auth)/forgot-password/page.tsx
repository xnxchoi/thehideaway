import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth";

export default function Page() {
  return (
    <AuthShell slug={["forgot-password"]}>
      <AuthCard view="FORGOT_PASSWORD" />
    </AuthShell>
  );
}
