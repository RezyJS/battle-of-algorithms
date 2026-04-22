import type { PrivateBattleListItem } from '@/src/shared/lib/api/internal';

import { PrivateBattlesPanel } from './PrivateBattlesPanel';

export function PrivateBattlesPageClient({
  currentUsername,
  initialBattles,
}: {
  currentUsername: string;
  initialBattles: PrivateBattleListItem[];
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Приватные бои</h1>
        <p className="text-slate-600 text-sm mt-1">
          Создавайте комнаты по username, загружайте код и запускайте бой после двух подтверждений.
        </p>
      </div>

      <PrivateBattlesPanel
        currentUsername={currentUsername}
        initialBattles={initialBattles}
      />
    </div>
  );
}
