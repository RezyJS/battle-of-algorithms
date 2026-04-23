import { AuthRequiredCard } from '@/src/features/auth/ui/AuthRequiredCard';
import { ForbiddenCard } from '@/src/features/auth/ui/ForbiddenCard';
import { MapEditorPageClient } from '@/src/features/auth/ui/MapEditorPageClient';
import { normalizeArenaMapConfig } from '@/src/shared/lib/arena-config';
import { getActiveBattle } from '@/src/shared/lib/api/internal';
import { getCurrentUser } from '@/src/shared/lib/auth/session';

type MapEditorPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MapEditorPage({
  searchParams,
}: MapEditorPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className='max-w-7xl mx-auto px-4 py-10'>
        <AuthRequiredCard
          returnTo='/map-editor'
          title='Конструктор доступен после входа'
          description='Авторизуйтесь, чтобы создавать и редактировать карты.'
        />
      </div>
    );
  }

  const hasAccess = user.roles.some(
    (role) => role === 'moderator' || role === 'admin',
  );

  if (!hasAccess) {
    return (
      <div className='max-w-7xl mx-auto px-4 py-10'>
        <ForbiddenCard description='Конструктор арены доступен только модераторам и администраторам.' />
      </div>
    );
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const draftParam = resolvedSearchParams.draft;
  const returnToParam = resolvedSearchParams.returnTo;
  const draftMode =
    Array.isArray(draftParam) ? draftParam[0] === '1' : draftParam === '1';
  const returnTo =
    typeof returnToParam === 'string' && returnToParam.startsWith('/') ?
      returnToParam
    : '/';

  const activeBattle = await getActiveBattle();
  const initialConfig =
    activeBattle?.map_config ?
      normalizeArenaMapConfig(activeBattle.map_config)
    : null;

  return (
    <MapEditorPageClient
      activeBattleId={activeBattle?.id ?? null}
      initialConfig={initialConfig}
      draftMode={draftMode}
      returnTo={returnTo}
      draftStorageKey='boa-arena-custom-map-draft'
      showModerationNav
      title='Конструктор карт'
    />
  );
}
