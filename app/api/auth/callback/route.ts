import { NextRequest, NextResponse } from 'next/server';

import {
  clearAuthorizationCookies,
  exchangeCodeForUser,
  readAuthorizationCookies,
} from '@/src/shared/lib/auth/keycloak';
import { getAppUrl } from '@/src/shared/lib/auth/config';
import { attachSessionCookie } from '@/src/shared/lib/auth/session';
import { syncUserProfile } from '@/src/shared/lib/auth/sync-user';

function getAppRedirectUrl(path: string): URL {
  return new URL(path, getAppUrl());
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const authError = request.nextUrl.searchParams.get('error');

  if (authError) {
    return NextResponse.redirect(getAppRedirectUrl('/auth-error?code=oauth'));
  }

  if (!code || !state) {
    return NextResponse.redirect(getAppRedirectUrl('/auth-error?code=callback'));
  }

  const storedValues = readAuthorizationCookies(request);

  if (!storedValues.state || !storedValues.codeVerifier) {
    return NextResponse.redirect(getAppRedirectUrl('/auth-error?code=state'));
  }

  if (storedValues.state !== state) {
    return NextResponse.redirect(getAppRedirectUrl('/auth-error?code=state'));
  }

  try {
    const authResult = await exchangeCodeForUser(code, storedValues.codeVerifier);
    const syncedUser = await syncUserProfile(authResult.user);
    const response = NextResponse.redirect(
      getAppRedirectUrl(storedValues.returnTo || '/'),
    );

    clearAuthorizationCookies(response);
    attachSessionCookie(response, syncedUser, authResult.idToken);

    return response;
  } catch (error) {
    console.error('Auth callback exchange failed', {
      error,
      requestUrl: request.url,
      returnTo: storedValues.returnTo,
      hasState: Boolean(storedValues.state),
      hasCodeVerifier: Boolean(storedValues.codeVerifier),
    });

    const response = NextResponse.redirect(
      getAppRedirectUrl('/auth-error?code=exchange'),
    );

    clearAuthorizationCookies(response);

    return response;
  }
}
