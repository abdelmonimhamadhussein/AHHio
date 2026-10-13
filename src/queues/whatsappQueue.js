import { Queue } from "bullmq";
import { redis } from "./redis.js";

export const whatsappQueue = new Queue("whatsapp", { connection: redis });

export const addWhatsAppJob = async (order) => {
  await whatsappQueue.add(
    "send-message",
    {
      phone: order.customer_phone,
      message: `طلبك ${order.id} قيد التوصيل - AHHio`,
      orderId: order.id,
    },
    {
      jobId: `whatsapp-${order.id}`,
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    }
  );
};