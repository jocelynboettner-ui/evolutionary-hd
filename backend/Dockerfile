FROM python:3.12-slim

WORKDIR /app

# Install system deps needed for pyswisseph build
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Download Swiss Ephemeris data files (covers 1800-2400 AD)
# Using --fail so curl errors on HTTP error responses (not silently writes HTML)
# Trying astro.com first, then GitHub mirror as fallback
# Verifying each file is a real binary (>100KB) after download
RUN mkdir -p /app/ephe

# seas_18.se1 — asteroid/Chiron data — most critical
RUN curl --fail -L --retry 3 --retry-delay 2 -s \
    https://www.astro.com/ftp/swisseph/ephe/seas_18.se1 \
    -o /app/ephe/seas_18.se1 \
  || curl --fail -L --retry 3 -s \
    https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/seas_18.se1 \
    -o /app/ephe/seas_18.se1

# sepl_18.se1 — planets data
RUN curl --fail -L --retry 3 --retry-delay 2 -s \
    https://www.astro.com/ftp/swisseph/ephe/sepl_18.se1 \
    -o /app/ephe/sepl_18.se1 \
  || curl --fail -L --retry 3 -s \
    https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/sepl_18.se1 \
    -o /app/ephe/sepl_18.se1

# semo_18.se1 — Moon data
RUN curl --fail -L --retry 3 --retry-delay 2 -s \
    https://www.astro.com/ftp/swisseph/ephe/semo_18.se1 \
    -o /app/ephe/semo_18.se1 \
  || curl --fail -L --retry 3 -s \
    https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/semo_18.se1 \
    -o /app/ephe/semo_18.se1

# Verify files are real binaries (each should be >500KB)
RUN python3 -c "
import os
files = ['seas_18.se1', 'sepl_18.se1', 'semo_18.se1']
for f in files:
    path = f'/app/ephe/{f}'
    size = os.path.getsize(path) if os.path.exists(path) else 0
    print(f'{f}: {size} bytes')
    assert size > 500000, f'FAILED: {f} is only {size} bytes — download may have returned an error page'
print('All ephemeris files verified OK')
"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .
COPY transit_activations.py .

ENV EPHE_PATH=/app/ephe

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
