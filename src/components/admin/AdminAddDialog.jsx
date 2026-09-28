import { useState } from "react"
import { supabase } from "../../lib/supabase.js" // اتأكد من المسار دا
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"

export function AdminAddDialog({ onProductAdd }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    image_url: "", // دا لازم يكون image_url
    description: ""
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault() // صلحت prevenDefault
    setLoading(true)

    try {
      const { error } = await supabase.from('products').insert([{ // صلحت form ل from
        name: form.name,
        price: Number(form.price),
        category: form.category,
        image_url: form.image_url, // دا لازم يتطابق مع name في الـ input
        description: form.description
      }])

      if (error) throw error

      alert("تمت الاضافة بنجاح")
      setForm({ name: "", price: "", category: "", image_url: "", description: "" })
      setOpen(false)
      onProductAdd && onProductAdd() // عشان يعمل refresh للجدول

    } catch (error) {
      alert('خطأ: ' + error.message)
      console.error(error)
    } finally {
      setLoading(false) // دا عشان "جاري الاضافة" تقيف
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>اضافة منتج</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>اضافة منتج جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input name="name" placeholder="اسم المنتج" value={form.name} onChange={handleChange} required />
          <Input name="price" type="number" placeholder="السعر" value={form.price} onChange={handleChange} required />
          <Input name="category" placeholder="التصنيف" value={form.category} onChange={handleChange} />
          <Input name="image_url" placeholder="رابط الصورة" value={form.image_url} onChange={handleChange} /> {/* كان image */}
          <Textarea name="description" placeholder="الوصف" value={form.description} onChange={handleChange} />
          
          <div className="flex gap-2 justify-between">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>الغاء</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الاضافة..." : "اضافة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
export default AdminAddDialog