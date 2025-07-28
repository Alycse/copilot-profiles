# Azure DevOps Instructions

Guidelines for working with Azure DevOps pipelines and processes:

## Pipeline Configuration
- Use YAML pipelines over classic pipelines
- Implement multi-stage pipelines (Build → Test → Deploy)
- Use pipeline templates for reusability across projects

## Build Stage
```yaml
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
- script: npm ci
  displayName: 'Install dependencies'
- script: npm run build
  displayName: 'Build application'
- script: npm test -- --coverage
  displayName: 'Run tests'
```

## Deployment Strategy
- Use Blue-Green or Canary deployments for production
- Implement approval gates for production deployments
- Use deployment slots for zero-downtime deployments

## Security and Compliance
- Store secrets in Azure Key Vault
- Use managed identities instead of service principals where possible
- Implement branch protection policies
- Require pull request reviews

## Monitoring and Alerts
- Set up Application Insights for monitoring
- Configure alerts for deployment failures
- Implement health checks for deployed applications
