import { AuthRequiredCard } from '@/src/features/auth/ui/AuthRequiredCard';
import { MapEditorPageClient } from '@/src/features/auth/ui/MapEditorPageClient';
import { getCurrentUser } from '@/src/shared/lib/auth/session';

export default async function EditorMapPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <AuthRequiredCard
          returnTo="/editor/map"
          title="Конструктор доступен после входа"
          description="Авторизуйтесь, чтобы подготовить тестовую карту для редактора."
        />
      </div>
    );
  }

  return (
    <MapEditorPageClient
      activeBattleId={null}
      initialConfig={null}
      draftMode
      returnTo="/editor"
      draftStorageKey="boa-editor-custom-map-draft"
      showModerationNav={false}
      title="Конструктор тестовой карты"
      description="Соберите карту для локального прогона алгоритма в редакторе. Она не влияет на аренную конфигурацию."
    />
  );
}
