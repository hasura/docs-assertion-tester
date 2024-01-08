# Docs Assertion Tester

Do you love unit tests for your code? Do you wish you could write unit tests for your documentation? Well, now you can!

<!-- TODO: Add gif -->

## Prerequisites

- An OpenAI API key
- A GitHub token with `repo` scope

We recommend storing these in GitHub secrets. You can find instructions on how to do that
[here](https://docs.github.com/en/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository).

## Installation

In any workflow for PRs, add the following step:

```yaml
 - name: Docs Assertion Tester
    id: docs_test
    uses: hasura/docs-assertion-tester@v1.0.0
    with:
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      GITHUB_TOKEN: ${{ secrets.TOKEN }}
      GITHUB_ORG: ${{ github.repository_owner }}
      GITHUB_REPOSITORY: ${{ github.repository }}
      PR_NUMBER: ${{ github.event.number }}
```

## Usage

In the description of any PR, add the following comments:

```html
<!-- DX:Assertion-start -->
<!-- DX:Assertion-end -->
```

Then, between the start and end comments, add your assertions in the following format:

```html
<!-- DX:Assertion-start -->
A user should be able to easily add a comment to their PR's description.
<!-- DX:Assertion-end -->
```

The assertion tester will then run your assertions against the documentation in your PR's description. It will check
over two scopes:

- `Diff`
- `Integrated`

The `Diff` scope will check the assertions against the diff (i.e., only what the author contributed). The `Integrated`
scope will check the assertions against the entire set of files changed, including the author's changes.

Upon completion, the assertion tester will output the analysis in markdown format. You can add a comment to your PR
using our handy [GitHub Action](https://github.com/marketplace/actions/comment-progress).

Using our `comment-progress` action, the output looks like this after running
[the sample workflow](/sample/analyze-and-post.yaml) in the `/sample` folder:

<!-- TODO: Add screenshot -->

## Contributing

Before opening a PR, please create an issue to discuss the proposed change.
