import type { NextFunction, Request, Response } from 'express';
import { getStore } from '../store';
import type { User } from '../types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// 鉴权：Bearer token 即 userId（Mock）。真实微信登录可在此替换为 JWT 校验。
export async function auth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : (req.headers['x-user-id'] as string);
  if (!token) {
    res.status(401).json({ error: '未登录' });
    return;
  }
  const user = await getStore().getUserById(token);
  if (!user) {
    res.status(401).json({ error: '用户不存在' });
    return;
  }
  req.user = user;
  next();
}
