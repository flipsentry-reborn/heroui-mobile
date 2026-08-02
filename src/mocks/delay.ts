/** Artificial mock latency — random 50–200ms. */
export function mockDelay(): Promise<void> {
  const ms = Math.floor(1 + Math.random() * 5);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
