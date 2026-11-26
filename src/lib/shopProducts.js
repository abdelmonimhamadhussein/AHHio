import { supabase } from "./supabase";

// Fetch one page of active products across all marketplace vendors.
export async function getShopProducts({ page = 1, limit = 12, search = "", category = "", vendorId } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 12);
  const start = (safePage - 1) * safeLimit;
  const end = start + safeLimit - 1;

  let query = supabase
    .from("products")
    .select("*, tenant:tenants(store_name, rating)", { count: "exact" })
    .eq("is_active", true)
    .order("id", { ascending: false });

  if (search.trim()) query = query.ilike("name", `%${search.trim()}%`);
  if (category.trim()) query = query.ilike("category", `%${category.trim()}%`);
  if (vendorId) query = query.eq("tenant_id", vendorId);

  const { data, count, error } = await query.range(start, end);
  if (error) throw error;

  const products = [...new Map((data || []).map((product) => [product.id, product])).values()];
  const total = count || 0;

  return {
    products,
    total,
    hasMore: safePage * safeLimit < total,
  };
}
