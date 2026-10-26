# 微信小程序 Island 后端 - 生产镜像
FROM node:20-alpine

WORKDIR /app

# 先装依赖（利用层缓存）
COPY package*.json ./
RUN npm install

# 复制源码并生成 Prisma 客户端 + 编译
COPY . .
RUN npx prisma generate && npm run build

EXPOSE 3000

# STORE=memory 开箱即跑（无需数据库）；需要持久化时改 prisma 并配 DATABASE_URL
CMD ["node", "dist/index.js"]
