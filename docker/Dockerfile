# syntax=docker/dockerfile:1.7
# ---------- Stage 1: install dependencies ----------
# Use Playwright's official image which has all browsers + OS deps preinstalled.
# Pin to a Playwright version that matches @playwright/test in package.json.
FROM mcr.microsoft.com/playwright:v1.60.0-jammy AS deps

WORKDIR /work

# Install dependencies using a clean, reproducible install. Copy lock + manifest
# first so this layer caches when only source changes.
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# ---------- Stage 2: runtime ----------
FROM mcr.microsoft.com/playwright:v1.60.0-jammy AS runtime

ENV CI=true \
    NODE_ENV=production \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

WORKDIR /work

# Bring deps from the previous stage, then the source.
COPY --from=deps /work/node_modules ./node_modules
COPY . .

# The test runner is the default command. SHARD_INDEX and SHARD_TOTAL are
# supplied by docker-compose / Jenkins to slice the run.
# Gating run: excludes @quarantine. Override CMD to run quarantine triage.
CMD ["sh", "-c", "npx playwright test --grep-invert @quarantine --shard=${SHARD_INDEX:-1}/${SHARD_TOTAL:-1}"]
