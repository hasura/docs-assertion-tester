import dotenv from 'dotenv';
import * as core from '@actions/core';
const openAi = require('openai');

dotenv.config();

const api_key: string = core.getInput('OPENAI_API_KEY') || (process.env.OPENAI_API_KEY as string);

const openai = new openAi({
  apiKey: api_key,
});

// This wil generate our prompt using the diff, assertion, and whole file
export const generatePrompt = (diff: string, assertion: string | null, file: string): string => {
  const comboPrompt = `As a senior engineer, you're tasked with reviewing a documentation PR. Your review will be conducted through two distinct lenses, both centered around an assertion related to usability. The first lens will focus on examining the diff itself — providing targeted feedback on what the PR author actually contributed. The second lens will compare the diff to the entire set of changed files, assessing how the contribution fits within the larger context in relation to the usability assertion. For each lens, provide feedback and determine if the usability assertion is satisfied. You should speak directly to the author and refer to them in second person. Your output should be a JSON-formatted array with two objects. Each object should contain the following properties: 'satisfied' (either a ✅ or ❌ to indicate if the assertion is met), 'scope' (either 'Diff' or 'Integrated'), and 'feedback' (a string providing your targeted feedback for that lens). Here's the assertion: ${assertion}\n\nHere's the diff:\n\n${diff}\n\nHere's the original files:\n\n${file}\n\nBear in mind that some of the files may have been renamed. Remember, do not wrap the JSON in a code block.`;
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
export const testAssertion = async (prompt: string): Promise<string | null> => {
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
    });

    const analysis: any = chatCompletion.choices[0].message.content;
    console.log(`✅ Got analysis from OpenAI`);
    return analysis;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// We decided to send things back as JSON so we can manipulate the data in the response we'll be sending back to GitHub
export const writeAnalysis = (analysis: string): string => {
  // We've still got to double-check because ChatGPT will sometimes return a string that's not valid JSON by wrapping it in code blocks
  const regex = /^```(json)?/gm;
  analysis = analysis.replace(regex, '');
  const analysisJSON = JSON.parse(analysis);
  let message = `## DX: Assertion Testing\n\n`;
  const feedback = analysisJSON.map((item: any) => {
    // we'll create some markdown to make the feedback look nice
    return `### ${item.satisfied} ${item.scope}\n\n${item.feedback}\n\n`;
  });
  feedback.unshift(message);
  const feedbackString = feedback.join('');
  return feedbackString;
};
