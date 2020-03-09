# STIG Manager

STIG Manager is software for managing the assessment of Information Systems for compliance with [security checklists](https://public.cyber.mil/stigs/) published by the United States (U.S.) Defense Information Systems Agency (DISA). STIG Manager supports DISA checklists [distributed](https://public.cyber.mil/stigs/downloads/) as either a Security Technical Implementation Guide (STIG) or a Security Requirements Guide (SRG).

Our Project incorporates software developed since 2012 by the [U.S. Naval Undersea Warfare Center Division Newport (NUWCDIVNPT)](https://www.navsea.navy.mil/Home/Warfare-Centers/NUWC-Newport/). Our initial goal is to "modernize" the original software to provide STIG Management services via a REST API that supports a choice of data storage backends.  

Please read our [CONTRIBUTING](CONTRIBUTING.md) document. It explains:
- How you can get involved in the project and contribute
- How to set up a development environment to work with the project's code 

## Status

This repository is under construction as we begin the project. The master branch is likely to be rebased the next couple of days, so we don't recommend cloning at this point. We are editing the initial documentation and preparing the existing codebase for public release. We will also be committing our initial modernized API code to the repository in another few days.

If you want to test out STIG Manager features right away, you can switch to the [Classic branch](https://github.com/NUWCDIVNPT/stig-manager/tree/classic) and read how to do that. Please note: The Classic codebase uses technologies we have abandoned. However, it will be provided as a reference until our new API achieves parity with it.

All additions to the Project will be directed towards a stable production release of the software in accordance with our [Roadmap](docs/roadmap.md).

## Roadmap

We will have a [Roadmap](docs/roadmap.md) document. It will include:
- The Project's history and objectives
- A feature summary
- The timeline for Project milestones
