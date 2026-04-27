# 绘画猜词游戏 - 生产环境部署指南

## 📋 部署概览

本项目采用前后端分离架构：
- **前端**：React + Vite，部署到 Vercel
- **后端**：Node.js + Express + Socket.io，部署到 Railway
- **数据库**：当前使用内存存储，可扩展为 PostgreSQL

---

## 🚀 快速部署

### 前提条件

- Node.js 18+
- npm 或 yarn
- Git
- Vercel CLI（可选）
- Railway CLI（可选）

---

## 1. 后端部署（Railway）

### 1.1 安装 Railway CLI

```bash
npm install -g @railway/cli
```

### 1.2 登录 Railway

```bash
railway login
```

### 1.3 创建新项目

```bash
# 在项目根目录
railway init

# 选择 "Empty Project"
# 命名项目，例如：guess-my-drawing
```

### 1.4 配置环境变量

在 Railway Dashboard 中设置环境变量：

```bash
NODE_ENV=production
PORT=3000
USE_AI_WORDS=false
OPENAI_API_KEY=sk-your-key-here  # 可选
```

或使用 CLI：

```bash
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set USE_AI_WORDS=false
railway variables set OPENAI_API_KEY=sk-your-key-here
```

### 1.5 部署后端

```bash
railway up
```

Railway 会自动：
- 检测 Node.js 项目
- 安装依赖
- 启动服务器（使用 `npm run server`）

### 1.6 获取后端 URL

```bash
railway domain
```

记录生成的 URL，例如：`https://guess-my-drawing-production.up.railway.app`

---

## 2. 前端部署（Vercel）

### 2.1 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2.2 登录 Vercel

```bash
vercel login
```

### 2.3 配置前端环境变量

在项目根目录创建 `.env.production`：

```bash
VITE_API_URL=https://your-backend-url.up.railway.app
VITE_SOCKET_URL=https://your-backend-url.up.railway.app
```

或直接在 Vercel Dashboard 中设置。

### 2.4 部署前端

```bash
# 首次部署
vercel --prod

# 后续部署
vercel --prod
```

Vercel 会自动：
- 检测 Vite 项目
- 安装依赖
- 构建生产版本
- 部署到 CDN

### 2.5 获取前端 URL

部署成功后，Vercel 会提供 URL，例如：`https://guess-my-drawing.vercel.app`

---

## 3. 配置 CORS

### 3.1 更新后端 CORS 配置

编辑 `server/src/app.js`，更新 CORS 配置：

```javascript
import cors from 'cors';

app.use(cors({
  origin: [
    'https://guess-my-drawing.vercel.app',
    'http://localhost:5173' // 本地开发
  ],
  methods: ['GET', 'POST'],
  credentials: true,
}));
```

### 3.2 重新部署后端

```bash
railway up
```

---

## 4. 使用 PM2 部署（自托管服务器）

如果使用自己的服务器（AWS EC2、DigitalOcean 等）：

### 4.1 安装 PM2

```bash
npm install -g pm2
```

### 4.2 构建前端

```bash
cd client
npm run build
```

### 4.3 配置 Nginx

创建 `/etc/nginx/sites-available/guess-my-drawing`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/guess-my-drawing/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 和 WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.4 启动应用

```bash
# 启动后端
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

---

## 5. 数据持久化（可选）

当前使用内存存储，如需持久化：

### 5.1 添加 PostgreSQL

在 Railway：

```bash
railway add --plugin postgresql
```

### 5.2 配置数据库连接

安装依赖：

```bash
npm install pg
```

创建 `server/src/config/database.js`：

```javascript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default pool;
```

---

## 6. 监控和日志

### 6.1 Railway 日志

```bash
railway logs
```

### 6.2 PM2 监控

```bash
# 查看进程状态
pm2 status

# 查看日志
pm2 logs

# 监控界面
pm2 monit
```

### 6.3 集成 Sentry（可选）

安装 Sentry：

```bash
npm install @sentry/node
```

配置 `server/src/app.js`：

```javascript
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
}
```

---

## 7. 性能优化

### 7.1 启用 Gzip 压缩

```bash
npm install compression
```

```javascript
import compression from 'compression';
app.use(compression());
```

### 7.2 启用 Redis 缓存（可选）

```bash
npm install redis
```

用于缓存 AI 生成的词汇，减少 API 调用。

---

## 8. 安全加固

### 8.1 环境变量安全

- ✅ 不要将 `.env` 文件提交到 Git
- ✅ 使用 Railway/Vercel 的环境变量管理
- ✅ 定期轮换 API 密钥

### 8.2 Rate Limiting

安装 `express-rate-limit`：

```bash
npm install express-rate-limit
```

配置限流：

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个 IP 最多 100 个请求
});

app.use(limiter);
```

### 8.3 Helmet 安全头

已安装 `helmet`，确保启用：

```javascript
import helmet from 'helmet';
app.use(helmet());
```

---

## 9. 部署检查清单

部署前确认：

- [ ] 环境变量已配置
- [ ] CORS 配置正确
- [ ] 数据库连接正常（如使用）
- [ ] 日志输出正确
- [ ] API 端点可访问
- [ ] Socket.io 连接正常
- [ ] 前端构建成功
- [ ] 所有测试通过

---

## 10. 常见问题

### Q: Socket.io 连接失败？

**A**: 检查：
1. CORS 配置是否包含前端域名
2. WebSocket 代理配置是否正确
3. 是否使用了正确的 Socket URL

### Q: 前端无法访问后端 API？

**A**: 检查：
1. 后端是否正常运行
2. CORS 配置是否正确
3. API URL 是否正确

### Q: AI 词汇生成失败？

**A**: 检查：
1. `USE_AI_WORDS` 是否设置为 `true`
2. `OPENAI_API_KEY` 是否正确
3. OpenAI API 配额是否充足

---

## 11. 更新部署

### 更新后端

```bash
git pull
railway up
```

### 更新前端

```bash
git pull
cd client
npm run build
vercel --prod
```

---

## 12. 回滚部署

### Railway 回滚

```bash
railway rollback
```

### Vercel 回滚

在 Vercel Dashboard 中：
1. 选择项目
2. 进入 Deployments
3. 选择历史版本
4. 点击 "Promote to Production"

---

## 🎉 部署完成！

访问你的应用：
- 前端：`https://your-app.vercel.app`
- 后端健康检查：`https://your-backend.railway.app/api/health`

---

## 📞 支持

如有问题，请查看：
- 项目 README.md
- GitHub Issues
- 开发文档

---

**祝部署顺利！** 🚀
