FROM oven/bun:latest

WORKDIR /app

# copy package manifest first for better caching
COPY package.json package.json

RUN bun install

# copy app sources
COPY . .

EXPOSE 3000

CMD ["bun", "src/index.ts"]
