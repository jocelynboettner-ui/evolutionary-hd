FROM python:3.12-slim

WORKDIR /app

# Install system deps needed for pyswisseph build
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Download Swiss Ephemeris data files at build time (covers 1800-2400 AD)
# --fail: error on HTTP failures (won't silently write HTML error pages)
# -L: follow redirects
# --retry 3: retry on transient failures
# Tries astro.com first, falls back to GitHub mirror
RUN mkdir -p /app/ephe

# seas_18.se1 — asteroid/Chiron data (most critical for Chiron return calc)
RUN curl --fail -L --retry 3 --retry-delay 2 -s \
      https://www.astro.com/ftp/swisseph/ephe/seas_18.se1 -o /app/ephe/seas_18.se1 || \
    curl --fail -L --retry 3 -s \
      https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/seas_18.se1 -o /app/ephe/seas_18.se1

# sepl_18.se1 — planets data
RUN curl --fail -L --retry 3 --retry-delay 2 -s \
      https://www.astro.com/ftp/swisseph/ephe/sepl_18.se1 -o /app/ephe/sepl_18.se1 || \
    curl --fail -L --retry 3 -s \
      https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/sepl_18.se1 -o /app/ephe/sepl_18.se1

# semo_18.se1 — Moon data
RUN curl --fail -L --retry 3 --retry-delay 2 -s \
      https://www.astro.com/ftp/swisseph/ephe/semo_18.se1 -o /app/ephe/semo_18.se1 || \
    curl --fail -L --retry 3 -s \
      https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/semo_18.se1 -o /app/ephe/semo_18.se1

# Verify files are real .se1 binaries (>100KB — HTML error pages are <10KB)
# seas_18.se1 ~223KB, sepl_18.se1 ~484KB, semo_18.se1 ~1.3MB
RUN python3 -c "import os,sys; files=['seas_18.se1','sepl_18.se1','semo_18.se1']; [print(f+': '+str(os.path.getsize('/app/ephe/'+f))+' bytes') for f in files]; sys.exit(1) if any(os.path.getsize('/app/ephe/'+f) < 100000 for f in files) else print('All ephemeris files OK')"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .
COPY transit_activations.py .

ENV EPHE_PATH=/app/ephe

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
