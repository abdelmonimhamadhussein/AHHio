import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard"));
const Home = lazy(() => import("./Pages/Home"));
const ShopPage = lazy(() => import("./components/product/ShopPage"));
const ProductDetails = lazy(() => import("./components/product/ProductDetails"));
const Checkout = lazy(() => import("./Pages/Checkout"));
const Plans = lazy(() => import("./Pages/Plans"));
const OrderSuccess = lazy(() => import("./Pages/Vendor/OrderSuccess"));
const VendorOrders = lazy(() => import("./Pages/Vendor/Orders"));
import ScrollToTop from "./components/ScrollToTop";
const CartPage = lazy(() => import("./components/cart/CartPage"));
const Login = lazy(() => import("./components/auth/Login"));
const Register = lazy(() => import("./components/auth/Register"));
const VendorLogin = lazy(() => import("./Pages/Vendor/VendorLogin"));
const VendorDashboard = lazy(() => import("./Pages/Vendor/VendorDashboard"));
const AddProduct = lazy(() => import("./Pages/Vendor/addProduct"));
const Billing = lazy(() => import("./Pages/Vendor/Billing"));
const VendorSettings = lazy(() => import("./Pages/Vendor/VendorSettings"));
const DeliveryAgents = lazy(() => import("./Pages/Vendor/DeliveryAgents"));
import Footer from "./components/Footer";
const Notfound = lazy(() => import("./Pages/Notfound"));
import PrivateRoute from "./components/PrivateRoute";
const StorePage = lazy(() => import("./Pages/StorePage"));
const Renew = lazy(() => import("./Pages/Vendor/Renew"));
const EditProduct = lazy(() => import("./components/product/EditProduct"));

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black">
      <ScrollToTop />
      <Navbar />

      <main className="w-full flex-1">
        <Suspense fallback={<div role="status" className="p-12 text-center">جارٍ تحميل الصفحة...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/login" element={<Login />} />
            <Route path="/Login" element={<Navigate to="/login" replace />} />
            <Route path="/register" element={<Register />} />
            <Route path="/vendor/login" element={<VendorLogin />} />
            <Route path="/vendor" element={<PrivateRoute allowedRoles={["vendor"]}><VendorDashboard /></PrivateRoute>} />
            <Route path="/vendor/dashboard" element={<PrivateRoute allowedRoles={["vendor"]}><VendorDashboard /></PrivateRoute>} />
            <Route path="/vendor/orders" element={<PrivateRoute allowedRoles={["vendor"]}><VendorOrders /></PrivateRoute>} />
            <Route path="/vendor/settings" element={<PrivateRoute allowedRoles={["vendor"]}><VendorSettings /></PrivateRoute>} />
            <Route path="/vendor/delivery" element={<PrivateRoute allowedRoles={["vendor"]}><DeliveryAgents /></PrivateRoute>} />
            <Route path="/vendor/billing" element={<PrivateRoute allowedRoles={["vendor"]}><Billing /></PrivateRoute>} />
            <Route path="/vendor/renew" element={<PrivateRoute allowedRoles={["vendor"]}><Renew /></PrivateRoute>} />
            <Route path="/vendor/add-product" element={<PrivateRoute allowedRoles={["vendor"]}><AddProduct /></PrivateRoute>} />
            <Route path="/vendor/edit-product/:id" element={<PrivateRoute allowedRoles={["vendor"]}><EditProduct /></PrivateRoute>} />
            <Route path="/store/:slug" element={<StorePage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<PrivateRoute allowedRoles={["admin"]}><AdminDashboard /></PrivateRoute>} />
            <Route path="/notfound" element={<Notfound />} />
            <Route path="*" element={<Notfound />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

