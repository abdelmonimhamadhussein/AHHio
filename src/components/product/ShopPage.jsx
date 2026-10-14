import {useState, useEffect} from "react";
import {supabase} from "../../lib/supabase"
import {ProductGrid} from "../product/ProductGrid"

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
        <div className="min-h-screen bg-white px-4 py-8 text-black">
            <div className="mx-auto max-w-7xl">
            <h1 className="mb-6 text-3xl font-black text-black">AHHio</h1>

            <input
            type="text"
            placeholder="فتش  عن المنتج"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-6 w-full rounded-lg border border-black bg-white p-3 text-black outline-none focus:border-sky-500"
            />
            {loading ? <p>جاري البحث...</p> : <ProductGrid products={filteredProducts}/>}
            </div>
        </div>
    )
}