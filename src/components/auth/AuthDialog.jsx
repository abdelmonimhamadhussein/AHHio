import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Button } from "../ui/button"
import { supabase } from "../../lib/supabase.js"
import { toast } from "sonner"
import {useDialog} from "../context/DialogContext.jsx"
import {useAuth} from "../context/AuthContext.jsx"

export function AuthDialog() {
const [open, setOpen] = useDialog()
const [signIn, signUp] = useAuth
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
const [fullName, setFullName] = useState("")

  const handleSignIn= async () => {
    e.preventDefault();
    setLoading(true)
   
    try{
      
    const {data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    
      toast.success("تم تسجيل الدخول")

      setOpen(false)

      setEmail("")

      setPassword("")

    }catch(error){
    toast.error('خطاء:' + error.message)
    }finally{
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault() 
    setLoading(true)
    const {data, error } = await supabase.auth.signUp({ email, password,
      options:{
        data:{
          full_name:fullName
        }
      }
     })
    setLoading(false)
    if (error) toast.error(error.message)
    else {
      toast.success("راجع ايميلك للتفعيل")
      setOpen(false)
    }
  }

  return (
    
 

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent  dir="rtl" className="sm:max-w-[425px] text-center  bg-white" 
     
      >
        <DialogHeader>

          <DialogTitle className="text-center">
         تسجيل الدخول
            </DialogTitle>
          <DialogDescription className="text-center">
          لازم تسجل عشان تضيف للسلة
           </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="signIn" className="w-full">
          <TabsList className="grid w-full grid-cols-2">

            <TabsTrigger value="signIn" >دخول</TabsTrigger>
            <TabsTrigger value="signUp">حساب جديد</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleSignIn}> {/* 3. لفيتو ب form */}

              <div className="grid gap-2 text-right">

                <Label htmlFor="email" className="text-right">الايميل</Label>
                <Input  type="email" placeholder="الايميل" required className="bg-white border border-gray-300 h-10 px-3 text-right" 
                value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="grid gap-2 text-right">

                <Label htmlFor="password" className="text-right">كلمة السر</Label>
                <Input type="password" placeholder="كلمة السر" required className="bg-white border border-gray-300 h-10 px-3 text-right" 
                value={password} onChange={(e) => setPassword(e.target.value)} 
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-10"> {/* 4. type="submit" */}
                {loading? "دخول" : "...جاري الدخول"}
              </Button>
            </form>

          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="grid gap-4 py-4"> {/* 5. لفيتو ب form */}

              <div className="grid gap-2 text-right">
                   <label>الاسم</label>
                   <input
                   id="signup_name"
                   value={fullName}
                   onChange={(e) => setFullName(e.target.value)}
                   required
                   />
                   </div>
                   
                   <div> 
                <Label htmlFor="email-signup" className="text-right">الايميل</Label>
                <Input id="email-signup" type="email" required className="bg-white border border-gray-300 h-10 px-3 text-right" 
                value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="grid gap-2 className=text-right">

                <Label htmlFor="password-signup" className="text-right">كلمة السر</Label>
                <Input type="password" required className="bg-white border border-gray-300 h-10 px-3 text-right" 
                value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-10"> {/* 6. type="submit" */}
                {loading? "انشاء حساب" : "...جاري"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
    
  )
}