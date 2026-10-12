import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

const emptyForm = { name: "", phone: "", is_active: true };

export default function DeliveryAgents() {
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [agents, setAgents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingAgent, setEditingAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        navigate("/vendor", { replace: true });
        return;
      }

      const { data: loadedTenant, error: tenantError } = await supabase
        .from("tenants")
        .select("id, store_name")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (tenantError || !loadedTenant) {
        setError(tenantError?.message || "ما لقينا متجرك.");
        setLoading(false);
        return;
      }

      setTenant(loadedTenant);
      const { data: loadedAgents, error: agentsError } = await supabase
        .from("delivery_agents")
        .select("id, store_id, name, phone, is_active")
        .eq("store_id", loadedTenant.id)
        .order("name");

      if (agentsError) setError(agentsError.message);
      else setAgents(loadedAgents || []);
      setLoading(false);
    }

    load();
  }, [navigate]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingAgent(null);
  };

  const saveAgent = async (event) => {
    event.preventDefault();
    if (!tenant || !form.name.trim() || !form.phone.trim()) return;

    setSaving(true);
    setError("");
    const values = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      is_active: form.is_active,
    };
    const query = editingAgent
      ? supabase.from("delivery_agents").update(values).eq("id", editingAgent.id).eq("store_id", tenant.id)
      : supabase.from("delivery_agents").insert({ ...values, store_id: tenant.id });
    const { data, error: saveError } = await query.select("id, store_id, name, phone, is_active").single();
    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setAgents((current) => {
      const next = editingAgent
        ? current.map((agent) => agent.id === data.id ? data : agent)
        : [...current, data];
      return next.sort((first, second) => first.name.localeCompare(second.name, "ar"));
    });
    resetForm();
  };

  const editAgent = (agent) => {
    setEditingAgent(agent);
    setForm({ name: agent.name, phone: agent.phone, is_active: agent.is_active });
  };

  const deleteAgent = async (agent) => {
    if (!window.confirm(`متأكد داير تحذف المندوب ${agent.name}؟`)) return;

    const { error: deleteError } = await supabase
      .from("delivery_agents")
      .delete()
      .eq("id", agent.id)
      .eq("store_id", tenant.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setAgents((current) => current.filter((item) => item.id !== agent.id));
    if (editingAgent?.id === agent.id) resetForm();
  };

  if (loading) return <div className="p-10 text-center text-[#D4AF37]">جاري تحميل المندوبين...</div>;
  if (!tenant) return <div dir="rtl" role="alert" className="p-10 text-center text-red-300">{error}</div>;

  return (
    <div dir="rtl" className="mx-auto max-w-4xl px-4 py-8 text-white">
      <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[#D4AF37]">{tenant.store_name}</p>
          <h1 className="text-3xl font-black">مندوبين التوصيل</h1>
        </div>
        <Link to="/vendor/dashboard" className="rounded-lg border border-white/15 px-4 py-2 text-sm font-bold hover:bg-white/5">
          لوحة المتجر
        </Link>
      </header>

      <form onSubmit={saveAgent} className="mb-8 border-y border-white/10 py-5">
        <h2 className="mb-4 text-lg font-bold">{editingAgent ? "تعديل بيانات المندوب" : "إضافة مندوب جديد"}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-white/70">
            الاسم
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-[#171717] p-3 text-white outline-none focus:border-[#D4AF37]" />
          </label>
          <label className="text-sm text-white/70">
            رقم التلفون
            <input required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-[#171717] p-3 text-white outline-none focus:border-[#D4AF37]" />
          </label>
        </div>

        <label className="mt-4 inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} className="h-4 w-4 accent-[#E91E63]" />
          المندوب شغال
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" disabled={saving} className="rounded-lg bg-[#E91E63] px-5 py-2.5 font-bold text-white disabled:opacity-60">
            {saving ? "جاري الحفظ..." : editingAgent ? "حفظ التعديل" : "إضافة المندوب"}
          </button>
          {editingAgent && <button type="button" onClick={resetForm} className="rounded-lg border border-white/15 px-4 py-2.5 font-bold">إلغاء</button>}
        </div>
      </form>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-950/70 p-3 text-sm text-red-200">{error}</p>}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">قائمة المندوبين</h2>
          <span className="text-sm text-white/50">{agents.length} مندوب</span>
        </div>

        {agents.length === 0 ? (
          <p className="border-y border-white/10 py-10 text-center text-white/55">ما في مندوبين مسجلين لسه.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {agents.map((agent) => (
              <li key={agent.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 font-bold">
                    <span>{agent.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${agent.is_active ? "bg-green-900/60 text-green-300" : "bg-white/10 text-white/55"}`}>
                      {agent.is_active ? "شغال" : "واقف"}
                    </span>
                  </div>
                  <p dir="ltr" className="mt-1 text-right text-sm text-white/60">{agent.phone}</p>
                </div>
                <div className="flex gap-1">
                  <button type="button" title="تعديل المندوب" aria-label={`تعديل ${agent.name}`} onClick={() => editAgent(agent)} className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white">
                    <Pencil size={18} />
                  </button>
                  <button type="button" title="حذف المندوب" aria-label={`حذف ${agent.name}`} onClick={() => deleteAgent(agent)} className="rounded-md p-2 text-red-300 hover:bg-red-950/60">
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}