FROM python:3.12-slim

# Prevents Python from writing .pyc files and buffers
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# The previous error was due to a local proxy (127.0.0.1:10808) refusing connections.
# This happens when your Windows proxy settings are inherited by Docker but the proxy app is closed.
# We will use reliable Iranian mirrors to bypass international network issues.
RUN echo "Acquire::Check-Valid-Until \"false\";" > /etc/apt/apt.conf.d/99ignore-valid-until && \
    sed -i 's/deb.debian.org/mirror.iranserver.com/g' /etc/apt/sources.list.d/debian.sources || \
    sed -i 's/deb.debian.org/mirror.iranserver.com/g' /etc/apt/sources.list

# System deps (kept minimal)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg-dev \
    zlib1g-dev \
  && rm -rf /var/lib/apt/lists/*

# Install python deps first for better Docker layer caching
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app

EXPOSE 8000

# Default command: migrate then runserver
CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]