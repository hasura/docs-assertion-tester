import dotenv from 'dotenv';
import * as core from '@actions/core';
const openAi = require('openai');

dotenv.config();

const api_key: string = core.getInput('OPENAI_API_KEY') || (process.env.OPENAI_API_KEY as string);

const openai = new openAi({
  apiKey: api_key,
});

/**
 * We're using the JSON export for OpenAI, so we're using this type to dictate how we can
 * access properties and iterate over them in the output.
 */
export type openAiFeedback = {
  feedback: [
    { satisfied: string; scope: string; feedback: string },
    { satisfied: string; scope: string; feedback: string }
  ];
};

// This wil generate our prompt using the diff, assertion, and whole file
export const generatePrompt = (diff: string, assertion: string | null, file: string): string => {
  const comboPrompt = `As a senior engineer, you're tasked with reviewing a documentation PR. Your review comprises two distinct perspectives, each focused on a specific aspect of usability. 

- **First Perspective**: Examine the PR's diff. Provide targeted feedback on the author's contribution.
- **Second Perspective**: Assess how the diff integrates with the entire set of changed files, evaluating its contribution to the overall usability.

**Usability Assertion**: ${assertion}

**PR Diff**: ${diff}

**Original Files**: ${file}

(Note: Some files may have been renamed.)

**Your Task**: Provide feedback for each perspective. Determine if the usability assertion is met in each context.

**Output Format**: Your response should be a JSON-formatted array containing exactly two objects. Each object must have the following properties:
- 'satisfied': Indicate if the assertion is met (✅ for yes, ❌ for no).
- 'scope': 'Diff' for the first perspective, 'Integrated' for the second.
- 'feedback': A string providing your targeted feedback.

Example Output:
{
  "feedback": [
    {
      "satisfied": "✅",
      "scope": "Diff",
      "feedback": "Your changes in the PR are clear and enhance the readability of the documentation."
    },
    {
      "satisfied": "❌",
      "scope": "Integrated",
      "feedback": "The changes do not align well with the overall structure and flow of the existing documentation."
    }
  ]
}
`;
  return comboPrompt;
};

// Just like our GitHub module, we'll test the connection to OpenAI
export const testConnection = async (): Promise<boolean> => {
  try {
    const { data } = await openai.files.list();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// Then, we'll create a function that takes in the diff, the author's assertion(s), and the prompt,
// and returns the analysis from OpenAI
export const testAssertion = async (prompt: string): Promise<openAiFeedback | null> => {
  let conversation = [
    {
      role: 'system',
      content: prompt,
    },
  ];

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: conversation,
      response_format: { type: 'json_object' },
    });

    const analysis = chatCompletion.choices[0].message.content;
    console.log(`✅ Got analysis from OpenAI`);
    const parsedAnalysis: openAiFeedback = JSON.parse(analysis);
    return parsedAnalysis;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// We decided to send things back as JSON so we can manipulate the data in the response we'll be sending back to GitHub
export const writeAnalysis = (analysis: openAiFeedback | null): string => {
  if (analysis === null) {
    return `Error testing the assertions. Check the logs.`;
  } else {
    let message = `## DX: Assertion Testing\n\n`;
    const feedback = analysis.feedback.map((item: any) => {
      // we'll create some markdown to make the feedback look nice
      return `### ${item.satisfied} ${item.scope}\n\n${item.feedback}\n\n`;
    });
    feedback.unshift(message);
    const feedbackString = feedback.join('');
    return feedbackString;
  }
};
