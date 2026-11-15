FROM python:3.12-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies if needed (e.g., for psycopg2 / Pillow)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Start Django on 0.0.0.0:8000 (matches `set $up media-service:8000;` in gateway)
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py init_storage && exec python manage.py runserver 0.0.0.0:8000"]