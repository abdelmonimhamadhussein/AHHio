import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function PrivateRoute({ children, allowedRoles }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setRole(data?.role ?? user.user_metadata?.role ?? null);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  if (loading) return <div>...جاري التحميل</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}