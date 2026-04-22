'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/src/shared/lib/auth/session';
import { updateModerationSubmissionStatus } from '@/src/shared/lib/api/internal';

export type ModerationActionState = {
  error: string | null;
  success: string | null;
};

export async function updateSubmissionStatusAction(
  _prevState: ModerationActionState,
  formData: FormData,
): Promise<ModerationActionState> {
  const currentUser = await getCurrentUser();
  const hasAccess =
    currentUser?.roles.some((role) => role === 'moderator' || role === 'admin') ??
    false;

  if (!hasAccess) {
    return {
      error: 'Нет доступа',
      success: null,
    };
  }

  const submissionId = Number(formData.get('submission_id'));
  const status = String(formData.get('status') ?? '');
  const comment = String(formData.get('comment') ?? '');

  if (!submissionId || !status) {
    return {
      error: 'Некорректный payload',
      success: null,
    };
  }

  try {
    await updateModerationSubmissionStatus(submissionId, status, comment);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : 'Не удалось обновить статус',
      success: null,
    };
  }

  revalidatePath('/moderation');

  return {
    error: null,
    success: 'Статус обновлён',
  };
}
