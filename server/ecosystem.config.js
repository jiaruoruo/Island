// PM2 进程配置（不使用 Docker 时）：pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'island-server',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        STORE: 'memory',
        MOCK_AUTH: 'true',
        MOCK_AI: 'true',
      },
    },
  ],
};
