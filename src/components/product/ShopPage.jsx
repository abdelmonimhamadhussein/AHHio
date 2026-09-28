import {useState, useEffect} from "react";
import {supabase} from "../../lib/supabase"
import {ProductGrid} from "../product/ProductGrid"
import { Link } from "react-router-dom";

export default function ShopPage() {
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {

     const fetchProducts = async () =>{

        const {data, error} = await supabase.from ('products').select('*')

        if(!error) setProducts(data)

            setLoading(false);
     }
     fetchProducts();
    },[])

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLocaleLowerCase())
    );
    return (
        <div className="min-h-screen bg-sky-50 px-4 py-8">
            <div className="mx-auto max-w-7xl">
            <h1 className="mb-6 text-3xl font-black text-sky-800">AHHio</h1>

            <input
            type="text"
            placeholder="فتش  عن المنتج"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-6 w-full rounded-xl border border-sky-100 bg-white p-3 outline-none focus:border-sky-500"
            />
            {loading ? <p>جاري البحث...</p> : <ProductGrid products={filteredProducts}/>}
            </div>
        </div>
    )
}