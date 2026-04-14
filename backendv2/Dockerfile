# ==========================================
# Stage 1: Build dependencies using uv
# ==========================================
FROM python:3.13-slim AS builder

# Install uv from the official Astral image
COPY --from=ghcr.io/astral-sh/uv:0.4 /uv /uvx /bin/

# Environment configurations for builder
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1

WORKDIR /app

# Copy dependency definition files
COPY pyproject.toml ./
COPY uv.lock ./ 

# Create an explicit virtual environment at /opt/venv and install using uv
RUN uv venv /opt/venv && \
    VIRTUAL_ENV=/opt/venv uv pip install -r pyproject.toml --no-cache

# ==========================================
# Stage 2: Final lightweight runner image
# ==========================================
FROM python:3.13-slim

WORKDIR /app

# Environment configurations for the runner
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

# Create a non-root user and group for security
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copy the pre-built virtual environment from Stage 1
COPY --from=builder /opt/venv /opt/venv

# Copy the application code
COPY . /app

# Change ownership of the working directory to the non-root user
RUN chown -R appuser:appgroup /app

# Drop privileges to the non-root user
USER appuser

# Document the port FastAPI runs on
EXPOSE 8000

# Start the application using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]