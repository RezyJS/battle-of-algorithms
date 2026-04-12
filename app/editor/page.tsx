import { EditorPageClient } from '@/src/features/auth/ui/EditorPageClient';
import { AuthRequiredCard } from '@/src/features/auth/ui/AuthRequiredCard';
import { getOwnSubmission } from '@/src/shared/lib/api/internal';
import { getCurrentUser } from '@/src/shared/lib/auth/session';

export default async function EditorPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <AuthRequiredCard
          returnTo="/editor"
          title="Редактор доступен после входа"
          description="Авторизуйтесь, чтобы открыть редактор и работать со своим кодом."
        />
      </div>
    );
  }

  const submission = await getOwnSubmission();

  return (
    <EditorPageClient
      currentUserName={user.name ?? user.username}
      initialSubmission={submission}
    />
  );
}
