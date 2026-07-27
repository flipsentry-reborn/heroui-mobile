/** Artificial mock latency — random 50–200ms. */
export function mockDelay(): Promise<void> {
  const ms = Math.floor(50 + Math.random() * 151);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
