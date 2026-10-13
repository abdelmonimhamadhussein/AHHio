import { Queue } from "bullmq";
import { redis } from "./redis.js";

export const riderQueue = new Queue("rider-assignment", { connection: redis });

export const assignRiderJob = async (order) => {
  await riderQueue.add(
    "assign-rider",
    { orderId: order.id, city: order.city, amount: order.total },
    { jobId: `rider-${order.id}`, attempts: 2 }
  );
};