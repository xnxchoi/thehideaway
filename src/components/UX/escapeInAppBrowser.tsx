"use client";
import { useDeviceInfo } from "@/providers/RP_Pro";
import { useEffect, useRef, useState } from "react";
import { Link } from "next-transition-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLenis } from "lenis/react";
import { toast } from "sonner";

import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { usePathname } from "next/navigation";
import { useShallow } from "zustand/shallow";

export const EscapeInAppBrowser = () => {
  const browser = useDeviceInfo((r) => r.browser);
  const pathname = usePathname();
  if (!browser.inApp) return <></>;
  return <InterNalEscape browserName={browser.name} pathname={pathname} />;
};
const InterNalEscape = ({
  browserName,
  pathname
}: {
  browserName: string;
  pathname: string;
}) => {
  const name = useRPSession(useShallow((l) => l.name));
  const [open, setOpen] = useState(false);
  const hrefString = useRef<string>(null!);
  const lenis = useLenis();
  const [targetURL, setTargetURL] = useState<string>(
    `${process.env.NEXT_PUBLIC_SERVER_URL}${pathname}`
  );
  useEffect(() => {
    setTargetURL(`${process.env.NEXT_PUBLIC_SERVER_URL}${pathname}`);
  }, [pathname]);

  useEffect(() => {
    lenis?.[open ? "stop" : "start"]();
  }, [open]);
  const os = useDeviceInfo((r) => r.os);
  const browser = useDeviceInfo((r) => r.browser);
  useEffect(() => {
    if (os.isAndroid) {
      try {
        hrefString.current = EscapeAndroidInApp(targetURL, browser.name);
      } catch (e) {}
    } else if (os.isIOS) {
      try {
        hrefString.current = EscapeIOSInApp(targetURL, browser?.name || "");
      } catch (e) {}
    }
    setOpen(true);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-10 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-left text-background">
            Excuse Us...
          </DialogTitle>
	        <DialogDescription
		        className="py-5 pr-3 text-left text-xl leading-[1.5] font-medium text-pretty text-background/80">
            Welcome to The Hideaway
            {(name && `, ${name}`) || " dear guest"}!
            <br />
            Unfortunately, The Hideaway does not work inside{" "}
            {browserName === "Unknown" ? "your browser" : `"${browserName}"`}.
            <br />
            {(hrefString.current && (
              <>Click the button below to open the site in your browser.</>
            )) || <></>}
          </DialogDescription>
        </DialogHeader>
        {hrefString.current && (
          <Link href={hrefString.current} target="_blank">
            Click To Open In Browser
          </Link>
        )}
        <div>
          Click the button below to copy the address to paste in your browser -
          See you soon!
        </div>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <input
              id="link"
              defaultValue={targetURL}
              readOnly
              style={{
	              color: "oklch(from var(--bg) l c h/.8)",
	              border: "1px solid var(--border-subtle)",
                borderRadius: " 4px",
	              backgroundColor: "oklch(from var(--off-white) l c h/.3)"
              }}
            />
          </div>
          <Button
            type="button"
            onClick={() => {
              try {
                navigator.clipboard.writeText(targetURL).then(() => {
                  toast("Great", { description: "Copied to clipboard!" });
                });
              } catch (e) {}
            }}
            size="sm"
            className="flex h-[24px] w-[24px] rounded-[6px] border-[1px] border-b-border-subtle bg-background/50 p-[4px] text-foreground/50"
          >
            <span className="sr-only">Copy</span>
            <Copy />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
const EscapeIOSInApp = (turl: string, browserName: string) => {
  if (turl.startsWith("http://"))
    throw new Error(
      "IOS Safari scheme does not support http:// protocol. Please use https:// instead."
    );
  const targetURL = turl.startsWith("https://") ? turl : `https://${turl}`;
  switch (browserName) {
    case "Threads":
    case "Twitter":
    case "Telegram":
    case "Facebook":
    case "Instagram":
    case "LinkedIn":
    case "TikTok":
    case "Facebook Messenger":
    case "Google Search App":
      return "x-safari-" + targetURL;
    case "KakaoTalk":
      return (
        "kakaotalk://web/openExternal?url=" + encodeURIComponent(targetURL)
      );
    case "Line":
      return (
        targetURL +
        (targetURL.indexOf("?") !== -1 ? "&" : "?") +
        "openExternalBrowser=1"
      );
    default:
      throw new Error("Unsupported app", { cause: { app: browserName } });
  }
};
const EscapeAndroidInApp = (targetURL: string, browserName: string) => {
  switch (browserName) {
    case "Threads":
    case "Twitter":
    case "Telegram":
    case "Facebook":
    case "Instagram":
    case "Facebook Messenger":
      return `intent://${targetURL.replace(/https?:\/\//i, "")}#Intent;scheme=https;end`;
    case "KakaoTalk":
      return (
        "kakaotalk://web/openExternal?url=" + encodeURIComponent(targetURL)
      );
    case "Line":
      return (
        targetURL +
        (targetURL.indexOf("?") !== -1 ? "&" : "?") +
        "openExternalBrowser=1"
      );
    default:
      throw new Error("Unsupported app", { cause: { app: browserName } });
  }
};
