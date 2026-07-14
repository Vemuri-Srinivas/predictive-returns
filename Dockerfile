FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy model artifacts and API
COPY model/model.pkl ./model/model.pkl
COPY model/encoders.pkl ./model/encoders.pkl
COPY api/app.py ./api/app.py

# AI Core expects the server on port 9001
EXPOSE 9001

CMD ["uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "9001"]
