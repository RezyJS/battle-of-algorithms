import { NextResponse } from 'next/server';

import { buildLogoutUrl } from '@/src/shared/lib/auth/keycloak';
import { clearSessionCookie, getSession } from '@/src/shared/lib/auth/session';

export async function POST() {
  const session = await getSession();
  const response = NextResponse.redirect(buildLogoutUrl(session?.idToken), {
    status: 303,
  });

  clearSessionCookie(response);

  return response;
}
