"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.github = void 0;
const rest_1 = require("@octokit/rest");
exports.github = new rest_1.Octokit({
    auth: process.env.GITHUB_TOKEN,
});
console.log(exports.github);
