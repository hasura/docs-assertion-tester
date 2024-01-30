import { testConnection, generatePrompt, testAssertion, writeAnalysis, openAiFeedback } from '../src/open_ai';
import { getDiff, getSinglePR, getAssertion, getChangedFiles, getFileContent } from '../src/github';

describe('OpenAI Functionality', () => {
  it('Should be able to connect to OpenAI', async () => {
    await expect(testConnection()).resolves.toBe(true);
  });
  it('Should be able to generate a prompt using the diff, assertion, and whole file', async () => {
    const diff: string = await getDiff(262, 'hasura', 'v3-docs');
    const assertion: string = 'The documentation is easy to read and understand.';
    const file: string = 'This is a test file.';
    const prompt: string = generatePrompt(diff, assertion, file);
    expect(prompt).toContain(assertion);
    expect(prompt).toContain(diff);
    expect(prompt).toContain(file);
  });
  it.todo('Should return null when an error is thrown');
  it('Should be able to generate a response using the prompt and a sample diff', async () => {
    // This should produce somewhat regularly happy results 👇
    // const prNumber: number = 243;
    // This should produce somewhat regularly unhappy results 👇
    const prNumber: number = 262;
    const PR = await getSinglePR('hasura', 'v3-docs', prNumber);
    const assertion = await getAssertion(PR?.body || '');
    const diff: string = await getDiff(prNumber, 'hasura', 'v3-docs');
    const changedFiles = getChangedFiles(diff);
    const file: any = await getFileContent(changedFiles, 'hasura', 'v3-docs');
    const prompt: string = generatePrompt(diff, assertion, file);
    const response = await testAssertion(prompt);
    console.log(response);
    expect(response).toBeTruthy();
  }, 100000);
  it('Should create a nicely formatted message using the response', async () => {
    const feedback: openAiFeedback = {
      feedback: [
        { satisfied: '\u2705', scope: 'Diff', feedback: 'You did a great job!' },
        { satisfied: '\u2705', scope: 'Integrated', feedback: 'Look. At. You. Go!' },
      ],
    };
    expect(writeAnalysis(feedback)).toContain('You did a great job!');
  });
});
