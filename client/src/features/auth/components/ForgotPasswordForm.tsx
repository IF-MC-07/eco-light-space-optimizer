import React, { useState } from "react";
import { Mail, ArrowLeft, RotateCcw } from "lucide-react";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../../hooks/useAuth";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const { forgotPassword, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const res = await forgotPassword(email);
    if (res.success) {
      setSuccessMsg(res.message);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-[#F1F5F9] text-primary-dark rounded-xl flex items-center justify-center mx-auto mb-6 relative">
          <RotateCcw className="w-6 h-6" />
          {/* Small lock icon superimposed */}
          <div className="absolute right-3 bottom-3 bg-white rounded-full p-0.5 shadow-sm">
            <svg className="w-3 h-3 text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
        </div>
        <h2 className="font-heading text-3xl font-bold text-secondary-dark mb-4">Forgot password?</h2>
        <p className="text-secondary-light text-sm leading-relaxed max-w-sm mx-auto">
          No worries, we'll send you reset instructions. Please enter the email associated with your account.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {successMsg && <div className="text-green-500 text-sm">{successMsg}</div>}
        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          leftIcon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e: any) => setEmail(e.target.value)}
        />

        <Button 
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark text-white py-6 text-sm font-semibold rounded-md shadow-sm transition-all"
        >
          {loading ? "Sending..." : "Send Verification Code"}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <a href="login" className="inline-flex items-center space-x-2 text-sm font-bold text-primary hover:text-primary-dark transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </a>
      </div>
    </div>
  );
}
