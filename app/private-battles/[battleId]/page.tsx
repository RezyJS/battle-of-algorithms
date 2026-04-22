import { notFound } from 'next/navigation';

import { PrivateBattleRoomClient } from '@/src/features/private-battles/ui/PrivateBattleRoomClient';
import { AuthRequiredCard } from '@/src/features/auth/ui/AuthRequiredCard';
import { getPrivateBattle } from '@/src/shared/lib/api/internal';
import { getCurrentUser } from '@/src/shared/lib/auth/session';

export default async function PrivateBattlePage({
  params,
}: {
  params: Promise<{ battleId: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <AuthRequiredCard
          returnTo="/editor"
          title="Приватный бой доступен после входа"
          description="Авторизуйтесь, чтобы открыть комнату приватного боя."
        />
      </div>
    );
  }

  const { battleId } = await params;
  const battle = await getPrivateBattle(Number(battleId));

  if (!battle) {
    notFound();
  }

  return <PrivateBattleRoomClient battle={battle} />;
}
