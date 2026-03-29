import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Link } from "@/components/core/Link/Link";

export function InvitationError() {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <CardTitle className="text-xl text-destructive">
            Invitation Error
          </CardTitle>
        </div>
        <CardDescription>
          There was an issue with your invitation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          The invitation you&apos;re trying to access is either invalid or you
          don&apos;t have the correct permissions. Please check your email for a
          valid invitation or contact the person who sent it.{" "}
        </p>
      </CardContent>
      <CardFooter>
        <Link href="/" className="w-full">
          <Button variant="outline" className="w-full">
            Go back to home
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
