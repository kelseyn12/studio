FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg openssl ca-certificates fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm exec prisma generate && pnpm build

EXPOSE 3000

ENV HOOK_FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
ENV UPLOAD_ROOT=/data/uploads
ENV DATABASE_URL=file:/data/studio.db

CMD ["sh", "-c", "pnpm exec prisma db push --skip-generate && pnpm start"]
