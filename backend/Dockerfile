# Risk Radar API (FastAPI + uvicorn)
#
# Built from the REPOSITORY ROOT (see docker-compose.yml), not from backend/:
# the workbook importer reads design/ingestion/dsd_register.csv and
# seed_all.sql at run time (app/importer/catalog.py, REPO_ROOT = parents[3]).
# The layout below keeps that path true inside the image:
#   /srv/backend/app/importer/catalog.py  ->  parents[3] = /srv
# backend/Dockerfile.dockerignore keeps the build context to just these files.
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /srv/backend
COPY backend/requirements-docker.txt .
RUN pip install --no-cache-dir -r requirements-docker.txt
COPY design/ingestion/dsd_register.csv design/ingestion/seed_all.sql /srv/design/ingestion/
COPY backend/app ./app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
