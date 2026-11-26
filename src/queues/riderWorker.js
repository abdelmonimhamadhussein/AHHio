import { randomInt } from "node:crypto";
import { Worker } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import { redis } from "./redis.js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing required environment variables: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY"
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const riderWorker = new Worker(
  "rider-assignment",
  async (job) => {
    const { orderId, city } = job.data ?? {};
    if (typeof orderId !== "string" || !orderId) {
      throw new Error("Rider assignment job is missing a valid orderId");
    }

    console.log("Finding rider for order", orderId, "in", city);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, tenant_id, delivery_agent_id")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      throw new Error(`Unable to load order ${orderId}: ${orderError.message}`);
    }
    if (!order) {
      throw new Error(`Order ${orderId} was not found`);
    }
    if (order.delivery_agent_id) {
      return { assigned: true, riderId: order.delivery_agent_id, alreadyAssigned: true };
    }

    const { data: agents, error: agentsError } = await supabase
      .from("delivery_agents")
      .select("id")
      .eq("store_id", order.tenant_id)
      .eq("is_active", true);

    if (agentsError) {
      throw new Error(`Unable to find active delivery agents: ${agentsError.message}`);
    }
    if (!agents?.length) {
      return { assigned: false, reason: "no active delivery agents" };
    }

    const agent = agents[randomInt(agents.length)];
    const { data: riderId, error: assignmentError } = await supabase.rpc(
      "auto_assign_order_delivery_agent",
      { target_order: order.id, target_agent: agent.id }
    );

    if (assignmentError) {
      throw new Error(`Unable to assign a delivery agent: ${assignmentError.message}`);
    }

    return { assigned: true, riderId };
  },
  { connection: redis }
);

riderWorker.on("completed", (job) => {
  console.log(`Rider job ${job.id} completed:`, job.returnvalue);
});

riderWorker.on("failed", (job, error) => {
  console.error(`Rider job ${job?.id} failed:`, error.message);
});

riderWorker.on("error", (error) => {
  console.error("Rider worker error:", error);
});
