# Stage 1: Build stage with Alpine base
FROM python:3.11-alpine AS builder

# Install build dependencies
RUN apk add --no-cache --virtual .build-deps \
    gcc \
    musl-dev \
    libffi-dev \
    openssl-dev

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install dependencies
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/opt/venv -r requirements.txt

# Remove build dependencies
RUN apk del .build-deps

# Stage 2: Final runtime image
FROM python:3.11-alpine
WORKDIR /app

# Copy virtual environment
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY . .

# Cleanup unnecessary files
RUN find /opt/venv -type d -name '__pycache__' -exec rm -rf {} + \
    && find /opt/venv -name '*.pyc' -delete

# Set entrypoint
CMD ["python", "app.py"]
