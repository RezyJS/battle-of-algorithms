import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/src/shared/lib/auth/session';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();

  if (user) {
    redirect('/');
  }

  const params = await searchParams;
  const rawReturnTo = params.returnTo;
  const returnTo = Array.isArray(rawReturnTo) ? rawReturnTo[0] : rawReturnTo;
  const target = returnTo
    ? `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`
    : '/api/auth/login';

  redirect(target);
}
