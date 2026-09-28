import {useState, useEffect} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {supabase} from "../../lib/supabase"

export default function EditProduct(){
const {id} = useParams()
const [name, setName] = useState("")
const [price, setPrice] = useState("")
const [tenantId, setTenantId] = useState(null)
const navigate = useNavigate()


useEffect(() => {
    (async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.id) return

        const { data: tenant } = await supabase
            .from("tenants")
            .select("id")
            .eq("owner_id", user.id)
            .maybeSingle();

        const currentTenantId = tenant?.id || user.id;
        setTenantId(currentTenantId);

        const {data, error} = await supabase
            .from("products")
            .select("*")
            .eq("id", id)
            .or(`tenant_id.eq.${currentTenantId},vendor_id.eq.${user.id}`)
            .single()

        if (error) {
            console.error("Error fetching product:", error)
        } else {
            setName(data.name)
            setPrice(data.price)
        }
    })()
},[id])

const handleUpdate = async () => {
    if (!tenantId) return
    const { error } = await supabase
        .from("products")
        .update({ name, price })
        .eq("id", id)
        .or(`tenant_id.eq.${tenantId},vendor_id.eq.${tenantId}`)

    if (error) {
        console.error("Error updating product:", error)
        alert("Failed to update product.")
        return
    }

    alert("Product updated successfully!")

    navigate("/vendor/dashboard")
} 
const handleDelete = async () => {
    if(!confirm("Are you sure you want to delete this product?")) return
    if (!tenantId) return
    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id)
        .or(`tenant_id.eq.${tenantId},vendor_id.eq.${tenantId}`)

    if (error) {
        console.error("Error deleting product:", error)
        alert("Failed to delete product.")
        return
    }

    navigate("/vendor/dashboard")
}

return (
    <div>
        <h2>Edit Product</h2>
        <form>
            <div>
                <label>Name:</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
                <label>Price:</label>
                <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <button type="button" onClick={handleUpdate}>
                Update Product
            </button>
            <button type="button" onClick={handleDelete}>
                Delete Product
            </button>
        </form>
    </div>
)
}