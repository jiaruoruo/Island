// 实名年龄核验接口位：接第三方实名认证（阿里云实人认证 / 腾讯云实名认证等）
// 用于真实环境替代 Mock 的年龄确认，确保未成年人隔离合规。

export interface IdentityResult {
  ok: boolean; // 核验是否成功
  adult: boolean; // 是否成年
}

export async function verifyRealName(
  name: string,
  idCard: string,
): Promise<IdentityResult> {
  // TODO: 调用实名认证服务商 API，返回姓名/身份证号是否匹配及年龄
  // 例如：https://help.aliyun.com/zh/id-verification/
  void name;
  void idCard;
  return { ok: true, adult: true };
}
