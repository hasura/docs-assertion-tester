import {
  testConnection,
  getRepo,
  getPullRequests,
  getSinglePR,
  getAssertion,
  getDiff,
  getChangedFiles,
  getFileContent,
} from '../src/github';

describe('GitHub Functionality', () => {
  it('Should be able to connect to GitHub', () => {
    expect(testConnection()).resolves.toBe(true);
  });
  it('Should be able to access a repo in the Hasura org', () => {
    expect(getRepo('hasura', 'v3-docs')).resolves.toHaveProperty('name', 'v3-docs');
  });
  it('Should be able to get the PRs for the repo', async () => {
    const pullRequests = await getPullRequests('hasura', 'v3-docs');
    expect(pullRequests?.length).toBeGreaterThanOrEqual(0);
  });
  it('Should be able to get the contents of a single PR', () => {
    const prNumber: number = 262;
    expect(getSinglePR('hasura', 'v3-docs', prNumber)).resolves.toHaveProperty('number', prNumber);
  });
  it('Should be able to get the assertion from the description of a PR', async () => {
    // test PR with 262 about PATs
    const prNumber: number = 262;
    const PR = await getSinglePR('hasura', 'v3-docs', prNumber);
    const assertion = await getAssertion(PR?.body || '');
    // the last I checked, this was the text — if it's failing, check th PR 🤷‍♂️
    expect(assertion).toContain('understand how to log in using the PAT with VS Code.');
  });
  it('Should be able to return the diff of a PR', async () => {
    const diffUrl: number = 262;
    const diff = await getDiff(diffUrl, 'hasura', 'v3-docs');
    expect(diff).toContain('diff');
  });
  it('Should be able to determine which files were changed in a PR', async () => {
    const diffUrl: number = 262;
    const diff = await getDiff(diffUrl, 'hasura', 'v3-docs');
    const files = getChangedFiles(diff);
    expect(files).toContain('docs/ci-cd/projects.mdx');
  });
  it('Should be able to get the contents of a file', async () => {
    const contents = await getFileContent(['README.md'], 'hasura', 'v3-docs');
    expect(contents).toContain('Website');
  });
});
