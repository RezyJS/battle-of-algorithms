import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/src/shared/lib/auth/session';

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/');
  }

  redirect('/api/auth/login');
}
