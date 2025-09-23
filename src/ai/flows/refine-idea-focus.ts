// refine-idea-focus.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for refining the focus area of an AI-expanded idea.
 *
 * It takes an initial idea and a desired focus area as input, and uses an AI prompt
 * to tailor the idea to the specified domain or application.
 *
 * @exports refineIdeaFocus - The main function to refine the idea focus.
 * @exports RefineIdeaFocusInput - The input type for the refineIdeaFocus function.
 * @exports RefineIdeaFocusOutput - The output type for the refineIdeaFocus function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the refineIdeaFocus function
const RefineIdeaFocusInputSchema = z.object({
  initialIdea: z.string().describe('The initial idea or concept to refine.'),
  focusArea: z.string().describe('The desired focus area or domain for the idea.'),
});
export type RefineIdeaFocusInput = z.infer<typeof RefineIdeaFocusInputSchema>;

// Define the output schema for the refineIdeaFocus function
const RefineIdeaFocusOutputSchema = z.object({
  refinedIdea: z.string().describe('The refined idea tailored to the specified focus area.'),
});
export type RefineIdeaFocusOutput = z.infer<typeof RefineIdeaFocusOutputSchema>;

// Define the main function to refine the idea focus
export async function refineIdeaFocus(input: RefineIdeaFocusInput): Promise<RefineIdeaFocusOutput> {
  return refineIdeaFocusFlow(input);
}

// Define the AI prompt for refining the idea focus
const refineIdeaFocusPrompt = ai.definePrompt({
  name: 'refineIdeaFocusPrompt',
  input: {schema: RefineIdeaFocusInputSchema},
  output: {schema: RefineIdeaFocusOutputSchema},
  prompt: `You are an AI assistant tasked with refining ideas to fit specific focus areas.\n\n  The initial idea is: {{{initialIdea}}}\n  The desired focus area is: {{{focusArea}}}\n\n  Please refine the initial idea to be more relevant and applicable to the specified focus area.\n  Present the refined idea in a clear and concise manner.
  Refined Idea:`, // Changed prompt to return the refined idea.
});

// Define the Genkit flow for refining the idea focus
const refineIdeaFocusFlow = ai.defineFlow(
  {
    name: 'refineIdeaFocusFlow',
    inputSchema: RefineIdeaFocusInputSchema,
    outputSchema: RefineIdeaFocusOutputSchema,
  },
  async input => {
    const {output} = await refineIdeaFocusPrompt(input);
    return output!;
  }
);
