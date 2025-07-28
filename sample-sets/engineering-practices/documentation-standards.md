# Documentation Standards

Guidelines for writing effective technical documentation:

## Code Documentation
- Write clear, concise comments for complex logic
- Use JSDoc, Sphinx, or similar tools for API documentation
- Keep comments up-to-date with code changes
- Document why, not just what

```typescript
/**
 * Calculates the compound interest for an investment
 * @param principal - The initial amount invested
 * @param rate - Annual interest rate as a decimal (e.g., 0.05 for 5%)
 * @param time - Number of years
 * @param compoundFrequency - Number of times interest is compounded per year
 * @returns The final amount after compound interest
 */
function calculateCompoundInterest(
  principal: number, 
  rate: number, 
  time: number, 
  compoundFrequency: number = 1
): number {
  return principal * Math.pow(1 + rate / compoundFrequency, compoundFrequency * time);
}
```

## README Files
- Include project description and purpose
- Provide clear installation and setup instructions
- Document API endpoints and usage examples
- Include troubleshooting section
- Add contributing guidelines

## Architecture Documentation
- Document system architecture and component interactions
- Include deployment diagrams
- Explain design decisions and trade-offs
- Maintain decision records (ADRs) for major architectural choices

## User Documentation
- Write from the user's perspective
- Include step-by-step tutorials
- Provide screenshots and examples
- Keep content organized and searchable
