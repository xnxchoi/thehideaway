import React from "react";
import { useNotifications } from "@/providers/Notifications";

interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
  showReconnectButton?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  className = "",
  showText = true,
  showReconnectButton = false
}) => {
  const { isSSEConnected } = useNotifications();

  const statusColor = isSSEConnected ? "text-green-500" : "text-red-500";
  const statusBg = isSSEConnected ? "bg-green-500" : "bg-red-500";
  const statusText = isSSEConnected ? "Connected" : "Disconnected";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Status indicator dot */}
      <div className="relative">
        <div className={`h-2 w-2 rounded-full ${statusBg}`} />
        {isSSEConnected && (
          <div
            className={`absolute inset-0 h-2 w-2 rounded-full ${statusBg} animate-ping opacity-75`}
          />
        )}
      </div>

      {/* Status text */}
      {showText && (
        <span className={`text-sm font-medium ${statusColor}`}>
          {statusText}
        </span>
      )}

      {/* Reconnect button */}
      {showReconnectButton && !isSSEConnected && (
        <button
          onClick={() => {
            // This would need to be implemented in the provider
            console.log("Reconnect requested");
          }}
          className="rounded bg-blue-500 px-2 py-1 text-xs text-white transition-colors hover:bg-blue-600"
        >
          Reconnect
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;
