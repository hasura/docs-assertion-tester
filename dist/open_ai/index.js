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
exports.writeAnalysis = exports.testAssertion = exports.testConnection = exports.generatePrompt = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const core = __importStar(require("@actions/core"));
const openAi = require('openai');
dotenv_1.default.config();
const api_key = core.getInput('OPENAI_API_KEY') || process.env.OPENAI_API_KEY;
const openai = new openAi({
    apiKey: api_key,
});
// This wil generate our prompt using the diff, assertion, and whole file
const generatePrompt = (diff, assertion, file) => {
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
exports.generatePrompt = generatePrompt;
// Just like our GitHub module, we'll test the connection to OpenAI
const testConnection = async () => {
    try {
        const { data } = await openai.files.list();
        return true;
    }
    catch (error) {
        console.error(error);
        return false;
    }
};
exports.testConnection = testConnection;
// Then, we'll create a function that takes in the diff, the author's assertion(s), and the prompt,
// and returns the analysis from OpenAI
const testAssertion = async (prompt) => {
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
        const parsedAnalysis = JSON.parse(analysis);
        return parsedAnalysis;
    }
    catch (error) {
        console.error(error);
        return null;
    }
};
exports.testAssertion = testAssertion;
// We decided to send things back as JSON so we can manipulate the data in the response we'll be sending back to GitHub
const writeAnalysis = (analysis) => {
    if (analysis === null) {
        return `Error testing the assertions. Check the logs.`;
    }
    else {
        let message = `## DX: Assertion Testing\n\n`;
        const feedback = analysis.feedback.map((item) => {
            // we'll create some markdown to make the feedback look nice
            return `### ${item.satisfied} ${item.scope}\n\n${item.feedback}\n\n`;
        });
        feedback.unshift(message);
        const feedbackString = feedback.join('');
        return feedbackString;
    }
};
exports.writeAnalysis = writeAnalysis;
