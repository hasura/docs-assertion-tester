import dotenv from 'dotenv';
import * as core from '@actions/core';
import { getSinglePR, getAssertion, getDiff, getChangedFiles, getFileContent } from './github';
import { generatePrompt, testAssertion, writeAnalysis } from './open_ai';

dotenv.config();

// Our configuration variables using GitHub Actions for production and dotenv for local development
const prNumber: number = parseInt(core.getInput('PR_NUMBER') || (process.env.PR_NUMBER as string));
const org: string = core.getInput('GITHUB_ORG') || (process.env.GITHUB_ORG as string);
const repo: string = core.getInput('GITHUB_REPOSITORY') || (process.env.GITHUB_REPOSITORY as string);

async function main() {
  const PR = await getSinglePR(org, repo, prNumber);
  const assertion = await getAssertion(PR?.body ?? '');
  if (assertion?.length === 0 || assertion === null) {
    console.log('No assertion found');
    core.setFailed('No assertion found');
    return;
  } else {
    const diff: string = await getDiff(prNumber);
    const changedFiles = getChangedFiles(diff);
    const file: any = await getFileContent(changedFiles);
    const prompt: string = generatePrompt(diff, assertion, file);
    const rawAnalysis = await testAssertion(prompt);
    const analysis = writeAnalysis(rawAnalysis?.toString() ?? '');
    console.log(analysis);
    core.setOutput('analysis', analysis);
    return analysis;
  }
}

main();
