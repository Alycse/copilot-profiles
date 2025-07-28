# Unit Test Generation Instructions

When generating unit tests, follow these guidelines:

## Test Framework Preferences
- Use Jest for JavaScript/TypeScript projects
- Use pytest for Python projects
- Use NUnit for C# projects

## Test Structure
- Arrange: Set up test data and dependencies
- Act: Execute the function/method being tested
- Assert: Verify the expected outcome

## Coverage Requirements
- Aim for at least 80% code coverage
- Test happy path scenarios
- Test edge cases and error conditions
- Test boundary values

## Naming Conventions
- Use descriptive test names that explain what is being tested
- Format: `should_[expected_behavior]_when_[condition]`
- Example: `should_return_empty_array_when_no_items_found`

## Mock and Stub Guidelines
- Mock external dependencies
- Use dependency injection where possible
- Stub time-dependent functions for consistent results
