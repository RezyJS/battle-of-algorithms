import { KeyCloak, decodeIdToken, generateCodeVerifier, generateState } from 'arctic';
import type { NextRequest, NextResponse } from 'next/server';

import {
  getAuthCallbackUrl,
  getKeycloakClientId,
  getKeycloakClientSecret,
  getKeycloakInternalRealmUrl,
  getKeycloakLogoutUrl,
  getPostLogoutRedirectUrl,
  getKeycloakRealmUrl,
  isProduction,
} from './config';
import type { AppRole, SessionUser } from './types';

const AUTH_STATE_COOKIE = 'boa_auth_state';
const AUTH_CODE_VERIFIER_COOKIE = 'boa_auth_code_verifier';
const AUTH_RETURN_TO_COOKIE = 'boa_auth_return_to';
const AUTH_COOKIE_MAX_AGE = 60 * 10;

type KeycloakClaims = {
  sub?: string;
  preferred_username?: string;
  email?: string;
  name?: string;
  exp?: number;
  realm_access?: {
    roles?: string[];
  };
};

function createKeycloakClient(realmUrl = getKeycloakRealmUrl()): KeyCloak {
  return new KeyCloak(
    realmUrl,
    getKeycloakClientId(),
    getKeycloakClientSecret(),
    getAuthCallbackUrl(),
  );
}

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

function normalizeReturnTo(input: string | null): string {
  if (!input || !input.startsWith('/')) {
    return '/';
  }

  if (input.startsWith('//')) {
    return '/';
  }

  return input;
}

function normalizeRoles(roles: string[] | undefined): AppRole[] {
  const allowedRoles: AppRole[] = ['user', 'moderator', 'admin'];
  const filteredRoles = (roles ?? []).filter((role): role is AppRole =>
    allowedRoles.includes(role as AppRole),
  );

  if (filteredRoles.length === 0) {
    return ['user'];
  }

  return Array.from(new Set(filteredRoles));
}

export function buildAuthorizationRequest(returnTo: string | null) {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const keycloak = createKeycloakClient();
  const url = keycloak.createAuthorizationURL(state, codeVerifier, [
    'openid',
    'profile',
  ]);

  return {
    url,
    state,
    codeVerifier,
    returnTo: normalizeReturnTo(returnTo),
  };
}

export function buildRegistrationRequest(returnTo: string | null) {
  const request = buildAuthorizationRequest(returnTo);

  request.url.searchParams.set('prompt', 'create');

  return request;
}

export function attachAuthorizationCookies(
  response: NextResponse,
  values: {
    state: string;
    codeVerifier: string;
    returnTo: string;
  },
) {
  response.cookies.set(
    AUTH_STATE_COOKIE,
    values.state,
    getCookieOptions(AUTH_COOKIE_MAX_AGE),
  );
  response.cookies.set(
    AUTH_CODE_VERIFIER_COOKIE,
    values.codeVerifier,
    getCookieOptions(AUTH_COOKIE_MAX_AGE),
  );
  response.cookies.set(
    AUTH_RETURN_TO_COOKIE,
    values.returnTo,
    getCookieOptions(AUTH_COOKIE_MAX_AGE),
  );
}

export function readAuthorizationCookies(request: NextRequest) {
  const state = request.cookies.get(AUTH_STATE_COOKIE)?.value ?? null;
  const codeVerifier =
    request.cookies.get(AUTH_CODE_VERIFIER_COOKIE)?.value ?? null;
  const returnTo = normalizeReturnTo(
    request.cookies.get(AUTH_RETURN_TO_COOKIE)?.value ?? null,
  );

  return { state, codeVerifier, returnTo };
}

export function clearAuthorizationCookies(response: NextResponse) {
  response.cookies.delete(AUTH_STATE_COOKIE);
  response.cookies.delete(AUTH_CODE_VERIFIER_COOKIE);
  response.cookies.delete(AUTH_RETURN_TO_COOKIE);
}

export async function exchangeCodeForUser(
  code: string,
  codeVerifier: string,
): Promise<{ user: SessionUser; idToken: string }> {
  const keycloak = createKeycloakClient(getKeycloakInternalRealmUrl());
  const tokens = await keycloak.validateAuthorizationCode(code, codeVerifier);
  const idTokenClaims = decodeIdToken(tokens.idToken()) as KeycloakClaims;
  const accessTokenClaims = decodeIdToken(tokens.accessToken()) as KeycloakClaims;
  const claims = {
    ...accessTokenClaims,
    ...idTokenClaims,
    realm_access:
      idTokenClaims.realm_access ?? accessTokenClaims.realm_access,
  };

  if (!claims.sub || !claims.preferred_username) {
    throw new Error('Keycloak response does not contain required user claims');
  }

  return {
    user: {
      id: claims.sub,
      username: claims.preferred_username,
      email: claims.email ?? null,
      name: claims.name ?? null,
      roles: normalizeRoles(claims.realm_access?.roles),
    },
    idToken: tokens.idToken(),
  };
}

export function buildLogoutUrl(idToken?: string): URL {
  const url = new URL(getKeycloakLogoutUrl());

  url.searchParams.set('client_id', getKeycloakClientId());
  url.searchParams.set('post_logout_redirect_uri', getPostLogoutRedirectUrl());

  if (idToken) {
    url.searchParams.set('id_token_hint', idToken);
  }

  return url;
}
