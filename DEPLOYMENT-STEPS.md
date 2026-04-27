# 生产环境部署操作步骤

## 当前状态
项目已完成开发和测试，所有部署配置文件已创建：
- ✅ `railway.json` - Railway 后端配置
- ✅ `vercel.json` - Vercel 前端配置
- ✅ `ecosystem.config.js` - PM2 配置
- ✅ `.env.production.example` - 环境变量模板
- ✅ `DEPLOYMENT.md` - 详细部署文档

## 部署步骤

### 第一步：部署后端到 Railway

#### 1.1 登录 Railway
```bash
railway login
```
按照提示在浏览器中完成登录。

#### 1.2 创建新项目
```bash
# 在项目根目录执行
railway init
```
- 选择 "Empty Project"
- 项目命名建议：`guess-my-drawing`

#### 1.3 配置环境变量

**方式一：使用 CLI**
```bash
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set USE_AI_WORDS=false
railway variables set OPENAI_API_KEY=sk-your-key-here
```

**方式二：在 Railway Dashboard 配置**
1. 访问 https://railway.app/dashboard
2. 选择你的项目
3. 进入 "Variables" 标签
4. 添加以下变量：
   ```
   NODE_ENV=production
   PORT=3000
   USE_AI_WORDS=false
   OPENAI_API_KEY=sk-your-key-here  # 可选，如需 AI 词汇生成
   ```

#### 1.4 部署后端
```bash
railway up
```

Railway 会自动：
- 检测 Node.js 项目
- 安装依赖
- 启动服务器（使用 `npm run server`）

#### 1.5 获取后端 URL
```bash
railway domain
```

记录生成的 URL，例如：`https://guess-my-drawing-production.up.railway.app`

**验证后端部署：**
```bash
curl https://your-backend-url.up.railway.app/api/health
```
应该返回：`{"status":"ok"}`

---

### 第二步：部署前端到 Vercel

#### 2.1 安装 Vercel CLI（如未安装）
```bash
npm install -g vercel
```

#### 2.2 登录 Vercel
```bash
vercel login
```

#### 2.3 配置前端环境变量

**方式一：创建 .env.production 文件**
```bash
# 在项目根目录创建 .env.production
VITE_API_URL=https://your-backend-url.up.railway.app
VITE_SOCKET_URL=https://your-backend-url.up.railway.app
```

**方式二：在 Vercel Dashboard 配置**
1. 访问 https://vercel.com/dashboard
2. 选择项目
3. 进入 Settings → Environment Variables
4. 添加：
   ```
   VITE_API_URL=https://your-backend-url.up.railway.app
   VITE_SOCKET_URL=https://your-backend-url.up.railway.app
   ```

#### 2.4 部署前端
```bash
# 首次部署
vercel --prod
```

按提示选择：
- Link to existing project? No
- Project name: guess-my-drawing
- Framework detected: Vite (自动检测)

部署完成后会提供前端 URL，例如：`https://guess-my-drawing.vercel.app`

---

### 第三步：配置 CORS

#### 3.1 更新后端 CORS 配置

编辑 `server/src/app.js`，找到 CORS 配置部分：

```javascript
app.use(cors({
  origin: [
    'https://guess-my-drawing.vercel.app',  // 替换为你的 Vercel URL
    'http://localhost:5173'  // 本地开发保留
  ],
  methods: ['GET', 'POST'],
  credentials: true,
}));
```

#### 3.2 重新部署后端
```bash
railway up
```

---

### 第四步：验证部署

#### 4.1 测试后端 API
```bash
# 健康检查
curl https://your-backend-url.up.railway.app/api/health

# 创建房间测试
curl -X POST https://your-backend-url.up.railway.app/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"nickname":"TestPlayer"}'
```

#### 4.2 测试前端访问
在浏览器中打开前端 URL：`https://your-frontend-url.vercel.app`

#### 4.3 进行完整功能测试
1. 在浏览器打开前端 URL
2. 创建一个房间
3. 在另一个浏览器窗口（隐身模式）加入房间
4. 开始游戏并测试：
   - 画布生成
   - 绘画同步
   - 计时器
   - 猜词流程
   - 计分系统

---

## 故障排查

### Socket.io 连接失败
检查：
1. CORS 配置是否包含前端域名
2. 前端的 `VITE_SOCKET_URL` 是否正确
3. 浏览器控制台是否有错误信息

### 前端无法访问后端 API
检查：
1. 后端是否正常运行（访问 /api/health）
2. CORS 配置是否正确
3. 前端的 `VITE_API_URL` 是否正确

### AI 词汇生成失败
检查：
1. `USE_AI_WORDS` 是否设置为 `true`
2. `OPENAI_API_KEY` 是否正确
3. OpenAI API 配额是否充足

---

## 部署后维护

### 查看日志
```bash
# Railway 日志
railway logs

# 实时日志
railway logs --follow
```

### 更新部署
```bash
# 更新后端
git pull
railway up

# 更新前端
git pull
vercel --prod
```

### 环境变量更新
```bash
railway variables set NEW_VAR=value
railway up  # 重新部署生效
```

---

## 下一步

部署成功后：
1. 测试完整的多人游戏流程
2. 监控日志和性能
3. 根据需要调整配置（如添加数据库、Redis 等）
4. 配置自定义域名（可选）

**祝部署顺利！** 🚀
