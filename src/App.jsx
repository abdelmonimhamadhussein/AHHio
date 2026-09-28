import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Home from "./Pages/Home";
import ShopPage from "./components/product/ShopPage";
import ProductDetails from "./components/product/ProductDetails";
import Checkout from "./Pages/Checkout";
import Plans from "./Pages/Plans";
import OrderSuccess from "./Pages/Vendor/OrderSuccess";
import VendorOrders from "./Pages/Vendor/Orders";
import ScrollToTop from "./components/ScrollToTop";
import CartPage from "./components/cart/CartPage";
import AdminDashboard from "./components/admin/AdminDashboard";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import VendorRegister from "./Pages/Vendor/VendorRegister";
import VendorLogin from "./Pages/Vendor/VendorLogin";
import VendorDashboard from "./Pages/Vendor/VendorDashboard";
import AddProduct from "./Pages/Vendor/addProduct";
import Billing from "./Pages/Vendor/Billing";
import VendorSettings from "./Pages/Vendor/VendorSettings";
import Footer from "./components/Footer";
import Notfound from "./Pages/Notfound";
import PrivateRoute from "./components/PrivateRoute";
import StorePage from "./Pages/StorePage";
import Renew from "./Pages/Vendor/Renew";
import EditProduct from "./components/product/EditProduct";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[#111111] text-white">
      <ScrollToTop />
      <Navbar />

      <main className="container mx-auto flex-1 p-4">
        <Routes>
          <Route path="/Login" element={<Login />} />
          <Route path="/Register" element={<Register />} />
          <Route path="/" element={<Home />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/store/:slug" element={<StorePage />} />
          <Route path="/:slug" element={<StorePage />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/cart" element={<CartPage />} />

          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          <Route path="/vendor" element={<VendorLogin />} />
          <Route path="/vendor/register" element={<VendorRegister />} />
          <Route
            path="/vendor/renew"
            element={
              <PrivateRoute allowedRoles={["vendor"]}>
                <Renew />
              </PrivateRoute>
            }
          />
          <Route
            path="/vendor/dashboard"
            element={
              <PrivateRoute allowedRoles={['vendor']}>
                <VendorDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/vendor/add-product"
            element={
              <PrivateRoute allowedRoles={['vendor']}>
                <AddProduct />
              </PrivateRoute>
            }
          />
          <Route
            path="/vendor/edit-product/:id"
            element={
              <PrivateRoute allowedRoles={['vendor']}>
                <EditProduct />
              </PrivateRoute>
            }
          />
          <Route
            path="/vendor/settings"
            element={
              <PrivateRoute allowedRoles={['vendor']}>
                <VendorSettings />
              </PrivateRoute>
            }
          />
          <Route
            path="/vendor/billing"
            element={
              <PrivateRoute allowedRoles={['vendor']}>
                <Billing />
              </PrivateRoute>
            }
          />
          <Route
            path="/:slug/orders"
            element={
              <PrivateRoute allowedRoles={['vendor']}>
                <VendorOrders />
              </PrivateRoute>
            }
          />

          <Route path="/notfound" element={<Notfound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

