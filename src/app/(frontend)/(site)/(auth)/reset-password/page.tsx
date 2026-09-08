import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth";

export default function Page() {
  return (
    <AuthShell slug={["reset-password"]}>
      <AuthCard view="RESET_PASSWORD" redirectTo="/sign-in" />
    </AuthShell>
  );
}
