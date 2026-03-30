FROM python:3.12-slim

WORKDIR /app

# Install system deps needed for pyswisseph build
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Download Swiss Ephemeris data files (covers 1800-2400 AD)
# Optional: falls back to Moshier accuracy if download fails
RUN mkdir -p /app/ephe && \
    curl -s https://www.astro.com/ftp/swisseph/ephe/seas_18.se1 -o /app/ephe/seas_18.se1 || true && \
    curl -s https://www.astro.com/ftp/swisseph/ephe/sepl_18.se1 -o /app/ephe/sepl_18.se1 || true && \
    curl -s https://www.astro.com/ftp/swisseph/ephe/semo_18.se1 -o /app/ephe/semo_18.se1 || true

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

ENV EPHE_PATH=/app/ephe

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
