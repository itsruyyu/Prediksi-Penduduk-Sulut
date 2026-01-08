# LSTM Prediction Web App

This is a Flask web application that uses an LSTM model for predictions. It includes admin and user interfaces.

## Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the app:
   ```
   python app.py
   ```

3. Train the model:
   ```
   python train.py
   ```

## Structure

- `app.py`: Main Flask application
- `train.py`: Script to train the LSTM model
- `utils.py`: Utility functions
- `data/`: CSV files for admin and user data
- `model/`: Trained model and scaler
- `templates/`: HTML templates
- `static/`: CSS, JS, and assets
- `output/`: Prediction results, graphs, exports

## Usage

- Visit `http://localhost:5000/` for the home page
- `/admin` for admin panel
- `/login` for login page

## Troubleshooting

- Ensure all dependencies are installed.
- Check that the model files exist before running predictions.
- For training issues, verify TensorFlow installation.