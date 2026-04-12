import { NextRequest, NextResponse } from 'next/server';

import {
  clearAuthorizationCookies,
  exchangeCodeForUser,
  readAuthorizationCookies,
} from '@/src/shared/lib/auth/keycloak';
import { attachSessionCookie } from '@/src/shared/lib/auth/session';
import { syncUserProfile } from '@/src/shared/lib/auth/sync-user';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const authError = request.nextUrl.searchParams.get('error');

  if (authError) {
    return NextResponse.redirect(new URL('/auth-error?code=oauth', request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/auth-error?code=callback', request.url),
    );
  }

  const storedValues = readAuthorizationCookies(request);

  if (!storedValues.state || !storedValues.codeVerifier) {
    return NextResponse.redirect(new URL('/auth-error?code=state', request.url));
  }

  if (storedValues.state !== state) {
    return NextResponse.redirect(new URL('/auth-error?code=state', request.url));
  }

  try {
    const authResult = await exchangeCodeForUser(code, storedValues.codeVerifier);
    const syncedUser = await syncUserProfile(authResult.user);
    const response = NextResponse.redirect(
      new URL(storedValues.returnTo || '/', request.url),
    );

    clearAuthorizationCookies(response);
    attachSessionCookie(response, syncedUser, authResult.idToken);

    return response;
  } catch {
    const response = NextResponse.redirect(
      new URL('/auth-error?code=exchange', request.url),
    );

    clearAuthorizationCookies(response);

    return response;
  }
}
