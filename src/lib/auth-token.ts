/** Mock Account tokens are always prefixed this way (see mocks/services/account). */
export const MOCK_JWT_PREFIX = "mock-jwt-";

export function isMockJwt(token: string | null | undefined): boolean {
  return typeof token === "string" && token.startsWith(MOCK_JWT_PREFIX);
}
