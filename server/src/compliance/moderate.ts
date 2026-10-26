// 合规：内容安全。MVP 用基础敏感词过滤；真实环境接入文本审核 API（接口位已预留）。

const BLOCKED = [
  '色情', '赌博', '毒品', '诈骗', '暴力', '自杀',
  '裸聊', '约炮', '嫖娼', '代孕',
];

// 文本审核接口位：接入如腾讯云/阿里云内容安全 API
export async function externalModerate(text: string): Promise<boolean> {
  // TODO: 调用 TEXT_MODERATE_API（env），返回是否安全
  return true;
}

export async function moderate(text: string): Promise<{ ok: boolean; reason?: string }> {
  const hit = BLOCKED.find((w) => text.includes(w));
  if (hit) {
    return { ok: false, reason: `内容含敏感词：${hit}` };
  }
  const externalOk = await externalModerate(text);
  if (!externalOk) return { ok: false, reason: '内容审核未通过' };
  return { ok: true };
}
