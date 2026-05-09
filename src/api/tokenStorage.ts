export const TokenStorage = {
  getAccessToken: (): string | null => null,
  setAccessToken: (_token: string): void => undefined,

  getRefreshToken: (): string | null => null,
  setRefreshToken: (_token: string): void => undefined,

  getUser: () => null,
  setUser: (_user: unknown): void => undefined,

  getIdToken: (): string | null => null,
  setIdToken: (_token: string): void => undefined,

  clearTokens: (): void => {
    undefined;
  },
};
