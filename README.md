# STIG Manager

STIG Manager is an API and Web client for managing the assessment of Information Systems for compliance with [security checklists](https://public.cyber.mil/stigs/) published by the United States (U.S.) Defense Information Systems Agency (DISA). STIG Manager supports DISA checklists [distributed](https://public.cyber.mil/stigs/downloads/) as either a Security Technical Implementation Guide (STIG) or a Security Requirements Guide (SRG).

Our Project incorporates software developed since 2012 by the [U.S. Naval Undersea Warfare Center Division Newport (NUWCDIVNPT)](https://www.navsea.navy.mil/Home/Warfare-Centers/NUWC-Newport/). Our initial goal is to modernize the original software, available as [STIG Manager Classic](https://github.com/NUWCDIVNPT/stig-manager/tree/classic) (see below), to provide services via a REST API that supports a choice of data storage backends.  

Please read our [CONTRIBUTING](CONTRIBUTING.md) document. It explains:
- How you can get involved in the project and contribute
- How to set up a development environment to work with the project's code 

## Status

This repository is receiving several commits each day as we begin the project.
- Our original code is available in the [`classic` branch](https://github.com/NUWCDIVNPT/stig-manager/tree/classic)

- We will be committing modernized API code to the `master` branch shortly

## STIG Manager Classic for Docker

We encourage you to [checkout the Classic branch](https://github.com/NUWCDIVNPT/stig-manager/tree/classic) and run a demonstration of STIG Manager Classic. Although STIG Manager Classic uses deprecated technologies, it is useful as a reference until our new API achieves parity.

## Roadmap

All new contributions to the Project will be directed towards stable production releases of the software in accordance with our [Roadmap](docs/roadmap.md).
