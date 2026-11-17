import "server-only";
import Iyzipay from "iyzipay";
import { env } from "@/lib/env";

function client() {
  return new Iyzipay({ apiKey: env("IYZICO_API_KEY"), secretKey: env("IYZICO_SECRET_KEY"), uri: env("IYZICO_BASE_URL") });
}

function call(fn: (c: Iyzipay, cb: (err: unknown, res: Record<string, unknown>) => void) => void): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => fn(client(), (err, res) => (err ? reject(err) : resolve(res))));
}

export const checkoutInitialize = (req: Record<string, unknown>) => call((c, cb) => c.checkoutFormInitialize.create(req, cb));
export const checkoutRetrieve = (token: string, conversationId: string) =>
  call((c, cb) => c.checkoutForm.retrieve({ locale: Iyzipay.LOCALE.TR, conversationId, token }, cb));

export { Iyzipay };
