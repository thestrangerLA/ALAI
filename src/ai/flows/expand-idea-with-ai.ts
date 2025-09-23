'use server';
/**
 * @fileOverview AI flow to expand a user's initial idea with additional details, potential applications, or related concepts.
 *
 * - expandIdea - A function that takes a user's initial idea and expands upon it using AI.
 * - ExpandIdeaInput - The input type for the expandIdea function, representing the user's initial idea.
 * - ExpandIdeaOutput - The output type for the expandIdea function, representing the AI-expanded idea.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExpandIdeaInputSchema = z.object({
  initialIdea: z.string().describe('The user\u2019s initial idea or concept.'),
});
export type ExpandIdeaInput = z.infer<typeof ExpandIdeaInputSchema>;

const ExpandIdeaOutputSchema = z.object({
  expandedIdea: z.string().describe('The AI-expanded idea with additional details, potential applications, or related concepts.'),
});
export type ExpandIdeaOutput = z.infer<typeof ExpandIdeaOutputSchema>;

export async function expandIdea(input: ExpandIdeaInput): Promise<ExpandIdeaOutput> {
  return expandIdeaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'expandIdeaPrompt',
  input: {schema: ExpandIdeaInputSchema},
  output: {schema: ExpandIdeaOutputSchema},
  prompt: `You are a creative brainstorming assistant. The user will provide an initial idea, and you will expand upon it with additional details, potential applications, and related concepts.

Initial Idea: {{{initialIdea}}}

Expanded Idea:`,
});

const expandIdeaFlow = ai.defineFlow(
  {
    name: 'expandIdeaFlow',
    inputSchema: ExpandIdeaInputSchema,
    outputSchema: ExpandIdeaOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
