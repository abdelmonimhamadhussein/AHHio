import React from 'react'

import ReactDOM from 'react-dom/client'

import App from './App.jsx'

import './globals.css'

import {BrowserRouter} from "react-router-dom"

import { DialogProvider } from "./components/context/DialogContext.jsx"

import { AuthProvider } from "./components/context/AuthContext.jsx"

import {DialogManager} from "./components/Dialogs/DialogManager.jsx"

import {CartProvider} from "./components/context/CartContext.jsx"

import {ProductsProvider} from "./components/context/ProductsContext.jsx"

ReactDOM.createRoot(document.getElementById('root')).render(

  <React.StrictMode>
   <BrowserRouter>
   <ProductsProvider>
<AuthProvider>
      <DialogProvider>
<CartProvider>
               <DialogManager/>
             <App/>
              </CartProvider>
        </DialogProvider>
        </AuthProvider>
        </ProductsProvider>
   </BrowserRouter>
  </React.StrictMode>
);