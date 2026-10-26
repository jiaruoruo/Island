import { randomUUID } from 'crypto';
import { Router } from 'express';
import { config } from '../config';
import { getStore } from '../store';
import type { Store } from '../store/types';

export const authRouter = Router();

// 验证码存储（内存，5 分钟有效）
const smsCodes = new Map<string, { code: string; expiresAt: number }>();

function genSmsCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// 生成唯一 8 位小岛号
async function nextUid(store: Store): Promise<string> {
  let uid = String(Math.floor(10000000 + Math.random() * 90000000));
  let guard = 0;
  while (await store.findUserByUid(uid)) {
    uid = String(Math.floor(10000000 + Math.random() * 90000000));
    if (++guard > 50) break;
  }
  return uid;
}

// 合规：未成年人禁止登录
function isMinor(adult?: boolean): boolean {
  return adult === false;
}

// 发送手机验证码（Mock：控制台打印 + 返回 devCode；真实接入短信服务商）
authRouter.post('/send-code', async (req, res) => {
  const { phone } = (req.body || {}) as { phone?: string };
  if (!phone || !/^1\d{10}$/.test(phone)) {
    return res.status(400).json({ error: '手机号格式不正确' });
  }
  const code = genSmsCode();
  smsCodes.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });

  if (!config.mockAuth) {
    // TODO: 调用短信服务商（阿里云/腾讯云短信）发送验证码
  }
  console.log(`[sms] ${phone} 验证码: ${code}`);
  res.json({ ok: true, devCode: config.mockAuth ? code : undefined });
});

// 手机号验证码登录
authRouter.post('/login-by-phone', async (req, res) => {
  const { phone, code, nickname, adult } = (req.body || {}) as {
    phone?: string;
    code?: string;
    nickname?: string;
    adult?: boolean;
  };
  if (isMinor(adult)) {
    return res.status(403).json({ error: '本产品仅限 18 岁以上用户使用' });
  }
  if (!phone || !code) {
    return res.status(400).json({ error: '手机号与验证码必填' });
  }
  const item = smsCodes.get(phone);
  if (!item || item.expiresAt < Date.now()) {
    return res.status(400).json({ error: '验证码已过期，请重新获取' });
  }
  if (item.code !== code) {
    return res.status(400).json({ error: '验证码错误' });
  }
  smsCodes.delete(phone);

  const openid = 'phone_' + phone;
  const store = getStore();
  let user = await store.getUserByOpenid(openid);
  if (!user) {
    user = await store.createUser({
      id: randomUUID(),
      openid,
      uid: await nextUid(store),
      nickname: nickname || '小岛居民',
      adult: true,
      minorMode: false,
    });
  }
  res.json({ token: user.id, user });
});

// 微信登录：Mock 模式用 deviceCode/code 生成稳定 openid；真实模式走 code2Session
authRouter.post('/login', async (req, res) => {
  const { code, deviceCode, nickname, adult } = (req.body || {}) as {
    code?: string;
    deviceCode?: string;
    nickname?: string;
    adult?: boolean;
  };
  if (isMinor(adult)) {
    return res.status(403).json({ error: '本产品仅限 18 岁以上用户使用' });
  }

  let openid: string;
  if (config.mockAuth) {
    openid = 'mock_' + (deviceCode || code || randomUUID());
  } else {
    try {
      const r = await fetch(
        `https://api.weixin.qq.com/sns/jscode2session?appid=${config.wxAppid}&secret=${config.wxSecret}&js_code=${code}&grant_type=authorization_code`,
      );
      const d: any = await r.json();
      openid = d?.openid || `wx_${code}`;
    } catch {
      openid = `wx_${code}`;
    }
  }

  const store = getStore();
  let user = await store.getUserByOpenid(openid);
  if (!user) {
    user = await store.createUser({
      id: randomUUID(),
      openid,
      uid: await nextUid(store),
      nickname: nickname || '小岛居民',
      adult: true,
      minorMode: false,
    });
  }
  res.json({ token: user.id, user });
});
