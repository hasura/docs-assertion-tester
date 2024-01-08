import dotenv from 'dotenv';
import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types';

dotenv.config();

const token: string = core.getInput('GITHUB_TOKEN') || (process.env.GITHUB_TOKEN as string);

export const github = new Octokit({
  auth: token,
});

// We'll use this to test a connection to GitHub
export const testConnection = async (): Promise<boolean> => {
  try {
    const { data } = await github.repos.listForAuthenticatedUser();
    console.log(`🚀 Connection to GH established`);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// If we can get a connection, we can get access to a repo, or we'll return null because
export const getRepo = async (
  owner: string,
  repo: string
): Promise<GetResponseDataTypeFromEndpointMethod<typeof github.repos.get> | null> => {
  try {
    const { data } = await github.repos.get({ owner, repo });
    console.log(`🐕 Fetched the repo`);
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// If we can get a repo, we can get all the PRs associated with it
export const getPullRequests = async (
  owner: string,
  repo: string
): Promise<GetResponseDataTypeFromEndpointMethod<typeof github.pulls.list> | null> => {
  try {
    const { data } = await github.pulls.list({ owner, repo });
    console.log(`🐕 Fetched all PRs`);
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// We should be able to get a PR by its number
export const getSinglePR = async (
  owner: string,
  repo: string,
  prNumber: number
): Promise<GetResponseDataTypeFromEndpointMethod<typeof github.pulls.get> | null> => {
  try {
    const { data } = await github.pulls.get({ owner, repo, pull_number: prNumber });
    console.log(`✅ Got PR #${prNumber}`);
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// If we can get a PR, we can parse the description and isolate the assertion using the comments
export const getAssertion = async (description: string): Promise<string | null> => {
  //   find everything in between <!-- DX:Assertion-start --> and <!-- DX:Assertion-end -->
  const regex = /<!-- DX:Assertion-start -->([\s\S]*?)<!-- DX:Assertion-end -->/g;
  const assertion = regex.exec(description);
  if (assertion) {
    console.log(`✅ Got assertion: ${assertion[1]}`);
    return assertion[1];
  }
  return null;
};

// If we have a diff_url we can get the diff
export const getDiff = async (prNumber: number, owner: string, repo: string): Promise<string> => {
  const { data: diff } = await github.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: {
      format: 'diff',
    },
  });

  // We'll have to convert the diff to a string, then we can return it
  const diffString = diff.toString();
  console.log(`✅ Got diff for PR #${prNumber}`);
  return diffString;
};

// If we have the diff, we can determine which files were changed
export const getChangedFiles = (diff: string): string[] => {
  const fileLines = diff.split('\n').filter((line) => line.startsWith('diff --git'));
  const changedFiles = fileLines
    .map((line) => {
      const paths = line.split(' ').slice(2);
      return paths.map((path) => path.replace('a/', '').replace('b/', ''));
    })
    .flat();
  console.log(`✅ Found ${changedFiles.length} affected files`);
  return [...new Set(changedFiles)];
};

// We'll also need to get the whole file using the files changed from
export async function getFileContent(path: string[], owner: string, repo: string) {
  let content: string = '';
  // loop over the array of files
  for (let i = 0; i < path.length; i++) {
    // get the file content
    const { data }: any = await github.repos.getContent({
      owner,
      repo,
      path: path[i],
    });
    // decode the file content
    const decodedContent = Buffer.from(data.content, 'base64').toString();
    // add the decoded content to the content string
    content += decodedContent;
  }
  console.log(`✅ Got file(s) contents`);
  return content;
}
