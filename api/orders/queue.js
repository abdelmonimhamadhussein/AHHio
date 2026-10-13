import { createClient } from "@supabase/supabase-js";
import { addWhatsAppJob } from "../../src/queues/whatsappQueue.js";
import { assignRiderJob } from "../../src/queues/riderQueue.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const { orderIds } = request.body || {};
  if (
    !Array.isArray(orderIds) ||
    orderIds.length < 1 ||
    orderIds.length > 20 ||
    orderIds.some((id) => typeof id !== "string" || !/^[\da-f-]{36}$/i.test(id))
  ) {
    return response.status(400).json({ error: "Invalid order IDs" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey || !process.env.REDIS_URL) {
    return response.status(503).json({ error: "Queue service is not configured" });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, phone, city, total")
      .in("id", orderIds);

    if (error) throw error;
    if (orders.length !== new Set(orderIds).size) {
      return response.status(404).json({ error: "Order not found" });
    }

    await Promise.all(
      orders.flatMap((order) => [
        addWhatsAppJob({ ...order, customer_phone: order.phone }),
        assignRiderJob(order),
      ])
    );
    return response.status(202).json({ queued: orders.length });
  } catch (error) {
    console.error("Unable to queue order jobs:", error);
    return response.status(503).json({ error: "Unable to queue order jobs" });
  }
}