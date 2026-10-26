import cors from 'cors';
import express from 'express';
import http from 'http';
import { URL } from 'url';
import { WebSocketServer } from 'ws';
import { config } from './config';
import { auth } from './middleware/auth';
import { authRouter } from './routes/auth';
import { chatRouter } from './routes/chat';
import { coupleRouter } from './routes/couple';
import { friendRouter } from './routes/friend';
import { gameRouter } from './routes/game';
import { memoryRouter } from './routes/memory';
import { plannerRouter } from './routes/planner';
import { quizRouter } from './routes/quiz';
import { subscriptionRouter } from './routes/subscription';
import { userRouter } from './routes/user';
import { handleUserMessage } from './services/chatService';
import { join } from './ws/chatHub';

const app = express();
app.use(cors());
app.use(express.json());

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    store: config.store,
    aiMode: config.mockAi ? 'mock' : 'llm',
    authMode: config.mockAuth ? 'mock' : 'wechat',
  });
});

app.use('/api/auth', authRouter);

// 需要鉴权的业务路由
app.use('/api/couples', auth, coupleRouter);
app.use('/api/chat', auth, chatRouter);
app.use('/api/memory', auth, memoryRouter);
app.use('/api/quiz', auth, quizRouter);
app.use('/api/game', auth, gameRouter);
app.use('/api/planner', auth, plannerRouter);
app.use('/api/subscription', auth, subscriptionRouter);
app.use('/api/users', auth, userRouter);
app.use('/api/friends', auth, friendRouter);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', 'http://localhost');
  const coupleId = url.searchParams.get('coupleId') || '';
  const userId = url.searchParams.get('userId') || '';
  if (coupleId && userId) join(coupleId, userId, ws);

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'message' && coupleId && userId && msg.text) {
        const r = await handleUserMessage(coupleId, userId, msg.text);
        if ('error' in r) {
          ws.send(JSON.stringify({ type: 'error', error: r.error }));
        }
      }
    } catch {
      /* 忽略非法帧 */
    }
  });
});

server.listen(config.port, () => {
  console.log(
    `[twoo-server] ready at http://localhost:${config.port} (store=${config.store}, ai=${config.mockAi ? 'mock' : 'llm'})`,
  );
});
