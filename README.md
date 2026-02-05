# 🍪 CookieCaster 3.0

![Lines](https://img.shields.io/badge/lines-98.27%25-brightgreen.svg?style=flat) [![pages-build-deployment](https://github.com/fhnw-makerverse/cookiecaster/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/fhnw-makerverse/cookiecaster/actions/workflows/pages/pages-build-deployment)  

CookieCaster 3.0 is a freely available web application that allows users to draw their own personalized cookie cutters in order to print them later with a 3D printer. It provides validation of the cutter shape and recommends suitable print values (such as wall thickness and height) to prevent designs that would be unsuitable or unstable for 3D printing.

- **CookieCaster 3.0**: [fhnw-makerverse.github.io](https://fhnw-makerverse.github.io/cookiecaster/)
- **CookieCaster 3.0 Tutorial**: [fhnw-makerverse.github.io/#/ueber](https://fhnw-makerverse.github.io/cookiecaster/#/ueber)

> **Note for Maintainers**
>
> If you are responsible for maintaining this repository, please make sure to review the
> [Maintainer Instructions](./docs/maintainer.md) and the
> [CONTRIBUTING guide](./CONTRIBUTING.md) before performing releases, merging pull requests,
> or modifying CI/CD-related configurations.

## Diagrams
 
All diagrams are drawn with [draw.io](https://draw.io). You can find the diagrams in `docs/diagrams/diagrams_cookiecaster.drawio.xml`. Import it in draw.io to edit them.


## Features
- Draw personalized cookie cutter shapes directly in the browser

- Upload images (drag & drop) and use them as backgrounds for tracing

- Local gallery to save drafts and finished designs

- Load templates from the gallery into the drawboard

- Export designs in the .cc3 file format and import them later

- Automatic shape validation to prevent invalid or unstable designs

- Print recommendations (wall thickness & cutter height)

- Fully responsive layout (iPad → desktop)

- Runs entirely client-side (no backend required)

## Differences Compared to CookieCaster 2.0

CookieCaster 3.0 is the successor to [CookieCaster 2.0](https://www.cs.technik.fhnw.ch/cookiecaster/)

Key improvements include:
- Migration to React ≥ 19.2.x

- Fully function-based components (no class components)

- Improved and cleaner project structure

- Increased usage of Bootstrap for layout and responsiveness

- Overall responsive design improvements

- CI/CD automation (checks, tests, releases, deployment)

- Simplified and redesigned draw page

- Introduction of the .cc3 file format

- Import/export support for .cc3 files

- No server backend required

- Hosted on GitHub Pages instead of a local server

## Getting started (Local Development)

These steps describe the simplest way to run CookieCaster 3.0 locally for development and contributions.

> **ℹ️ Note**
>
>Run all commands from the root directory of the repository.

### Prerequisites
- Node.js (recommended: latest LTS)
- Yarn

### Install Dependencies

````shell 
yarn install
````

### Start Development Server

````
yarn run dev
````

This starts the local Vite development server, and changes will update automatically in the browser.

## Manual Installation & Deployment
> ⚠️ Normally, deployment is handled automatically by the CI/CD pipeline.
Only use the steps below if the pipeline is unavailable or failing.

### Build the Application
````shell
yarn run build
````
### Deploy to GitHub Pages
````shell
yarn run deploy
````
Once deployed, GitHub Pages will publish the site at: [fhnw-makerverse.github.io](https://fhnw-makerverse.github.io/cookiecaster/)

## File Format (`.cc3`)
CookieCaster 3.0 introduces the .cc3 format, which allows you to:
- Export cookie cutter designs
- Re-import them later
- Share designs with others without losing structure or metadata

For more information see [here](./docs/storage-concept.md)

## Contributing & Releasing
Contributions are very welcome!
Please read the contribution guidelines before getting started:
- [CONTRIBUTING](./CONTRIBUTING.md).

For a step by step instruction look [here](./CONTRIBUTING.md#start-contributing)

## Support & Issues
If you encounter a bug or have a feature request, please open a GitHub Issue.

To help with issue organization, please prefix your issue title with one of the following:

- Feature: Feature request

- Bug: Bug report

- Question: General question

- Test Failure: CI/CD check or test failure

## Licensing
This project is licensed under the MIT License. See the [LICENSE](./LICENSE.txt) file for details.

## Acknowledgements
CookieCaster 3.0 builds upon the original CookieCaster project and continues its goal of making custom 3D-printable cookie cutters accessible to everyone.

Happy baking & printing!
