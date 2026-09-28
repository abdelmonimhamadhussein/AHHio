import { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../../lib/supabase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (authUser) => {
    const { data: userData } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
    setUser(userData);

    if (userData?.role === 'vendor') {
      const { data: sellerData } = await supabase.from('tenants').select('*').eq('owner_id', authUser.id).maybeSingle();
      setSeller(sellerData);
    } else {
      setSeller(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchUserData(session.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserData(session.user);
      } else {
        setUser(null);
        setSeller(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUpSeller = async (email, password, storeName, whatsapp) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    const userId = data.user.id;
    const slug = storeName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await supabase.from('profiles').insert({ id: userId, email, role: 'vendor' });
    const { data: sellerData } = await supabase.from('tenants').insert({
      owner_id: userId,
      owner_name: storeName.trim(),
      store_name: storeName.trim(),
      slug,
      whatsapp_number: whatsapp,
      status: 'active',
      theme_color: '#E91E63',
      city: 'امدرمان',
    }).select().single();
    setSeller(sellerData);
    return data;
  };

  const signUpCustomer = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    await supabase.from('profiles').insert({
      id: data.user.id,
      email,
      name,
      role: 'customer',
    });
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSeller(null);
  };

  const value = {
    user,
    seller,
    signUpCustomer,
    signUpSeller,
    loading,
    signIn,
    signOut,
    isSeller: user?.role === 'vendor',
    isCustomer: user?.role === 'customer',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

