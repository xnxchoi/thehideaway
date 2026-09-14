export const CART_STORAGE_KEY = "lostinseoul.plugin-cart";
export const GUEST_RECOVERY_KEY = `${CART_STORAGE_KEY}:guest-recovery`;

function readGuestProof(): { id: string; secret: string } | undefined {
  const id = localStorage.getItem(CART_STORAGE_KEY);
  const secret = localStorage.getItem(`${CART_STORAGE_KEY}_secret`);
  if (id && secret) return { id, secret };
  const recovery = localStorage.getItem(GUEST_RECOVERY_KEY);
  if (!recovery) return;
  try {
    const value: unknown = JSON.parse(recovery);
    if (
      value &&
      typeof value === "object" &&
      "id" in value &&
      "secret" in value &&
      typeof value.id === "string" &&
      value.id &&
      typeof value.secret === "string" &&
      value.secret
    ) {
      return { id: value.id, secret: value.secret };
    }
  } catch {
    // An invalid recovery record cannot authorize a cart read or merge.
  }
  localStorage.removeItem(GUEST_RECOVERY_KEY);
}

async function request(path: string, signal: AbortSignal, init?: RequestInit) {
  signal.throwIfAborted();
  const response = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
    signal
  });
  if (!response.ok) throw new Error("Cart session could not be restored");
  return response.json();
}

/** Resolve guest ownership before vendor hydration; vendor onLogin discards proof on failed merges. */
export async function prepareCartSession(
  userId: string | null,
  signal: AbortSignal
): Promise<void> {
  const prepare = async () => {
    signal.throwIfAborted();
    const proof = readGuestProof();
    // Older versions persisted account cart IDs alongside guest carts.
    if (!proof) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }
    const { id: sourceCartID, secret: sourceSecret } = proof;
    // The vendor's old hydration rejection can clear its storage after unmount.
    // Keep recovery proof outside the vendor's keys until merge acknowledgment.
    localStorage.setItem(
      GUEST_RECOVERY_KEY,
      JSON.stringify({ id: sourceCartID, secret: sourceSecret })
    );
    if (!userId) {
      localStorage.setItem(CART_STORAGE_KEY, sourceCartID);
      localStorage.setItem(`${CART_STORAGE_KEY}_secret`, sourceSecret);
      return;
    }
    const data = await request(
      "/api/users/me?depth=0&select[id]=true&select[cart]=true",
      signal
    );
    if (data.user?.id !== userId)
      throw new Error("Cart session identity changed");
    const cart = data.user.cart?.docs?.[0];
    const targetCartID = typeof cart === "string" ? cart : cart?.id;
    if (targetCartID !== sourceCartID) {
      const result = await request(
        `/api/carts/${encodeURIComponent(targetCartID ?? sourceCartID)}/merge`,
        signal,
        {
          method: "POST",
          body: JSON.stringify({ sourceCartID, sourceSecret })
        }
      );
      if (!result.success)
        throw new Error("Guest cart merge could not be completed");
    }
    signal.throwIfAborted();
    if (
      localStorage.getItem(CART_STORAGE_KEY) === sourceCartID &&
      localStorage.getItem(`${CART_STORAGE_KEY}_secret`) === sourceSecret
    ) {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(`${CART_STORAGE_KEY}_secret`);
    }
    if (
      localStorage.getItem(GUEST_RECOVERY_KEY) ===
      JSON.stringify({ id: sourceCartID, secret: sourceSecret })
    ) {
      localStorage.removeItem(GUEST_RECOVERY_KEY);
    }
  };
  if (navigator.locks)
    await navigator.locks.request(
      `${CART_STORAGE_KEY}:session`,
      { signal },
      prepare
    );
  else await prepare();
}
