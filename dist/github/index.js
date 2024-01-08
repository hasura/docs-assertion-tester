"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileContent = exports.getChangedFiles = exports.getDiff = exports.getAssertion = exports.getSinglePR = exports.getPullRequests = exports.getRepo = exports.testConnection = exports.github = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const core = __importStar(require("@actions/core"));
const rest_1 = require("@octokit/rest");
dotenv_1.default.config();
const token = core.getInput('GITHUB_TOKEN') || process.env.GITHUB_TOKEN;
exports.github = new rest_1.Octokit({
    auth: token,
});
// We'll use this to test a connection to GitHub
const testConnection = async () => {
    try {
        const { data } = await exports.github.repos.listForAuthenticatedUser();
        console.log(`🚀 Connection to GH established`);
        return true;
    }
    catch (error) {
        console.error(error);
        return false;
    }
};
exports.testConnection = testConnection;
// If we can get a connection, we can get access to a repo, or we'll return null because
const getRepo = async (owner, repo) => {
    try {
        const { data } = await exports.github.repos.get({ owner, repo });
        console.log(`🐕 Fetched the repo`);
        return data;
    }
    catch (error) {
        console.error(error);
        return null;
    }
};
exports.getRepo = getRepo;
// If we can get a repo, we can get all the PRs associated with it
const getPullRequests = async (owner, repo) => {
    try {
        const { data } = await exports.github.pulls.list({ owner, repo });
        console.log(`🐕 Fetched all PRs`);
        return data;
    }
    catch (error) {
        console.error(error);
        return null;
    }
};
exports.getPullRequests = getPullRequests;
// We should be able to get a PR by its number
const getSinglePR = async (owner, repo, prNumber) => {
    try {
        const { data } = await exports.github.pulls.get({ owner, repo, pull_number: prNumber });
        console.log(`✅ Got PR #${prNumber}`);
        return data;
    }
    catch (error) {
        console.error(error);
        return null;
    }
};
exports.getSinglePR = getSinglePR;
// If we can get a PR, we can parse the description and isolate the assertion using the comments
const getAssertion = async (description) => {
    //   find everything in between <!-- DX:Assertion-start --> and <!-- DX:Assertion-end -->
    const regex = /<!-- DX:Assertion-start -->([\s\S]*?)<!-- DX:Assertion-end -->/g;
    const assertion = regex.exec(description);
    if (assertion) {
        console.log(`✅ Got assertion: ${assertion[1]}`);
        return assertion[1];
    }
    return null;
};
exports.getAssertion = getAssertion;
// If we have a diff_url we can get the diff
const getDiff = async (prNumber) => {
    const { data: diff } = await exports.github.pulls.get({
        owner: 'hasura',
        repo: 'v3-docs',
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
exports.getDiff = getDiff;
// If we have the diff, we can determine which files were changed
const getChangedFiles = (diff) => {
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
exports.getChangedFiles = getChangedFiles;
// We'll also need to get the whole file using the files changed from
async function getFileContent(path) {
    let content = '';
    // loop over the array of files
    for (let i = 0; i < path.length; i++) {
        // get the file content
        const { data } = await exports.github.repos.getContent({
            owner: 'hasura',
            repo: 'v3-docs',
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
exports.getFileContent = getFileContent;
