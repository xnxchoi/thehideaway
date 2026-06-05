import { RPage } from "@/components/UX/Transition";
import { AuthCard } from "@/lib/external/betterauth-ui/src/components/auth/auth-card";

export default function Page() {
  return (
    <RPage type="account" slug={["forgot-password"]}>
      <div className="my-8 flex w-full grow flex-col place-content-center px-4 md:px-8">
        <div className="mx-auto h-full w-full max-w-md self-center px-4 sm:px-0">
          <AuthCard view="FORGOT_PASSWORD" />
        </div>
      </div>
    </RPage>
  );
}
