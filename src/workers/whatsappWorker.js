import { Worker } from "bullmq";
import { redis } from "../queues/redis.js";

export const whatsappWorker = new Worker(
  "whatsapp",
  async (job) => {
    console.log("Sending WhatsApp to", job.data.phone);
    // await sendWhatsApp(job.data.phone, job.data.message)
    return { sent: true };
  },
  { connection: redis }
);

whatsappWorker.on("error", (error) => console.error("WhatsApp worker error:", error));