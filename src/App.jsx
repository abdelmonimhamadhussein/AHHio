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
const VendorDashboard = lazy(() => import("./Pages/Vendor/VendorDashboard"));
const AddProduct = lazy(() => import("./Pages/Vendor/addProduct"));
const Billing = lazy(() => import("./Pages/Vendor/Billing"));
const CreateStore = lazy(() => import("./Pages/Vendor/CreateStore"));
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
            {/* عامة */}
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/store/:slug" element={<StorePage />} />

            {/* Auth - مصدر واحد بس */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Redirects للمسارات القديمة - عشان اللينكات القديمة ما تتكسر */}
            <Route path="/Login" element={<Navigate to="/login" replace />} />
            <Route path="/VendorDashboard" element={<Navigate to="/vendor/dashboard" replace />} />
            <Route path="/vendor/login" element={<Navigate to="/login" replace />} />
            <Route path="/billing" element={<Navigate to="/vendor/billing" replace />} />
            <Route path="/renew" element={<Navigate to="/vendor/renew" replace />} />
            <Route path="/vendor" element={<Navigate to="/vendor/dashboard" replace />} />

            {/* Vendor - كلها تحت /vendor */}
            <Route path="/vendor/dashboard" element={<PrivateRoute allowedRoles={["vendor"]}><VendorDashboard /></PrivateRoute>} />
            <Route path="/vendor/orders" element={<PrivateRoute allowedRoles={["vendor"]}><VendorOrders /></PrivateRoute>} />
            {/* CreateStore لازم يسمح للتاجر الجديد حتى لو vendor_status = pending */}
            <Route path="/vendor/create-store" element={<PrivateRoute allowedRoles={["vendor"]}><CreateStore /></PrivateRoute>} />
            <Route path="/vendor/CreateStore" element={<Navigate to="/vendor/create-store" replace />} />
            <Route path="/vendor/delivery" element={<PrivateRoute allowedRoles={["vendor"]}><DeliveryAgents /></PrivateRoute>} />
            <Route path="/vendor/billing" element={<PrivateRoute allowedRoles={["vendor"]}><Billing /></PrivateRoute>} />
            <Route path="/vendor/renew" element={<PrivateRoute allowedRoles={["vendor"]}><Renew /></PrivateRoute>} />
            <Route path="/vendor/add-product" element={<PrivateRoute allowedRoles={["vendor"]}><AddProduct /></PrivateRoute>} />
            <Route path="/vendor/edit-product/:id" element={<PrivateRoute allowedRoles={["vendor"]}><EditProduct /></PrivateRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<PrivateRoute allowedRoles={["admin"]}><AdminDashboard /></PrivateRoute>} />
            <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />

            <Route path="/notfound" element={<Notfound />} />
            <Route path="*" element={<Notfound />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
