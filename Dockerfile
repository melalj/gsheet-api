FROM oven/bun:1-slim
RUN mkdir -p /app
WORKDIR /app
ADD package.json bun.lock* /app/
RUN bun install --frozen-lockfile || bun install
ADD . /app
CMD ["bun", "run", "index.ts"]
