// qrcode 包未提供自带类型声明，此处补充最小可用声明
declare module 'qrcode' {
  export interface QRCodeOptions {
    width?: number;
    margin?: number;
    scale?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    type?: 'png' | 'svg' | 'utf8';
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function toDataURL(
    text: string,
    options?: QRCodeOptions,
  ): Promise<string>;
  export function toBuffer(
    text: string,
    options?: QRCodeOptions,
  ): Promise<Buffer>;
  export function toString(
    text: string,
    options?: QRCodeOptions,
  ): Promise<string>;
}
