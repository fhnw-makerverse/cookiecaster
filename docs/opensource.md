# Open Source Project Structure

I looked at some OpenSource Project an looked how there Docs and CI/CDs are built.

# References
Here I my referencing Open Source Projects:
- [Elasticsearch](https://github.com/elastic/elasticsearch)
- [Icinga](https://github.com/Icinga/icinga2/tree/master)
- [AWX](https://github.com/ansible/awx?tab=readme-ov-file)
- [Foreman](https://github.com/theforeman/foreman)

# Findings
## Documentation
- An About Section where the purpose of the Application is explained
- An Overview of the features
- Refrence or Explanation how to install the application or where it runs
- Optional: How to setup for Local Dev
- Test Suite of the Application and how it is tested
- Information how to report Issues or Ideas for the project (Support)
- Information how to contribute to the project and guidelines
- Reference to the application relevant documentations (E.g. Tutorials, technical docs, API Reference....)
- Optional: Code of Conduct
- Information about the licensing
- Information how to handle security issues
- ReadMe: Contains Code Coverage Badge, Badge of latest Pipeline run in devel (Application Build)
- Changelog

## Contribute.md
- Explains how to contribute to the project
- Branching Structure
- Describes how the Application is tested (With CI/CD and local)
- Describes CI/CD
- Defines Rules (Commit Messages, Unit Tests)
- Defines Style Rules
- How to extend API doc
- Tips for Coding
- Requirements
- Logging
- Describes how to create Pull Requests and what happens and how to Review
- Code Owners File

## CI/CD
- Mostly triggered when Pull Requests are created
- Unit Test testing, Style Lint Check, Build test (Always on PR creation to development and main)
- Renovate or DepBot Pipeline for autofixing security issues
- Cod Cov Metric creation on PR to dev and main (CodCov external service)
- Releasing is done manually or by pipeline
- Artifacts in Code Coverage Jobs and Build Jobs

# Add to our Doc
- Explanation about testing
- Document how to Test and how to handle Unit Test (Create when creating new features)
- Defining Style and Checks
- Define Support Section (Report Issues and Ideas)
- Define License
- Document Local Development
- Requirements
- About, Installation, Feature Section
- How to handle security
- Add Build & Deploy Pipeline Badge
- Add latest Tag badge
- API doc / Function Documentation
- How to style commit messages
