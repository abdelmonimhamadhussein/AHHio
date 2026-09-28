import {Header} from "../components/layout/Header"
import {Footer} from "../components/Footer"
import {Outlet} from "react-router-dom"

 export function MainLayout() {
    return (
        <>
       <Header/>
       
       <main>
       <Outlet/>
       </main>
             <Footer/>
        </>
    )
}