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
const dotenv_1 = __importDefault(require("dotenv"));
const core = __importStar(require("@actions/core"));
const github_1 = require("./github");
const open_ai_1 = require("./open_ai");
dotenv_1.default.config();
// Our configuration variables using GitHub Actions for production and dotenv for local development
const prNumber = parseInt(core.getInput('PR_NUMBER') || process.env.PR_NUMBER);
const org = core.getInput('GITHUB_ORG') || process.env.GITHUB_ORG;
const repo = core.getInput('GITHUB_REPOSITORY') || process.env.GITHUB_REPOSITORY;
async function main() {
    const PR = await (0, github_1.getSinglePR)(org, repo, prNumber);
    const assertion = await (0, github_1.getAssertion)(PR?.body ?? '');
    if (assertion?.length === 0 || assertion === null) {
        console.log('No assertion found');
        core.setFailed('No assertion found');
        return;
    }
    else {
        const diff = await (0, github_1.getDiff)(prNumber);
        const changedFiles = (0, github_1.getChangedFiles)(diff);
        const file = await (0, github_1.getFileContent)(changedFiles);
        const prompt = (0, open_ai_1.generatePrompt)(diff, assertion, file);
        const rawAnalysis = await (0, open_ai_1.testAssertion)(prompt);
        const analysis = (0, open_ai_1.writeAnalysis)(rawAnalysis?.toString() ?? '');
        console.log(analysis);
        core.setOutput('analysis', analysis);
        return analysis;
    }
}
main();
