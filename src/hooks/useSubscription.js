import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const DAY = 24 * 60 * 60 * 1000;

export default function useSubscription(tenantId) {
  const [state, setState] = useState({
    plan: null,
    subscription: null,
    daysLeft: 0,
    isExpired: false,
    isBlocked: false,
    canAddProduct: true,
    loading: true,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      if (!tenantId) {
        setState({
          plan: null,
          subscription: null,
          daysLeft: 0,
          isExpired: false,
          isBlocked: false,
          canAddProduct: false,
          loading: false,
        });
        return;
      }

      try {
        const { data: subscriptionData } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("end_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        let subscription = subscriptionData || null;
        let plan = null;

        if (subscription?.plan_id) {
          const { data: planData } = await supabase
            .from("plans")
            .select("*")
            .eq("id", subscription.plan_id)
            .maybeSingle();
          plan = planData || null;
        }

        if (!plan) {
          const { data: tenantData } = await supabase
            .from("tenants")
            .select("plan")
            .eq("id", tenantId)
            .maybeSingle();
          if (tenantData?.plan) {
            const { data: fallbackPlan } = await supabase
              .from("plans")
              .select("*")
              .eq("id", tenantData.plan)
              .maybeSingle();
            plan = fallbackPlan || null;
          }
        }

        const now = new Date();
        let isExpired = false;
        let isBlocked = false;

        if (subscription && subscription.end_date) {
          const endDate = new Date(subscription.end_date);
          if (now > endDate && ["trial", "active"].includes(subscription.status)) {
            const grace = new Date(now.getTime() + 3 * DAY).toISOString();
            await supabase
              .from("subscriptions")
              .update({ status: "expired", grace_until: grace })
              .eq("id", subscription.id);
            await supabase.from("tenants").update({ status: "expired" }).eq("id", tenantId);
            subscription = { ...subscription, status: "expired", grace_until: grace };
            isExpired = true;
          }

          if (subscription.status === "expired") {
            const graceUntil = subscription.grace_until ? new Date(subscription.grace_until) : null;
            if (graceUntil && now > graceUntil) {
              await supabase.from("tenants").update({ status: "blocked" }).eq("id", tenantId);
              isBlocked = true;
            }
          }
        }

        const { count } = await supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId);

        const maxProducts = plan?.max_products ?? 9999;
        const canAddProduct = Number(count || 0) < Number(maxProducts || 9999);

        const daysLeft = subscription?.end_date
          ? Math.ceil((new Date(subscription.end_date).getTime() - now.getTime()) / DAY)
          : 0;

        if (!active) return;

        setState({
          plan,
          subscription,
          daysLeft: daysLeft > 0 ? daysLeft : 0,
          isExpired: isExpired || subscription?.status === "expired",
          isBlocked: isBlocked || subscription?.status === "blocked" || false,
          canAddProduct,
          loading: false,
        });
      } catch (error) {
        if (active) {
          setState({
            plan: null,
            subscription: null,
            daysLeft: 0,
            isExpired: false,
            isBlocked: false,
            canAddProduct: false,
            loading: false,
          });
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [tenantId]);

  return state;
}
