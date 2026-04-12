import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextResponse } from 'next/server';

import { getSessionSecret, isProduction } from './config';
import type { AppRole, SessionPayload, SessionUser } from './types';

const SESSION_COOKIE = 'boa_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function encodeBase64Url(input: string): string {
  return Buffer.from(input, 'utf-8').toString('base64url');
}

function decodeBase64Url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf-8');
}

function sign(value: string): string {
  return createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
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

function buildSessionToken(payload: SessionPayload): string {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function parseSessionToken(token: string): SessionPayload | null {
  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const signatureBuffer = Buffer.from(signature, 'utf-8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as SessionPayload;

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function createSession(user: SessionUser) {
  const cookieStore = await cookies();

  cookieStore.set(
    SESSION_COOKIE,
    buildSessionToken(createSessionPayload(user)),
    getCookieOptions(SESSION_TTL_SECONDS),
  );
}

function createSessionPayload(user: SessionUser, idToken?: string): SessionPayload {
  const now = Math.floor(Date.now() / 1000);
  return {
    user,
    idToken,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
}

export function attachSessionCookie(
  response: NextResponse,
  user: SessionUser,
  idToken?: string,
) {
  response.cookies.set(
    SESSION_COOKIE,
    buildSessionToken(createSessionPayload(user, idToken)),
    getCookieOptions(SESSION_TTL_SECONDS),
  );
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE);
}

export async function clearSession() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return parseSessionToken(token);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();

  return session?.user ?? null;
}

export async function requireUser(returnTo: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return user;
}

export async function requireRole(roles: AppRole[], returnTo: string) {
  const user = await requireUser(returnTo);
  const hasRole = user.roles.some((role) => roles.includes(role));

  if (!hasRole) {
    redirect('/forbidden');
  }

  return user;
}
