import { useState } from "react";
import { Mail, Phone, MapPin, Send, Loader } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function Contact() {
  const [fromData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...fromData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const { error } = await supabase.from("contact").insert(fromData);

    if (error) {
      setError("حصل خطا: " + error.message);
      setLoading(false);
    } else {
      setLoading(false);
      setSent(true);
      setFormData({ name: "", subject: "", email: "", message: "" });
      setTimeout(() => setSent(false), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 px-4 py-12">
      <div className="mx-auto max-w-6xl rounded-3xl border border-sky-100 bg-white p-6 shadow-sm md:p-10">
        <h1 className="mb-2 text-center text-4xl font-black text-sky-800">اتصل بنا</h1>
        <p className="mb-8 text-center text-sky-700">للاستفسار والدعم الفني</p>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6 rounded-2xl bg-sky-50 p-6">
            <h2 className="text-2xl font-bold text-sky-800">معلوماتنا</h2>

            <div className="flex items-center gap-4 rounded-xl bg-white p-3 shadow-sm">
              <div className="rounded-lg bg-sky-100 p-3 text-sky-600"><MapPin size={18} /></div>
              <div>
                <p className="font-bold text-slate-800">العنوان</p>
                <p className="text-slate-600">السودان</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl bg-white p-3 shadow-sm">
              <div className="rounded-lg bg-sky-100 p-3 text-sky-600"><Phone size={18} /></div>
              <div>
                <p className="font-bold text-slate-800">رقم الهاتف</p>
                <p className="text-slate-600">+249910070934</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl bg-white p-3 shadow-sm">
              <div className="rounded-lg bg-sky-100 p-3 text-sky-600"><Mail size={18} /></div>
              <div>
                <p className="font-bold text-slate-800">الايميل</p>
                <p className="text-slate-600">support@AHHio.vercel</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sky-100">
            <h2 className="mb-6 text-2xl font-bold text-sky-800">ارسل هنا</h2>

            {sent && <div className="mb-4 rounded-lg bg-green-100 p-3 text-green-700">!تم ارسال رسالتك بنجاح✔</div>}
            {error && <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block font-semibold text-slate-700">الاسم</label>
                <input type="text" name="name" value={fromData.name} onChange={handleChange} required className="w-full rounded-xl border border-sky-100 bg-sky-50 p-3 outline-none transition focus:border-sky-500" />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-700">الايميل</label>
                <input type="email" name="email" value={fromData.email} onChange={handleChange} required className="w-full rounded-xl border border-sky-100 bg-sky-50 p-3 outline-none transition focus:border-sky-500" />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-700">الموضوع</label>
                <input type="text" name="subject" value={fromData.subject} onChange={handleChange} required className="w-full rounded-xl border border-sky-100 bg-sky-50 p-3 outline-none transition focus:border-sky-500" />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-700">الرسالة</label>
                <textarea name="message" value={fromData.message} onChange={handleChange} required rows="5" className="w-full rounded-xl border border-sky-100 bg-sky-50 p-3 outline-none transition focus:border-sky-500" />
              </div>

              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 font-bold text-white transition hover:bg-sky-600 disabled:bg-slate-400">
                {loading ? <Loader className="animate-spin" size={18} /> : <Send size={18} />}
                {loading ? "...جاري الارسال" : "ارسال"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}