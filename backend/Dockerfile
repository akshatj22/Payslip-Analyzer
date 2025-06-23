# Build stage (for installing dependencies)
FROM python:3.11-slim AS build
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Runtime stage (for running the app)
FROM python:3.11-slim
WORKDIR /app

# Copy installed Python packages from build stage
COPY --from=build /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Copy your application code
COPY . .

# If your main Flask file is called app.py, use this CMD
CMD ["python", "app.py"]
