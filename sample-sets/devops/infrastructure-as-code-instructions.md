# Infrastructure as Code Instructions

Guidelines for managing infrastructure with code:

## Terraform Best Practices
- Use remote state storage (Azure Storage, AWS S3)
- Implement state locking to prevent conflicts
- Use modules for reusable infrastructure components
- Follow naming conventions for resources

## Resource Organization
```hcl
# Example Terraform structure
resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-${var.environment}-rg"
  location = var.location
  
  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}
```

## Security
- Use Azure Key Vault for secrets
- Implement least privilege access
- Enable diagnostic logging for all resources
- Use private endpoints where applicable

## Cost Management
- Implement resource tagging strategy
- Use appropriate SKUs for environment (dev vs prod)
- Set up cost alerts and budgets
- Regularly review and optimize resource usage
