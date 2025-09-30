"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { AlertCircle, CheckCircle2, RefreshCw, WifiOff } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as motion from "motion/react-m";
import { useEffect, useState } from "react";

type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed";

interface ConnectionStatusProps {
  className?: string;
  showLabel?: boolean;
}

export const ConnectionStatus = ({
  className,
  showLabel = false
}: ConnectionStatusProps) => {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [lastConnected, setLastConnected] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Mock SSE connection status - replace with actual SSE hook when available
  useEffect(() => {
    // Simulate connection states for demo
    const simulateConnection = () => {
      setStatus("connecting");

      setTimeout(() => {
        if (Math.random() > 0.1) {
          // 90% success rate
          setStatus("connected");
          setLastConnected(new Date());
          setRetryCount(0);
        } else {
          setStatus("failed");
          setRetryCount((prev) => prev + 1);

          // Auto-retry after failure
          setTimeout(() => {
            setStatus("reconnecting");
            setTimeout(simulateConnection, 2000);
          }, 3000);
        }
      }, 1500);
    };

    simulateConnection();

    // Simulate occasional disconnections
    const interval = setInterval(() => {
      if (status === "connected" && Math.random() > 0.95) {
        // 5% chance of disconnect
        setStatus("reconnecting");
        setTimeout(simulateConnection, 1000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = (status: ConnectionStatus) => {
    switch (status) {
      case "connected":
        return {
          icon: CheckCircle2,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/20",
          label: "Connected",
          description: "Real-time notifications active"
        };
      case "connecting":
        return {
          icon: RefreshCw,
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/20",
          label: "Connecting",
          description: "Establishing connection..."
        };
      case "reconnecting":
        return {
          icon: RefreshCw,
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/20",
          label: "Reconnecting",
          description: "Attempting to reconnect..."
        };
      case "failed":
        return {
          icon: AlertCircle,
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/20",
          label: "Failed",
          description: `Connection failed${retryCount > 0 ? ` (${retryCount} attempts)` : ""}`
        };
      default:
        return {
          icon: WifiOff,
          color: "text-muted-foreground",
          bgColor: "bg-muted/10",
          borderColor: "border-muted/20",
          label: "Disconnected",
          description: "No real-time connection"
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const handleRetry = () => {
    setStatus("connecting");
    // Trigger reconnection logic here
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={`flex items-center gap-2 ${className}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={`relative rounded-full border p-1.5 ${config.bgColor} ${config.borderColor}`}
            >
              <Icon
                className={`h-3 w-3 ${config.color} ${
                  status === "connecting" || status === "reconnecting"
                    ? "animate-spin"
                    : ""
                }`}
              />

              {/* Pulse animation for connected state */}
              {status === "connected" && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-green-500/20"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </div>

            {showLabel && (
              <AnimatePresence mode="wait">
                <motion.span
                  key={status}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`text-xs font-medium ${config.color}`}
                >
                  {config.label}
                </motion.span>
              </AnimatePresence>
            )}
          </motion.div>
        </TooltipTrigger>

        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{config.description}</p>
            {lastConnected && status === "connected" && (
              <p className="text-xs text-muted-foreground">
                Connected at {lastConnected.toLocaleTimeString()}
              </p>
            )}
            {status === "failed" && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                className="mt-2 h-6 text-xs"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Retry
              </Button>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Compact version for use in headers/toolbars
export const CompactConnectionStatus = ({
  className
}: {
  className?: string;
}) => {
  return <ConnectionStatus className={className} showLabel={false} />;
};

// Full version with label for use in status bars
export const FullConnectionStatus = ({ className }: { className?: string }) => {
  return <ConnectionStatus className={className} showLabel={true} />;
};
