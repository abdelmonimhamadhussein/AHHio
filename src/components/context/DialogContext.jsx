import { createContext, useContext, useState } from "react"
import { supabase } from "../../lib/supabase.js"



const DialogContext = createContext(null)

export function DialogProvider({ children }) {

    const [open, setOpen] = useState(false)

    const [type, setType] = useState(null)

    const [data, setData] = useState(null)

    const openDialog = (dialogData, dialogType = null) => {
        setType(dialogType);
       setData(dialogData);
       setOpen(true);
    }
    const closeDialog = () => {
        setOpen(false);
        setData(null);
        setType(null);
    }

    return (
        <DialogContext.Provider value={{ closeDialog, data, setData , open, setOpen, type, setType, openDialog}}>
            {children}  
        </DialogContext.Provider>


    )
}
export const useDialog = () => useContext(DialogContext)

