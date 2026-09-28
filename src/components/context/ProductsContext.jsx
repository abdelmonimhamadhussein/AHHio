import { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../../lib/supabase";

const ProductsContext = createContext(null);
export const useProducts = () => useContext(ProductsContext);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*');
    if (!error) setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const value = { products, loading, fetchProducts };

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}