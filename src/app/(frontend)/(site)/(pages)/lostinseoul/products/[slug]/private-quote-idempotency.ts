const STORAGE_KEY = "lostinseoul.private-quote.command";
const KEY_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const memoryCommands = new Map<string, string>();
const degradedStorages = new WeakSet<object>();

type PrivateQuoteCommandStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

function commandStorage(): PrivateQuoteCommandStorage | undefined {
  try {
    return globalThis.sessionStorage;
  } catch {
    return undefined;
  }
}

function memorySnapshot(): Record<string, string> {
  return Object.fromEntries(memoryCommands);
}

function readCommands(
  storage: PrivateQuoteCommandStorage | undefined
): Record<string, string> {
  if (!storage || degradedStorages.has(storage)) return memorySnapshot();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return memorySnapshot();
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return memorySnapshot();
    }
    const entries = Object.entries(parsed).filter(
      (entry): entry is [string, string] =>
        HASH_PATTERN.test(entry[0]) &&
        typeof entry[1] === "string" &&
        KEY_PATTERN.test(entry[1])
    );
    for (const [inputHash, key] of entries) {
      memoryCommands.set(inputHash, key);
    }
    return memorySnapshot();
  } catch {
    degradedStorages.add(storage);
    return memorySnapshot();
  }
}

function writeCommands(
  storage: PrivateQuoteCommandStorage | undefined,
  commands: Record<string, string>
): void {
  if (!storage || degradedStorages.has(storage)) return;
  try {
    if (Object.keys(commands).length === 0) storage.removeItem(STORAGE_KEY);
    else storage.setItem(STORAGE_KEY, JSON.stringify(commands));
  } catch {
    degradedStorages.add(storage);
  }
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function privateQuoteIdempotencyKey(
  serializedCommand: string,
  storage: PrivateQuoteCommandStorage | undefined = commandStorage()
): Promise<string> {
  const inputHash = await sha256(serializedCommand);
  const commands = readCommands(storage);
  const storedKey = commands[inputHash];
  if (storedKey) return storedKey;

  const key = globalThis.crypto.randomUUID();
  memoryCommands.set(inputHash, key);
  writeCommands(storage, { ...commands, [inputHash]: key });
  return key;
}

export async function clearPrivateQuoteIdempotencyKey(
  serializedCommand: string,
  commandKey: string,
  storage: PrivateQuoteCommandStorage | undefined = commandStorage()
): Promise<void> {
  const inputHash = await sha256(serializedCommand);
  const commands = readCommands(storage);
  if (commands[inputHash] !== commandKey) return;
  memoryCommands.delete(inputHash);
  const { [inputHash]: _cleared, ...remaining } = commands;
  writeCommands(storage, remaining);
}

export function isPrivateQuoteSuccessBody(body: unknown): boolean {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  const value = body as Record<string, unknown>;
  if (
    value.ok !== true ||
    !value.order ||
    typeof value.order !== "object" ||
    Array.isArray(value.order)
  ) {
    return false;
  }
  const order = value.order as Record<string, unknown>;
  return (
    typeof order.id === "string" &&
    order.id.length > 0 &&
    typeof order.order_ref === "string" &&
    order.order_ref.length > 0
  );
}
