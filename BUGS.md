# Known Open Bugs and Error Handling Issues

## 1. User-Facing Error Handling

- In some flows, errors (such as failed preference fetch, failed preference save, and failed telemetry submission) were previously only logged to the console and not surfaced to the user. This has now been improved in `app/src/OnboardingWizard.tsx` to show user-facing error messages.

## 2. Centralized Bug Tracking

- This file should be updated with any new bugs or error-handling issues discovered in the project. Please add a description, steps to reproduce, and status for each bug.

## 3. Test Coverage for Error Cases

- Some tests in `app/src/__tests__/OnboardingWizard.test.tsx` simulate API errors and check for error logging, but do not always verify that the user is notified of these errors in the UI. Tests should be updated to check for user-facing error messages.

---

## Template for Reporting Bugs

- **Title:**  
- **Description:**  
- **Steps to Reproduce:**  
- **Expected Result:**  
- **Actual Result:**  
- **Status:** Open/Closed