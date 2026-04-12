import { NextRequest, NextResponse } from 'next/server';

import {
  attachAuthorizationCookies,
  buildRegistrationRequest,
} from '@/src/shared/lib/auth/keycloak';

export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get('returnTo');
  const registrationRequest = buildRegistrationRequest(returnTo);
  const response = NextResponse.redirect(registrationRequest.url);

  attachAuthorizationCookies(response, registrationRequest);

  return response;
}
