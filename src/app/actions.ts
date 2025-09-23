'use server';

import { expandIdea, ExpandIdeaInput } from '@/ai/flows/expand-idea-with-ai';
import { refineIdeaFocus, RefineIdeaFocusInput } from '@/ai/flows/refine-idea-focus';
import { summarizeAndRefineIdea, SummarizeAndRefineIdeaInput } from '@/ai/flows/summarize-and-refine-idea';

export async function expandUserIdeaAction(
  input: ExpandIdeaInput
) {
  try {
    const result = await expandIdea(input);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'An unexpected error occurred while expanding the idea. Please try again.' };
  }
}

export async function summarizeAndRefineIdeaAction(
  input: SummarizeAndRefineIdeaInput
) {
  try {
    const result = await summarizeAndRefineIdea(input);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'An unexpected error occurred while summarizing the idea. Please try again.' };
  }
}

export async function refineIdeaFocusAction(
  input: RefineIdeaFocusInput
) {
  try {
    const result = await refineIdeaFocus(input);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'An unexpected error occurred while refining the idea. Please try again.' };
  }
}
