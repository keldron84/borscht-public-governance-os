# Multi-stage: build the UI with Node, run the API with Python (stdlib only).
FROM node:20-alpine AS ui
WORKDIR /ui
COPY apps/ui/package.json apps/ui/package-lock.json* ./
RUN npm install
COPY apps/ui/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY pyproject.toml README.md ./
COPY --from=ui /ui/dist ./apps/ui/dist
ENV PYTHONPATH=/app/packages
ENV BORSCHT_HOST=0.0.0.0
ENV BORSCHT_PORT=8799
EXPOSE 8799
CMD ["python3", "apps/api/server.py", "--host", "0.0.0.0", "--port", "8799"]
