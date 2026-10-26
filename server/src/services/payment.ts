// 微信支付 V3 骨架：真实接入需商户号(mchid)、商户证书与 APIv3 密钥。
// 流程：统一下单(JSAPI) → 返回前端调起参数 → 用户支付 → 支付回调验签 → 发货(更新会员)。
import { config } from '../config';

export interface PayParams {
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: string;
  paySign: string;
}

export interface CreateOrderResult {
  outTradeNo: string;
  payParams: PayParams;
}

// 统一下单（JSAPI），返回 wx.requestPayment 所需参数
export async function createPaymentOrder(
  coupleId: string,
  amount: number, // 单位：分
): Promise<CreateOrderResult> {
  if (config.mockPay) {
    return {
      outTradeNo: 'mock_' + Date.now(),
      payParams: {
        timeStamp: String(Math.floor(Date.now() / 1000)),
        nonceStr: 'mock',
        package: 'prepay_id=mock',
        signType: 'RSA',
        paySign: 'mock',
      },
    };
  }

  // TODO: 调用微信支付「JSAPI 下单」接口
  // POST https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi
  // 请求体：appid, mchid, description, out_trade_no, amount{total,currency}, payer{openid}, notify_url
  // 签名方式：商户私钥对 request 签名（Authorization: WECHATPAY2-SHA256-RSA2048）
  void coupleId;
  void amount;
  throw new Error('未配置微信支付，请先接入商户号或开启 MOCK_PAY');
}

// 支付结果回调验签（在 POST /api/payment/notify 中调用）
export async function verifyPayNotify(
  body: Record<string, unknown>,
  _headers: Record<string, unknown>,
): Promise<{ outTradeNo: string; ok: boolean }> {
  // TODO: 使用微信平台证书验签 + AES-256-GCM 解密 resource
  void body;
  void _headers;
  return { outTradeNo: '', ok: false };
}
