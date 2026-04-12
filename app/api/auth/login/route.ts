import { NextRequest, NextResponse } from 'next/server';

import {
  attachAuthorizationCookies,
  buildAuthorizationRequest,
} from '@/src/shared/lib/auth/keycloak';

export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get('returnTo');
  const authorizationRequest = buildAuthorizationRequest(returnTo);
  const response = NextResponse.redirect(authorizationRequest.url);

  attachAuthorizationCookies(response, authorizationRequest);

  return response;
}
