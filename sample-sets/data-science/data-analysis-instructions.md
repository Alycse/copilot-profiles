# Data Analysis Instructions

Guidelines for data analysis and visualization:

## Data Exploration
- Always start with descriptive statistics (mean, median, mode, std dev)
- Check for missing values and outliers
- Understand data types and distributions
- Create initial visualizations to understand patterns

## Data Cleaning
```python
# Example data cleaning steps
import pandas as pd
import numpy as np

# Handle missing values
df['column'].fillna(df['column'].median(), inplace=True)

# Remove outliers using IQR method
Q1 = df['column'].quantile(0.25)
Q3 = df['column'].quantile(0.75)
IQR = Q3 - Q1
df = df[~((df['column'] < (Q1 - 1.5 * IQR)) | (df['column'] > (Q3 + 1.5 * IQR)))]
```

## Visualization Best Practices
- Choose appropriate chart types for data
- Use color strategically and consider colorblind accessibility
- Include clear titles, labels, and legends
- Avoid chartjunk and unnecessary 3D effects

## Statistical Analysis
- Always check assumptions before applying statistical tests
- Use appropriate significance levels (typically α = 0.05)
- Report effect sizes along with p-values
- Consider multiple testing corrections when needed
