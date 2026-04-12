'use server';

import { revalidatePath } from 'next/cache';

import {
  saveOwnSubmissionDraft,
  submitOwnSubmission,
  type UserSubmission,
} from '@/src/shared/lib/api/internal';
import { getCurrentUser } from '@/src/shared/lib/auth/session';

function assertAuthenticated() {
  return getCurrentUser().then((currentUser) => {
    if (!currentUser) {
      throw new Error('Unauthorized');
    }

    return currentUser;
  });
}

export async function saveEditorDraftAction(
  code: string,
): Promise<UserSubmission> {
  await assertAuthenticated();

  const submission = await saveOwnSubmissionDraft(code);
  revalidatePath('/editor');

  return submission;
}

export async function submitEditorCodeAction(
  code: string,
): Promise<UserSubmission> {
  await assertAuthenticated();

  const submission = await submitOwnSubmission(code);
  revalidatePath('/editor');
  revalidatePath('/moderation');

  return submission;
}
