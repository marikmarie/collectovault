import React, { useState } from 'react';
import { User, Briefcase, Lock, ArrowRight, Mail } from 'lucide-react';
// Assuming you are using React Router Dom for navigation
import { useNavigate } from 'react-router-dom'; 

// Define the available user types
type UserType = 'client' | 'staff';

// Define the file paths for the images in the public folder
const LOGO_PATH = '/logo.png'; 
const BACKGROUND_IMAGE_PATH = '/bg.png'; 

export default function LoginPage() {
  const navigate = useNavigate(); // Hook for navigation
    
  const [userType, setUserType] = useState<UserType>('client');
  const [loginStep, setLoginStep] = useState<'id_entry' | 'otp_entry'>('id_entry');
  const [idValue, setIdValue] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [error, setError] = useState('');

  // --- Handlers ---
  const handleIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (idValue.length < 5) {
      setError(`Please enter a valid ${userType === 'client' ? 'Client ID' : 'User ID'}.`);
      return;
    }
    
    // Step 1: Simulate backend check and OTP trigger
    setLoginStep('otp_entry');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (otpValue.length !== 6) {
      setError("OTP must be 6 digits.");
      return;
    }

    // Step 2: Simulate OTP validation
    const isValid = otpValue === '123456'; // Placeholder validation logic
    
    if (isValid) {
      console.log(`Login Successful as ${userType.toUpperCase()}! Redirecting to /dashboard...`);
      navigate('/dashboard'); 
      
    } else {
      setError("Invalid OTP. Please try again.");
    }
  };
  
  const handleForgotPassword = () => {
    alert("Forgot Password workflow initiated. Check your recovery channel.");
  };

  // --- Rendering Helpers ---
  const getFormTitle = () => {
    if (loginStep === 'id_entry') {
      return userType === 'client' ? "Client Access" : "Staff Portal";
    }
    return "Verify Identity";
  };
  
  const getPlaceholderText = () => {
    return userType === 'client' ? "Enter Client ID or Email" : "Enter Staff User ID";
  };

  // --- Tab Button Component ---
  const TabButton: React.FC<{ type: UserType; icon: React.FC<any>; label: string }> = ({ type, icon: Icon, label }) => (
    <button
      onClick={() => {
        setUserType(type);
        setLoginStep('id_entry'); // Reset step on tab change
        setError('');
        setIdValue('');
      }}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-t-xl transition-all duration-200
        ${userType === type
          ? 'bg-white text-[#67095D] shadow-inner'
          : 'bg-transparent text-gray-400 hover:text-white border-b-2 border-transparent hover:border-[#3f0b31]'
        }
      `}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      
      {/* --- Background Image Container --- */}
      <div className="absolute inset-0 z-0">
        {/* The image is styled to cover the viewport and maintain aspect ratio */}
        <img 
          src={BACKGROUND_IMAGE_PATH} 
          alt="Login Background" 
          className="w-full h-full" 
        />
        {/* Dark overlay using a deep gradient from your palette for better text contrast */}
        <div className="absolute inset-0" style={{ 
          background: 'linear-gradient(to top, rgba(24, 1, 14, 0.9), rgba(103, 9, 93, 0.5))' 
        }} />
      </div>

      {/* --- Login Content (zIndex 10) --- */}
      <div className="w-full max-w-md mx-auto relative z-10">
        
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          {/* Replaced H1 with Img tag pointing to public folder logo */}
          {/* <img 
            src={LOGO_PATH} 
            alt="CollectoVault Logo" 
            className="h-16 w-auto mx-auto mb-2 filter drop-shadow-lg" 
          /> */}
          <p className="text-sm font-medium text-gray-500 mt-2">Secure Login Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          
          {/* Tabs */}
          <div className="flex" style={{ backgroundColor: '#2b0a1f' }}>
            <TabButton type="client" icon={User} label="Client" />
            <TabButton type="staff" icon={Briefcase} label="Staff" />
          </div>

          <div className="p-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center">{getFormTitle()}</h2>

            {/* --- Step 1: ID Entry Form --- */}
            {loginStep === 'id_entry' && (
              <form onSubmit={handleIdSubmit} className="space-y-6">
                
                <div className="relative">
                  <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-1">
                    {userType === 'client' ? 'Client ID / Email' : 'User ID'}
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                      {userType === 'client' ? <User className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                    </span>
                    <input
                      type="text"
                      id="user_id"
                      value={idValue}
                      onChange={(e) => { setIdValue(e.target.value); setError(''); }}
                      placeholder={getPlaceholderText()}
                      className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-none rounded-r-md focus:ring-[#67095D] focus:border-[#67095D] sm:text-sm"
                      required
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                
                <button
                  type="submit"
                  className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-[#EF4155] hover:bg-[#CB0D6C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#EF4155] transition-colors"
                >
                  Continue to OTP <ArrowRight className="w-5 h-5 ml-2" />
                </button>
                
                <div className="text-center">
                    <button 
                      type="button" 
                      onClick={handleForgotPassword}
                      className="text-sm font-medium text-[#67095D] hover:text-[#EF4155] transition-colors"
                    >
                      Forgot Password?
                    </button>
                </div>
              </form>
            )}

            {/* --- Step 2: OTP Entry Form --- */}
            {loginStep === 'otp_entry' && (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                
                <div className="text-center p-3 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-2 flex items-center justify-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500"/> OTP sent to registered channel for **{idValue}**
                    </p>
                    <p className="text-xs text-gray-400">Please check your email or SMS.</p>
                </div>

                <div className="relative">
                  <label htmlFor="otp_code" className="block text-sm font-medium text-gray-700 mb-1">
                    One-Time Password (OTP)
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="otp_code"
                      value={otpValue}
                      onChange={(e) => { setOtpValue(e.target.value); setError(''); }}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      pattern="\d{6}"
                      className="block w-full text-center px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-[#67095D] focus:border-[#67095D] text-lg font-bold tracking-widest"
                      required
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-[#67095D] hover:bg-[#880666] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#67095D] transition-colors"
                >
                  <Lock className="w-5 h-5 mr-2" /> Secure Login
                </button>
                
                <div className="text-center space-y-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setLoginStep('id_entry')}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700 block"
                    >
                      ← Back to ID Entry
                    </button>
                    <button 
                      type="button" 
                      onClick={() => alert("Resending OTP...")}
                      className="text-xs font-medium text-[#EF4155] hover:text-[#FFA727] block"
                    >
                      Resend OTP
                    </button>
                </div>
              </form>
            )}

          </div>
        </div>
        
        {/* Footer Text */}
        <p className="text-center text-xs text-gray-400 mt-6 relative z-10">
            © {new Date().getFullYear()} CollectoVault. All rights reserved.
        </p>
      </div>
    </div>
  );
}