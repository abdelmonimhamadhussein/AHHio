import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function PrivateRoute({ children, allowedRoles }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user: authUser },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;

        if (!authUser) {
          setUser(null);
          setRole(null);
          return;
        }

        setUser(authUser);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authUser.id)
          .maybeSingle();

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        setRole(profile?.role ?? authUser.user_metadata?.role ?? null);
      } catch (error) {
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  if (loading) return <div className="p-8 text-center">...جاري التحقق من صلاحية الوصول</div>;

  if (!user) {
    const loginPath = allowedRoles?.includes("vendor") ? "/vendor/login" : "/login";
    return <Navigate to={loginPath} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}