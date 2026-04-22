import { AuthRequiredCard } from '@/src/features/auth/ui/AuthRequiredCard';
import { PrivateBattlesPageClient } from '@/src/features/private-battles/ui/PrivateBattlesPageClient';
import { getPrivateBattles } from '@/src/shared/lib/api/internal';
import { getCurrentUser } from '@/src/shared/lib/auth/session';

export default async function PrivateBattlesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <AuthRequiredCard
          returnTo="/private-battles"
          title="Приватные бои доступны после входа"
          description="Авторизуйтесь, чтобы создавать комнаты и принимать приглашения."
        />
      </div>
    );
  }

  const privateBattles = await getPrivateBattles();

  return (
    <PrivateBattlesPageClient
      currentUsername={user.username}
      initialBattles={privateBattles}
    />
  );
}
