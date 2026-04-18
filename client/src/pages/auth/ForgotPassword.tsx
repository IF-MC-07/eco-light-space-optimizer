import React from 'react';
import { Mail, ArrowLeft, History, Lock, HelpCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function ForgotPassword() {
  return (
    <div className="min-h-screen bg-neutral flex flex-col relative overflow-hidden">
      {/* Top Bar specific to this page */}
      <header className="h-16 flex items-center justify-between px-8 absolute top-0 w-full z-20">
        <div className="text-primary-dark font-heading font-bold text-lg">Sustained Pulse</div>
        <button className="text-secondary hover:text-secondary-dark transition-colors">
          <HelpCircle size={20} />
        </button>
      </header>

      {/* Background Graphic */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-20 pointer-events-none flex justify-center items-end overflow-hidden">
        <svg className="w-[800px] h-auto text-neutral-muted" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 8C8 10 5.9 16.19 2 22C4.38 21.36 9 19.38 10.97 14.5C9.82 13 8.35 12.39 6.27 12.31C8.6 11.23 12 11.08 15 13.9C15 8.5 17.5 4 22 2C19.5 4 18.25 5.5 17 8Z"/>
        </svg>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10 w-full mt-10">
        <div className="bg-white rounded-xl shadow-elevated p-10 max-w-[440px] w-full text-center">
          
          <div className="w-14 h-14 bg-[#F8FAFC] rounded-2xl flex items-center justify-center text-primary mx-auto mb-6 shadow-sm border border-neutral-border/50">
             <div className="relative">
               <History size={26} strokeWidth={2.5}/>
               <div className="absolute inset-0 flex items-center justify-center">
                 <Lock size={10} className="mt-1" strokeWidth={3}/>
               </div>
             </div>
          </div>

          <h1 className="text-2xl font-heading font-extrabold text-neutral-900 mb-3">Forgot password?</h1>
          <p className="text-secondary text-sm mb-8 leading-relaxed px-2">
            No worries, we'll send you reset instructions. Please enter the email associated with your account.
          </p>

          <form className="space-y-6 text-left" onSubmit={(e) => e.preventDefault()}>
            <Input 
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              leftIcon={<Mail size={18} />}
              className="text-xs"
            />

            <Button variant="primary" fullWidth className="py-3 mt-2 shadow-sm text-sm font-semibold">
              Send Verification Code
            </Button>
          </form>

          <a href="#" className="inline-flex items-center gap-2 text-sm font-bold text-[#1B4D1E] hover:text-primary transition-colors mt-8">
            <ArrowLeft size={16} /> Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
