# Monorepo layout: Next.js app lives in ./taskforge
FROM node:20-bookworm-slim

WORKDIR /app

COPY taskforge/package.json taskforge/package-lock.json ./
RUN npm ci

COPY taskforge/ ./

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

EXPOSE 3000
CMD ["npm", "start"]
