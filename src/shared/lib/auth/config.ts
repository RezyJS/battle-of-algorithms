const DEFAULT_APP_URL = 'http://localhost:3000';

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getBaseAppUrl(): string {
  return process.env.APP_URL ?? DEFAULT_APP_URL;
}

export function getKeycloakRealmUrl(): string {
  return requireEnv('KEYCLOAK_ISSUER');
}

export function getKeycloakInternalRealmUrl(): string {
  return process.env.KEYCLOAK_INTERNAL_ISSUER ?? getKeycloakRealmUrl();
}

export function getKeycloakClientId(): string {
  return requireEnv('KEYCLOAK_CLIENT_ID');
}

export function getKeycloakClientSecret(): string | null {
  const secret = process.env.KEYCLOAK_CLIENT_SECRET;

  if (!secret || secret === 'replace-me') {
    return null;
  }

  return secret;
}

export function getSessionSecret(): string {
  return requireEnv('SESSION_SECRET');
}

export function getInternalApiSecret(): string {
  return requireEnv('INTERNAL_API_SECRET');
}

export function getAppUrl(): string {
  return getBaseAppUrl();
}

export function getApiUrl(): string {
  return requireEnv('NEXT_PUBLIC_API_URL');
}

export function getAuthCallbackUrl(): string {
  return `${getBaseAppUrl()}/api/auth/callback`;
}

export function getPostLogoutRedirectUrl(): string {
  return getBaseAppUrl();
}

export function getKeycloakLogoutUrl(): string {
  return `${getKeycloakRealmUrl()}/protocol/openid-connect/logout`;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}
