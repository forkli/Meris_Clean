declare module "iyzipay" {
  type Cb = (err: unknown, result: Record<string, unknown>) => void;
  export default class Iyzipay {
    constructor(opts: { apiKey: string; secretKey: string; uri: string });
    checkoutFormInitialize: { create(req: Record<string, unknown>, cb: Cb): void };
    checkoutForm: { retrieve(req: Record<string, unknown>, cb: Cb): void };
    static LOCALE: { TR: string };
    static CURRENCY: { TRY: string };
    static PAYMENT_GROUP: { PRODUCT: string };
    static BASKET_ITEM_TYPE: { PHYSICAL: string };
  }
}
