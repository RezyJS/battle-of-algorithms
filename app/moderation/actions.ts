'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/src/shared/lib/auth/session';
import { updateModerationSubmissionStatus } from '@/src/shared/lib/api/internal';

export async function updateSubmissionStatusAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const hasAccess =
    currentUser?.roles.some((role) => role === 'moderator' || role === 'admin') ??
    false;

  if (!hasAccess) {
    throw new Error('Forbidden');
  }

  const submissionId = Number(formData.get('submission_id'));
  const status = String(formData.get('status') ?? '');
  const comment = String(formData.get('comment') ?? '');

  if (!submissionId || !status) {
    throw new Error('Invalid moderation form payload');
  }

  await updateModerationSubmissionStatus(submissionId, status, comment);
  revalidatePath('/moderation');
}
