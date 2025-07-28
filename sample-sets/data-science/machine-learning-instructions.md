# Machine Learning Instructions

Guidelines for machine learning model development:

## Model Development Process
1. **Data Collection & Preparation**
   - Ensure data quality and representativeness
   - Split data into train/validation/test sets (70/15/15)
   - Feature engineering and selection

2. **Model Selection**
   - Start with simple baselines
   - Try multiple algorithms (linear, tree-based, neural networks)
   - Use cross-validation for model comparison

3. **Model Training**
```python
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier

# Example model training with cross-validation
model = RandomForestClassifier(n_estimators=100, random_state=42)
scores = cross_val_score(model, X_train, y_train, cv=5)
print(f"CV Score: {scores.mean():.3f} (+/- {scores.std() * 2:.3f})")
```

## Model Evaluation
- Use appropriate metrics for the problem type:
  - Classification: accuracy, precision, recall, F1-score, AUC-ROC
  - Regression: MAE, MSE, RMSE, R²
- Always evaluate on unseen test data
- Check for overfitting and underfitting

## Model Deployment
- Implement model versioning
- Set up monitoring for model drift
- Create prediction APIs with proper error handling
- Document model assumptions and limitations
