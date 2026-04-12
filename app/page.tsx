import { ArenaPageClient } from '@/src/features/auth/ui/ArenaPageClient';
import { getActiveBattle } from '@/src/shared/lib/api/internal';
import { getCurrentUser } from '@/src/shared/lib/auth/session';

export default async function ArenaPage() {
  const currentUser = await getCurrentUser();
  const activeBattle = await getActiveBattle();
  const canManageArena =
    currentUser?.roles.some(
      (role) => role === 'moderator' || role === 'admin',
    ) ?? false;

  return (
    <ArenaPageClient
      canManageArena={canManageArena}
      activeBattle={activeBattle}
    />
  );
}
