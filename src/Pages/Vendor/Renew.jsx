// Renew.jsx - ممر فقط، ما فيهو أي منطق دفع
// كل منطق الدفع والتجديد بقى في Billing.jsx بس
// عشان ما نعدل في ملفين كل مرة

import { Navigate, useSearchParams } from "react-router-dom";

export default function Renew() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan");

  // /renew?plan=vip  ->  /billing?plan=vip
  // /renew  ->  /billing
  return <Navigate to={`/vendor/billing${plan ? `?plan=${plan}` : ""}`} replace />;
}
