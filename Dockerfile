FROM docker.io/oven/bun:latest

# ネイティブモジュールのビルドに必要なパッケージを追加
RUN apt-get update && apt-get install -y python3 make g++

WORKDIR /app

COPY package.json package.json
# ロックファイルがあればそれもコピー
# COPY bun.lockb* ./ 

RUN bun install

COPY . .

EXPOSE 3000

CMD ["bun", "src/index.ts"]
