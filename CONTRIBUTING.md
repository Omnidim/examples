# Contributing

Thank you for improving the OmniDimension examples.

## Run and check an example

Examples are intentionally independent. Change into the directory you want to
run and follow its README. TypeScript examples use npm. Python examples use
Python 3.10 or later and can run in a virtual environment.

Before opening a pull request, run the checks listed in the example you
changed. Continuous integration runs the repository-wide smoke checks.

## Before you open a pull request

- Keep the example focused on one integration pattern.
- Include a local fixture or mock so reviewers can run it without credentials.
- Put credentials only in `.env` files. Commit `.env.example` with placeholder
  values instead.
- Add or update the README with setup, test, cleanup, and documentation links.
- If your pull request adds an executable example or test source file, add this
  repository header at the top:

  ```text
  Copyright (c) 2026 OmniDimension
  SPDX-License-Identifier: MIT
  Part of https://github.com/Omnidim/examples
  ```

- Do not include call recordings, personal information, account identifiers, or
  internal service URLs.

## Issue reports

Use GitHub Issues for reproducible bugs. Include the example directory, the
command you ran, the expected result, and the actual result. Remove secrets
from logs before posting.

## Questions and sharing builds

Ask implementation questions or share a project variation in the
[OmniDimension Discord community](https://discord.gg/kdjzykMTHJ).
