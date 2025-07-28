# Database Design Instructions

Guidelines for designing efficient and scalable databases:

## Schema Design Principles
- Follow normalization rules to reduce redundancy
- Use appropriate data types for columns
- Implement proper constraints (PRIMARY KEY, FOREIGN KEY, CHECK)
- Design for query patterns, not just data storage

## Index Strategy
```sql
-- Example index creation
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_order_date_user ON orders(order_date, user_id);

-- Composite index for common query patterns
CREATE INDEX idx_product_category_price ON products(category_id, price);
```

## Performance Optimization
- Use EXPLAIN/EXPLAIN PLAN to analyze query execution
- Avoid SELECT * in production code
- Use appropriate JOIN types
- Consider partitioning for large tables
- Implement connection pooling

## Security
- Use parameterized queries to prevent SQL injection
- Implement least privilege access
- Encrypt sensitive data at rest and in transit
- Regular security audits and updates

## Backup and Recovery
- Implement automated backup strategies
- Test restore procedures regularly
- Use point-in-time recovery for critical systems
- Document recovery procedures
