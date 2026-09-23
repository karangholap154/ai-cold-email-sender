import DodoPayments from "dodopayments";

const apiKey = process.env.DODO_PAYMENTS_API_KEY;
const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
const environment = (process.env.DODO_PAYMENTS_ENVIRONMENT as "live_mode" | "test_mode") || "test_mode";

export const dodoClient = new DodoPayments({
  bearerToken: apiKey,
  webhookKey: webhookKey,
  environment: environment,
});
