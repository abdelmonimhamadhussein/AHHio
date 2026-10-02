import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import AdminDashboard from "./components/admin/AdminDashboard";
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
import Footer from "./components/Footer";
const Notfound = lazy(() => import("./Pages/Notfound"));
import PrivateRoute from "./components/PrivateRoute";
const StorePage = lazy(() => import("./Pages/StorePage"));
const Renew = lazy(() => import("./Pages/Vendor/Renew"));
const EditProduct = lazy(() => import("./components/product/EditProduct"));

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[#111111] text-white">
      <ScrollToTop />
      <Navbar />

      <main className="container mx-auto flex-1 p-4">
        <Suspense fallback={<div role="status" className="p-12 text-center">جارٍ تحميل الصفحة...</div>}>
        <Routes>
          <Route path="/Login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
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
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

