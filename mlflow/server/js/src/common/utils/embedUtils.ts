// Standalone stub — the real embedUtils lives downstream and reads
// DeploymentMode from mod-arch-core.  In prototype mode we always
// run standalone, so every helper returns the non-federated default.

export const useIsIntegrated = (): boolean => false;
export const isIntegrated = (): boolean => false;
export const getApiBaseUrl = (): string => '';
export const prefixApiUrl = (_relativeUrl: string): string | null => null;
