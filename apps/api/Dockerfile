# Gibeon Empire API — build from the monorepo root as context:
#   docker build -f apps/api/Dockerfile -t gibeon-api .
FROM node:22-alpine AS build
WORKDIR /repo
COPY . .
RUN npm ci
RUN npm run build --workspace=api

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo ./
WORKDIR /repo/apps/api
EXPOSE 4000
# Apply migrations, then boot. DATABASE_URL / REDIS_* / JWT_SECRET via env.
CMD ["sh", "-c", "npx drizzle-kit migrate && node dist/main.js"]
