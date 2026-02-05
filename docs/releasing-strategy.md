# Releasing

This document describes the release process for **CookieCaster**.  
Releases are fully automated and follow a defined workflow to ensure stability, consistency, and traceability.

Before creating a release, please make sure you are familiar with:

- The contribution workflow and branching strategy described in  
  [CONTRIBUTING.md](../CONTRIBUTING.md)
- The CI/CD process used in this project (see [Git Workflow Illustrated](architecture.md))

---

## Releasing a New Version

CookieCaster supports **manual releases** for Release creation.
---

## Manual Releasing

Manual releases are intended for **major changes, important fixes, or new features** that require explicit version control. It should be used always.

### Triggering a Manual Release

To create a manual release, open the [GitHub Action](https://github.com/fhnw-makerverse/cookiecaster/actions/workflows/release_manual.yml) responsible for manual releases.

In the GitHub Action:

1. Enter the version number to be released (for example `3.3.0`).
   - The version must be **greater than the latest existing tag**.
   - The version must **not already exist** as a Git tag.
2. Trigger the workflow.

Once triggered, GitHub Actions will automatically:

- Verify that the provided version does not already exist.
- Verify that the version is greater than the latest released version.
- Update the version in `VERSION.md`.
- Update the version in `package.json`.
- Create a Git tag for the new version.
- Generate or update the changelog.
- Create a GitHub Release.
- Deploy the application to GitHub Pages using the `gh-pages` branch.

> ⚠️ **Important**  
> Do not manually edit `package.json`. Versioning is handled entirely by the CI/CD pipeline.

> ⚠️ **Note**  
> The manual release workflow will only run if the provided version has not already been released.

---
> **Note for Maintainers**
>
> This is deactivated. The release should be controlled. But if the wish is there to automate it, you can enable the action again.

## Automatic Releasing

Automatic releases are designed for **regular, incremental updates**.

A scheduled GitHub Action runs **daily at 19:00 UTC** and performs the following steps:

1. Checks whether new commits have been added since the latest Git tag.
2. If changes are detected:
   - The version is automatically incremented.
   - The version in `VERSION.md` is updated.
   - The version in `package.json` is updated.
   - A new Git tag is created.
   - The changelog is generated or updated.
   - A GitHub Release is created.
   - The application is deployed to GitHub Pages using the `gh-pages` branch.
3. If no new commits are found, no release is created.

---

Thank you for helping release **CookieCaster 3.0**.  
Your contributions ensure a reliable and transparent release process for everyone.
