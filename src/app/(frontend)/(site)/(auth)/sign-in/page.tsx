import { AuthShell } from "@/components/auth/AuthShell";
import { AuthView as AuthCard } from "@/components/auth";
import { VGradientModule } from "@/components/UX/Gradient/Gradient_M";
import { Suspense } from "react";
import { signInRedirectTarget } from "@/lib/routes/auth";

type SearchParams = Promise<{
  redirectTo?: string | string[];
  redirect?: string | string[];
}>;

export default function Page(props: { searchParams?: SearchParams }) {
  return (
    <AuthShell
      slug={["sign-in"]}
      backdrop={
        <Suspense>
          <VGradientModule />
        </Suspense>
      }
    >
      <Suspense>
        <SignInCard searchParams={props.searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function SignInCard({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {};
  const redirectTo = signInRedirectTarget(params);
  return <AuthCard view="SIGN_IN" redirectTo={redirectTo} />;
}
