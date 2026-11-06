import {useState} from "react";
import otpInput from 'react-otp-input'
import {supabase} from "../../lib/supabase"
import {useNavigate} from 'react-router-dom'

export default function VerifyOtp ()  {
    const [otp, setOtp] = useState('')
    const navigate = useNavigate()
    const verifyOtp = async () => {
        const email = localStorage.getItem('email')
        const {error} = await supabase.auth.verifyOtp({
            email: email,
            token: otp,
            type: 'email'
        })
        if(!error) {
            navigate('/createStore')
        }else{
            alert('الكود غلط يا استاذ')
        }  
    } 
    return (
        <div style={{textAlign: 'center', marginTop:'50px'}}>
            <h2>راجع الايميل</h2>

            <div style={{display: 'flex', justifyContent: 'center', margin: '20px'}}>
                <otpInput
                value={otp}
                onChange={setOtp}
                nimInpus={6}
                renderSepartor = {<span style={{margin: '5px'}}>-</span>}
                renderInput={(props) => <input {...props} style={{
                    width: '40px',
                    height: '40px',
                    fontSize: '20px',
                    textAlign: 'center'
                }}/>}
                />
            </div>
            <button onClick={verifyOtp}>تحقق</button>
        </div>
    )
}