import { AuthRequiredCard } from '@/src/features/auth/ui/AuthRequiredCard';
import { ForbiddenCard } from '@/src/features/auth/ui/ForbiddenCard';
import { MapEditorPageClient } from '@/src/features/auth/ui/MapEditorPageClient';
import { getCurrentUser } from '@/src/shared/lib/auth/session';

export default async function MapEditorPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <AuthRequiredCard
          returnTo="/map-editor"
          title="Конструктор доступен после входа"
          description="Авторизуйтесь, чтобы создавать и редактировать карты."
        />
      </div>
    );
  }

  const hasAccess = user.roles.some(
    (role) => role === 'moderator' || role === 'admin',
  );

  if (!hasAccess) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <ForbiddenCard description="Конструктор карт доступен только модераторам и администраторам." />
      </div>
    );
  }

  return <MapEditorPageClient />;
}
