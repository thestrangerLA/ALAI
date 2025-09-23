'use server';
/**
 * @fileOverview Summarizes an expanded idea and suggests refinements.
 *
 * - summarizeAndRefineIdea - A function that summarizes and refines an idea.
 * - SummarizeAndRefineIdeaInput - The input type for the summarizeAndRefineIdea function.
 * - SummarizeAndRefineIdeaOutput - The return type for the summarizeAndRefineIdea function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeAndRefineIdeaInputSchema = z.object({
  expandedIdea: z
    .string()
    .describe('The expanded idea that needs to be summarized and refined.'),
});
export type SummarizeAndRefineIdeaInput = z.infer<
  typeof SummarizeAndRefineIdeaInputSchema
>;

const SummarizeAndRefineIdeaOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the expanded idea.'),
  refinementOptions: z
    .array(z.string())
    .describe(
      'A list of options to further refine the expanded idea, such as adjusting the level of detail, focus area, or target audience.'
    ),
});
export type SummarizeAndRefineIdeaOutput = z.infer<
  typeof SummarizeAndRefineIdeaOutputSchema
>;

export async function summarizeAndRefineIdea(
  input: SummarizeAndRefineIdeaInput
): Promise<SummarizeAndRefineIdeaOutput> {
  return summarizeAndRefineIdeaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeAndRefineIdeaPrompt',
  input: {schema: SummarizeAndRefineIdeaInputSchema},
  output: {schema: SummarizeAndRefineIdeaOutputSchema},
  prompt: `Summarize the following expanded idea and provide options to refine it further.\n\nExpanded Idea: {{{expandedIdea}}}\n\nSummary:\n{{output summary}}\n\nRefinement Options:\n{{#each (splitLines output.refinementOptions)}}{{this}}\n{{/each}}`,
});

const summarizeAndRefineIdeaFlow = ai.defineFlow(
  {
    name: 'summarizeAndRefineIdeaFlow',
    inputSchema: SummarizeAndRefineIdeaInputSchema,
    outputSchema: SummarizeAndRefineIdeaOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
