# Dependency & Documentation Management

## Dependency Updates

- **Frontend (`app/package.json`):**
  - Use `npm install <package>` or `npm uninstall <package>` to add/remove dependencies.
  - After any change, commit the updated `package.json` and `package-lock.json`.
  - Run `npm run lint` and `npm run build` to ensure compatibility.
  - **Note (2025-04-12):** Dependencies have been updated to target versions specified in the PRD (React 19, Tailwind 4, TS 5.7). The upgrade process involves running `npm install` (or equivalent), consulting migration guides, and fixing any resulting errors/warnings.

- **Backend (`backend/requirements.txt`):**
  - Use `pip install <package>` and then `pip freeze > requirements.txt` to update dependencies.
  - After any change, commit the updated `requirements.txt`.
  - Run backend tests to ensure compatibility.
  - **Note (2025-04-12):** Dependencies are now pinned to specific versions in `requirements.txt` for stability.

## Documentation Updates

- **PRD (`docs/PRD.md`):**
  - Update whenever features, requirements, or architecture change.
  - Log all major changes in the "Change Log" section.

- **Rules (`docs/PROJECT_RULES.md`):**
  - Update as coding standards or contribution guidelines evolve.

- **Other Docs:**
  - Add or update markdown files in `/docs` for new features, APIs, or onboarding guides.

## Best Practices

- Always update documentation and dependencies as part of the same pull request as code changes.
- Reviewers should confirm that documentation and dependency files are up to date before merging.
- Use clear commit messages referencing the documentation or dependency updates.
