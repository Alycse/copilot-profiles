# Code Review Instructions

Guidelines for conducting effective code reviews:

## Review Checklist
- **Functionality**: Does the code do what it's supposed to do?
- **Readability**: Is the code easy to understand and maintain?
- **Performance**: Are there any obvious performance issues?
- **Security**: Are there any security vulnerabilities?
- **Testing**: Are there adequate tests covering the changes?

## Code Quality Standards
- Follow established coding conventions and style guides
- Check for proper error handling and edge cases
- Ensure code is DRY (Don't Repeat Yourself)
- Look for SOLID principles adherence
- Verify proper logging and monitoring

## Review Process
1. **Understand the Context**
   - Read the PR description and linked issues
   - Understand the business requirements
   - Check if the approach aligns with architecture

2. **Review Implementation**
```javascript
// Good: Clear, readable code
function calculateTotalPrice(items, taxRate) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * taxRate;
  return subtotal + tax;
}

// Avoid: Unclear variable names and logic
function calc(i, t) {
  return i.reduce((s, x) => s + x.p, 0) * (1 + t);
}
```

## Feedback Guidelines
- Be constructive and specific in comments
- Suggest improvements rather than just pointing out problems
- Acknowledge good practices when you see them
- Focus on the code, not the person
