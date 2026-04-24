import React, { useState } from "react";
import { ArrowLeft, Eye, EyeOff, CheckCircle2, Circle } from "lucide-react";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../../hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const { resetPassword, loading, error } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams?.get('token');
  const id = searchParams?.get('id');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (!token || !id) {
      alert("Invalid reset link");
      return;
    }

    const res = await resetPassword(id, token, password);
    if (res.success) {
      setSuccessMsg("Password reset successfully. Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="font-heading text-2xl font-bold text-secondary-dark mb-2">Reset Password</h2>
        <p className="text-secondary-light text-sm leading-relaxed">
          Choose a strong, unique password to secure your energy management ecosystem.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {successMsg && <div className="text-green-500 text-sm">{successMsg}</div>}
        <Input
          label="NEW PASSWORD"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••••••"
          value={password}
          onChange={(e: any) => setPassword(e.target.value)}
          rightIcon={
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="hover:text-secondary-dark transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <Input
          label="CONFIRM NEW PASSWORD"
          type="password"
          placeholder="••••••••••••"
          value={confirmPassword}
          onChange={(e: any) => setConfirmPassword(e.target.value)}
        />

        {/* Security Standards Box */}
        <div className="bg-[#F1F5F9] rounded-xl p-6 mt-6 border border-neutral-border/50">
          <h4 className="text-xs font-bold text-secondary-dark uppercase tracking-wider mb-4">Security Standards</h4>
          <ul className="space-y-3">
            <li className="flex items-center space-x-3 text-sm font-medium text-secondary-dark">
              <CheckCircle2 className="w-4 h-4 text-primary fill-primary-light/20" />
              <span>At least 8 characters long</span>
            </li>
            <li className="flex items-center space-x-3 text-sm font-medium text-secondary-light">
              <Circle className="w-4 h-4 text-secondary-light" />
              <span>Contains an uppercase letter</span>
            </li>
            <li className="flex items-center space-x-3 text-sm font-medium text-secondary-light">
              <Circle className="w-4 h-4 text-secondary-light" />
              <span>Contains a lowercase letter</span>
            </li>
            <li className="flex items-center space-x-3 text-sm font-medium text-secondary-light">
              <Circle className="w-4 h-4 text-secondary-light" />
              <span>Number or special character</span>
            </li>
          </ul>
        </div>

        <Button 
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark text-white py-6 text-sm font-semibold rounded-md shadow-sm transition-all mt-8"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <a href="login" className="inline-flex items-center space-x-2 text-sm font-bold text-primary hover:text-primary-dark transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Security Login</span>
        </a>
      </div>
    </div>
  );
}
