import {useState} from "react"
import {supabase} from "../../lib/supabase.js"
import { Dialog, DialogHeader, DialogTitle, } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Trash2 } from "lucide-react"


export function AdminEditDialog({ editingProduct, setEditingProduct, handleEditProduct, handleDeleteProduct }) {

  if (!editingProduct) return null;

  const handleChange = (e) => {
    setEditingProduct({ ...editingProduct, [e.target.name]: e.target.value })
  }

  return (
    
    <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>

        <DialogHeader>
          <DialogTitle>تعديل المنتج</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => handleEditProduct(e, editingProduct.id)}>
          <div className='grid gap-4 py-4'>
            <Input
              name="name"
              placeholder='اسم المنتج'
              value={editingProduct.name}
              onChange={handleChange}
              required
            />
            <Input
              name="price"
              placeholder='السعر'
              type="number"
              value={editingProduct.price}
              onChange={handleChange}
              required
            />
            <Input
              name="image_url"
              placeholder='رابط الصورة'
              value={editingProduct.image_url}
              onChange={handleChange}
            />
          </div>

        
            <Button
              type="button"
              variant="destructive"
              onClick={() => handleDeleteProduct(editingProduct.id)}
            >
              <Trash2 className="h-4 w-4 ml-2" /> حذف
            </Button>
            <Button type="submit">تحديث</Button>
          
        </form>
      </Dialog>
  )
}