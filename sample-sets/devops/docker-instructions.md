# Docker and Containerization Instructions

Best practices for containerizing applications:

## Dockerfile Best Practices
- Use multi-stage builds to reduce image size
- Use specific version tags, avoid 'latest'
- Run containers as non-root user
- Use .dockerignore to exclude unnecessary files

Example multi-stage Dockerfile:
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
WORKDIR /app
COPY --from=builder --chown=nextjs:nodejs /app ./
USER nextjs
EXPOSE 3000
CMD ["npm", "start"]
```

## Container Security
- Scan images for vulnerabilities
- Use distroless or minimal base images
- Keep images updated
- Implement proper secrets management

## Orchestration
- Use Docker Compose for local development
- Implement health checks for containers
- Set resource limits (CPU, memory)
- Use persistent volumes for data storage
