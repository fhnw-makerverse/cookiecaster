# Contributing to CookieCaster 3.0

CookieCaster 3.0 is an open-source project and thrives on community involvement. Contributions of all kinds are welcome — whether you’re improving documentation, reporting bugs, suggesting new features, or writing code.

This guide explains **how to contribute**, **how branching works**, and **how releases are handled**, so that contributions stay consistent and easy to review.

---

## Table of Contents

- [Introduction](#introduction)
- [Branching Concept](#branching-concept)
  - [Important Branches](#important-branches)
  - [Branch Naming](#branch-naming)
- [Start Contributing](#start-contributing)
  - [Forking](#forking)
  - [Start Branch](#start-branch)
  - [Commit Notes](#commit-notes)
  - [Create Pull Request](#create-pull-request)
  - [Rebase a Branch](#rebase-a-branch)
  - [Testing your Code](#testing-your-code)
- [CI/CD](#cicd)
  - [Developing](#developing)
  - [Releasing](#releasing)
- [How to Review](#how-to-review)
- [Merging to Main](#merging-to-main)
- [React Projet Structure](#react-project-structure)
  - [Directory Structure](#directory-structure)
  - [React Components Structure](#react-components-structure)
- [Commits](#commits)
- [Pull Requests](#pull-requests)
- [Testing](#testing)

---

## Introduction

To keep CookieCaster 3.0 maintainable and stable, this project follows a clear branching and release strategy.  
All contributors are expected to follow this concept to ensure clean pull requests and predictable releases.

Before you start working on something new, please:

- Check the [open issues](https://github.com/fhnw-makerverse/cookiecaster/issues)

### Contribution Workflow (High-Level)

1. Fork this repository to your profile/organization with all repositories included
2. Create a branch from `main`
3. Implement your changes
4. Write tests if you add new functionality
5. Commit with clear, descriptive messages
6. Open a pull request back to this project in the `main` Branch
7. Notify makerverse.windisch@fhnw.ch by email with a link to your pull request
8. Address review feedback if needed

---

## Branching Concept

### Important Branches

#### `main`
- Contains **production-ready code**
- Runs on **GitHub Pages**
- Only updated via merges from `forks` of this repository

#### `gh-pages`
- Contains only the generated files required for GitHub Pages
- Automatically updated via CI/CD
- ❌ No manual changes allowed
- Generated using `yarn deploy`

---

### Branch Naming

All contribution branches must be created **from the `main` branch** in your fork and follow this naming convention:

| Branch Prefix   | Purpose                               | Example                  |
|-----------------|----------------------------------------|--------------------------|
| `feature/*`     | New features                           | `feature/share`          |
| `fix/*`         | Bug fixes                              | `fix/drawing-curves`     |
| `docs/*`        | Documentation changes                  | `docs/metrics`           |
| `chore/*`       | Maintenance or CI/CD changes           | `chore/add-ci-tests`     |

Following this convention helps clearly communicate the purpose of a branch and, when applicable, link it to a specific bug or feature. Each branch should focus on a single concern only, such as fixing one bug or implementing one feature.

---

## Start Contributing

### Forking

[Fork the project](https://docs.github.com/de/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo) to your GitHub account and clone the repository.  
Cloning the `main` branch is sufficient.

```shell
git clone git@github.com:aldizeci/cookiecaster.git
cd cookiecaster
```

Add a new remote `upstream` with this repository as value.
```shell
git remote add upstream https://github.com/fhnw-makerverse/cookiecaster.git
```

You can now pull updates from the upstream repository into your local `main` branch:

```shell
git fetch --all
git pull upstream HEAD
```

Please continue to learn about [branches](#branching-concept).

### Start Branch
Create a new branch from `main` using the appropriate naming convention:

```shell
git checkout -b feature/sharing-feature
```

Implement your changes for the CookieCaster project on this branch.
You can now work on your feature, fix, or documentation update in this branch.

To start the local development server:

```shell
yarn run dev
```

### Commit Notes

See [Commits](#commits) commit message guidelines.

### Create Pull Request

Before opening a pull request, update your local main branch and rebase your feature branch on top of it.

```shell
git checkout main
git pull upstream HEAD

git switch feature/sharing-feature
git rebase main
```

After resolving any conflicts, push the branch to your fork.
Note that force-pushing may be required after rebasing—use with care.

**New branch on the remote:**
```shell
git push --set-upstream origin feature/sharing-feature
```

**Existing branch on the remote:**
```shell
git push -f origin feature/sharing-feature
```

Nagivate to your GitHub repository and create a PR there.

The pull request should have a clear, descriptive title and reference any related issues (e.g. Fixes #123) if applicable. This allows issues to be closed automatically once the pull request is merge.

See details [here](#pull-requests)

### Rebase a Branch

If your pull request is not based on the latest upstream `main`, you may be asked to rebase it.

First, update your local `main` branch:

```bash
git checkout main
git fetch --all
git pull upstream HEAD
```

Then rebase your working branch on top of `main`:

```bash
git checkout feature/sharing-feature
git rebase main
```

If conflicts occur, Git will pause the rebase and indicate the affected files.

```
git status

  both modified: path/to/conflict.jsx
```

Edit the file(s), resolve the conflicts (search for `>>>` markers), then continue the rebase:

```bash
git add path/to/conflict.jsx
git rebase --continue
```

After a successful rebase, push the updated history to your fork:

```bash
git push -f origin feature/sharing-feature
```

If you prefer a safer approach, perform the rebase on a temporary backup branch and replace your working branch afterward:

```bash
git checkout feature/sharing-feature
git checkout -b feature/sharing-feature-rebase

git rebase main

git branch -D feature/sharing-feature
git checkout -b feature/sharing-feature

git push -f origin feature/sharing-feature
```

### Testing Your Code

Verify that your changes do not break existing functionality by running the test suite:

```shell
npm run test
```

Please add or update tests as needed.
A minimum code coverage of **80%** is required. See [Testing](#testing) for details.

---

## CI/CD

CookieCaster uses GitHub Actions to ensure code quality and stability.

[Git Workflow Illustrated](docs/architecture.md)

### Developing

For every pull request targeting `main` in the upstream, the following automated checks are executed:

- All tests are executed
- Code style and quality checks run
- Coverage reports are generated
- Coverage badges are updated in the README

❗ A pull request can only be merged if **all checks are green**.

---

### Releasing

Here is a more [detailed](docs/releasing-strategy.md) version of the releasing. 

The release process is fully automated using CI/CD.

#### Manual Releasing

To create a release with a specific version number, a dedicated [GitHub Action](https://github.com/fhnw-makerverse/cookiecaster/actions/workflows/release_manual.yml) can be triggered manually.  
You only need to provide the version number, which must be greater than the latest existing tag and must not already exist. This process should be used for releases that include significant fixes or new features.

The following steps are performed automatically:

- Verify that the specified Git tag does not already exist.
- Verify that the provided version number is greater than the latest release.
- Update the version in `package.json` and `VERSION.md`.
- Create a new Git tag and the corresponding GitHub Release.
- Deploy GitHub Pages automatically when changes are present.


#### Automated Release Process (Disabled)

> **Note for Maintainers**
>
> This is disabled, because a Release should always be controlled. Only acitvate if you want uncontrolled Releases.

If no release is triggered manually, the system automatically checks for new commits since the latest tag and creates a **minor release** if changes are detected.  
For larger or breaking changes, please trigger a manual release as described in [Manual Releasing](#manual-releasing).

1. The release pipeline runs daily at **19:00**.
2. The pipeline checks whether new commits have been added since the latest Git tag.
3. If changes are detected:
   - The version is updated in `package.json` and `VERSION.md`.
   - A new Git tag and a corresponding GitHub Release are created automatically.
4. GitHub Pages are deployed automatically when changes are present.

---

## How to Review

Before merging a pull request, reviewers should:

- Ensure all CI pipelines are green
- Ensure proper Unit Tests are written
- Ensure Code Coverage is `>= 80%` with `npm run test`
- Clone the branch locally
- Run `yarn run dev`
- Verify the application works as expected
- Check adherence to the branching concept
- Review commit messages for clear changelog entries

If all checks pass, the pull request may be merged.

---

## Merging to Main

### `fork` → `main`

- Only merges from a fork into `main` are permitted.
- The release process is handled automatically and runs on a scheduled basis (daily).
- Changes to `VERSION.md` are **not required** for automated releases.


---

## React Project Structure

This section explains how the React project is structured. Understanding this layout will help you quickly find the right place to implement features, fixes, or documentation changes.

---

### Directory Structure

The following structure applies to the `src` directory:

| Path | Purpose |
|------|--------|
| `business-logic` | Core JavaScript logic providing functional behavior |
| `business-logic/graph-operations` | Functions related to drawing and graph operations |
| `business-logic/handlers` | Handlers for cutter forms |
| `business-logic/mesh-operations` | Functions related to mesh processing |
| `business-logic/modes` | All drawing modes |
| `business-logic/services` | Shared services (e.g. validation) |
| `entities` | Entity classes |
| `entities/graph` | Entities related to graph / drawboard |
| `entities/mesh` | Entities related to mesh handling |
| `templates` | Templates shown in the gallery |
| `translations` | German and English translation dictionaries |
| `ui` | All React UI and frontend-related code |
| `ui/components` | Shared components used across multiple pages |
| `ui/pages` | Page-specific components and hooks |
| `utils` | Utility scripts (e.g. file import/export) |

---

### React Components Structure

The following diagram illustrates how components inside the `ui` folder are organized:

![Project structure](docs/images/project_structure.png)

**Guidelines:**

- Each page inside `ui/pages` has its own directory
- The main page component, which composes and orchestrates all page-specific subcomponents, is located at the root of each directory inside `ui/pages`
- Page-specific components are stored in a `components` subfolder
- Page-specific hooks are stored in a `hooks` subfolder
- Reusable components shared across multiple pages belong in `ui/components`
- Application routing is defined in `App.jsx`
- When adding a new page, the corresponding route must be registered in `App.jsx`
- Hash-based routing is used to ensure compatibility with GitHub Pages
- Optionally, the new page may be linked from the navigation bar

---

## Commits

When your work is complete, commit your changes with clear and meaningful commit messages.

A good commit message includes:
- A short summary line
- An optional detailed description
- A reference to the related issue

**Example: Fix**
````
Fix flickering checkbox

On screen sizes around 760x760 the checkbox flickered continuously.

refs #4567
````

**Example: Feature**
````
Add share feature

Users can now share cut-outs via WhatsApp.
Requires JS library XY.

refs #4568
````

Multiple commits during development are allowed and encouraged.
Clear commit messages are essential, as they are used to generate the changelog.

---

## Pull Requests

Once your work is finished:
1. Push your branch to GitHub
2. Open a pull request targeting the development branch
3. Select a reviewer
4. Notify makerverse.windisch@fhnw.ch by email with a link to your pull request
5. Address all review comments and requested improvements

Pull requests are reviewed according to
[How to Review](./CONTRIBUTING.md#pull-requests)

After merging, your changes will be included in the next release.
See [Releasing](./CONTRIBUTING.md#releasing) for details.

---

## Testing

All new features and fixes **must include appropriate Jest tests**.

**Requirements**:
- Code coverage must remain between 80% and 100%
- Pull requests without tests will be declined
- Pull requests that reduce coverage below 80% will be declined

On every pull request:
- Code coverage is calculated automatically
- The README of the source branch is updated with a lines coverage badge

You can find existing tests in the `test` directory for reference.

Helpful resources:
- Existing test cases in the repository
- LLM assistance (optional)
- [Jest Documentation](https://jestjs.io/docs/getting-started) to write your test cases

Feel free to update existing test cases if you think they are not correct. Just write in the commit message why you did it. 

---

Thank you for contributing to CookieCaster 3.0 🚀  
Your help makes the project better for everyone.
