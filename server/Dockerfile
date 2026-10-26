# 微信小程序 Island 后端 - 微信云托管 / 通用容器
FROM node:20-alpine

WORKDIR /app

# 先装依赖（利用层缓存）
COPY package*.json ./
RUN npm install

# 复制源码：生成 Prisma 客户端并编译
COPY . .
RUN npx prisma generate && npm run build

# 云托管会自动注入 PORT；本地默认 3000
ENV PORT=3000
EXPOSE 3000

# STORE=prisma 时自动执行数据库迁移（失败不阻断启动，便于先起服务排查）
# 需要持久化请设置环境变量：STORE=prisma、DATABASE_URL=...
CMD ["sh", "-c", "if [ \"$STORE\" = \"prisma\" ]; then npx prisma migrate deploy || true; fi; exec node dist/index.js"]
