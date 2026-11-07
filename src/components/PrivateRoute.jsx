import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function PrivateRoute({ children, allowedRoles }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          setUser(null);
          setRole(null);
          return;
        }

        setUser(authUser);

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authUser.id)
          .maybeSingle();

        // لو مافي profile لسه، اعتبرو vendor مؤقتاً، عشان يقدر يدخل CreateStore
        // وما نطردو للـ Home
        setRole(profile?.role ?? authUser.user_metadata?.role ?? "vendor");
      } catch (error) {
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // لو المستخدم سجل خروج من تاب تاني، حدث الحالة
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setRole(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="p-8 text-center">...جاري التحقق من صلاحية الوصول</div>;

  if (!user) {
    // كل الناس بتمشي لـ /login واحد بس، مع حفظ الصفحة الكان ماشي ليها
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // لو مافي role محدد، وديهو CreateStore بدل ما تطردو للـ Home
  // ده للتاجر الجديد
  if (!role && allowedRoles?.includes("vendor")) {
    if (location.pathname !== "/vendor/create-store") {
      return <Navigate to="/vendor/create-store" replace />;
    }
    return children;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

