import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../components/context/AuthContext'

export default function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { Admin } = useAuth()

  // جيب كل المنتجات
  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setProducts(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // اضافة منتج - ادمن بس
  const addProduct = async (product) => {
    if (!Admin) return { error: 'غير مصرح' }
    const { data, error } = await supabase.from('products').insert([product]).select()
    if (data) setProducts([data[0], ...products])
    return { data, error }
  }

  // تعديل منتج - ادمن بس
  const updateProduct = async (id, updates) => {
    if (!Admin) return { error: 'غير مصرح' }
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select()
    if (data) setProducts(products.map(p => p.id === id ? data[0] : p))
    return { data, error }
  }

  // حذف منتج - ادمن بس
  const deleteProduct = async (id) => {
    if (!Admin) return { error: 'غير مصرح' }
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) setProducts(products.filter(p => p.id !== id))
    return { error }
  }

  return { products, loading, fetchProducts, addProduct, updateProduct, deleteProduct }
}
