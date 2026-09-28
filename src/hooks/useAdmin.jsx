import { useState, useEffect } from "react"
import { Dialog, DialogHeader, DialogTitle} from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { supabase } from "../lib/supabase.js"

export  function AdminEditDialog({ editingProduct, setEditingProduct, fetchProducts }) {
  const [form, setForm] = useState({})

  useEffect(() => {

    if (editingProduct) setForm(editingProduct)
  }, [editingProduct])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleUpdate = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('products').update({
      name: form.name, description: form.description, price: parseFloat(form.price), image_url: form.image_url
    }).eq('id', form.id)

    if (error) alert(error.message)
    else {
      alert('تم التعديل')
      setEditingProduct(null)
      fetchProducts()
    }
  }

  const handleDelete = async () => {
    if (!confirm('متاكد عايز تحذف المنتج؟')) return;
    const { error } = await supabase.from('products').delete().eq('id', form.id)
    if (error) alert(error.message)
    else {
      alert('تم الحذف')
      setEditingProduct(null)
      fetchProducts()
    }
  }

  if (!editingProduct) return null;

  return (
    <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
   
        <DialogHeader>
          <DialogTitle>تعديل المنتج</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleUpdate}>
          <div className="grid gap-4 py-4">
            <div><Label>اسم المنتج</Label><Input name="name" value={form.name || ''} onChange={handleChange} /></div>
            <div><Label>الوصف</Label><Textarea name="description" value={form.description || ''} onChange={handleChange} /></div>
            <div><Label>السعر</Label><Input name="price" type="number" value={form.price || ''} onChange={handleChange} /></div>
            <div><Label>رابط الصورة</Label><Input name="image_url" value={form.image_url || ''} onChange={handleChange} /></div>
          </div>
          
            <Button type="button" variant="destructive" onClick={handleDelete}>حذف</Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>الغاء</Button>
              <Button type="submit">حفظ التعديلات</Button>
            </div>
          
        </form>
      
    </Dialog>
  )
}
export default useAdmin
