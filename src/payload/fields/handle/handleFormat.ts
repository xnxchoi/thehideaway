export function formatUserHandleLite(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._]/g, "") // 1. remove invalid chars (Instagram: letters, digits, periods, underscores only)
    .replace(/\.+/g, "."); // 2. collapse consecutive dots
}

export function formatUserHandleMinimal(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._]/g, "") // 1. remove invalid characters
    .replace(/\.+/g, ".") // 2. collapse consecutive dots
    .replace(/^([\.-]+)(?=[_a-z0-9])/, "")
    .replace(/(?<=[a-z0-9_])([\.-]+)$/, "");
}

export function formatUserHandle(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._]/g, "") // 1. remove invalid characters
    .replace(/\.+/g, ".") // 2. collapse consecutive dots

    .replace(/((?<![a-z0-9.])){1,2}(\.)+(?=[a-z0-9])/g, ".") // 3. remove dots not between alphanumerics
    .replace(/(?<=[a-z0-9])(\.)+(?![a-z0-9.]){1,2}/g, ".") // 4. Once more, remove dots not between alphanumerics
    .replace(/^\.*/g, "") // 5. remove leading dots
    .replace(/\.*$/g, "") // 6. remove trailing dots
    .slice(0, 30); // 7. max length
}

export const formatHandle = formatUserHandle;

export const HANDLE_TEST_REGEX =
  /^(?!.*\.\.)(?!.*[A-Z])(?!.*\.$)[^\W][\w.]{0,29}$/;
