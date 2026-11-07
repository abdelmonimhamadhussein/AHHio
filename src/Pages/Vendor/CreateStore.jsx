import { useState } from "react";
import {useNavigate} from "react-router-dom";
import {supabase} from "../../lib/supabase";

export default function CreateStore(){
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const navigate = useNavigate()

  const handleNameChange = (val) => {
  setName(val)
  setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
  }
  const handleCreate = async () => {
    await supabase.from('store').insert({name, slug})
    navigate("/vendorDashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-sm border">
        <h1 className="text=xl font-bold mb-1">انشي متجرك</h1>
        <p className="text-sm text-gray-500 mb-6">15 دقيقة ومتجرك يكون جاهز</p>

        <label className="text-sm font-medium">اسم المتجر</label>
        <input 
        type="text"
        value={name}
        onChange={(e) =>handleNameChange(e.target.value)}
        placeholder=""
        className="w-full border rounded-xl p-3 mt-1 mb-4"
        />
        <label className="text-sm font-medium">رابط متجرك</label>
        <div className="flex items-center gap-2 mt-1">
         <input 
         value={slug}
         onChange={(e) => setSlug(e.target.value)}
         placeholder=""
         className="flex-1 border rounded-xl p-3"
         />
         <span className="text-sm text-gray-500">.ahhio.com</span>
        </div>

        <button
        onClick={handleCreate}
        disabled={!name || !slug}
        className="w-full bg-blue text-white rounded-xl py-3 mt-6 font-medium disabled: opacity-30"
        >
        انشاء متجرك
        </button>
      </div>
    </div>
  )
}