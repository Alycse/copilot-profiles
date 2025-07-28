# API Design Instructions

Follow these principles when designing or reviewing APIs:

## RESTful Design
- Use appropriate HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Use meaningful resource names (nouns, not verbs)
- Implement proper status codes (200, 201, 400, 404, 500, etc.)

## Request/Response Format
- Use JSON for data exchange
- Include proper Content-Type headers
- Implement consistent error response format:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid input data",
      "details": []
    }
  }
  ```

## Security
- Always validate input data
- Implement rate limiting
- Use HTTPS for all endpoints
- Include proper authentication/authorization

## Documentation
- Use OpenAPI/Swagger for API documentation
- Include example requests and responses
- Document all parameters and their constraints
