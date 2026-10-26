import { WebSocket } from 'ws';

// 三人群聊实时中枢：按 coupleId 维护连接，向同一小岛的两端推送
type Client = { userId: string; ws: WebSocket };

const rooms = new Map<string, Set<Client>>();

export function join(coupleId: string, userId: string, ws: WebSocket): void {
  if (!rooms.has(coupleId)) rooms.set(coupleId, new Set());
  const set = rooms.get(coupleId)!;
  set.add({ userId, ws });

  ws.on('close', () => {
    set.delete({ userId, ws } as Client);
    // Set 的引用删除需按对象身份，这里用遍历兜底
    for (const c of set) {
      if (c.ws === ws) set.delete(c);
    }
    if (set.size === 0) rooms.delete(coupleId);
  });
}

export function broadcast(coupleId: string, payload: unknown): void {
  const set = rooms.get(coupleId);
  if (!set) return;
  const data = JSON.stringify(payload);
  for (const c of set) {
    if (c.ws.readyState === WebSocket.OPEN) {
      c.ws.send(data);
    }
  }
}

export function roomSize(coupleId: string): number {
  return rooms.get(coupleId)?.size ?? 0;
}
