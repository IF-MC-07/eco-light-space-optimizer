import React, { useState } from "react";
import { ArrowLeft, Eye, EyeOff, CheckCircle2, Circle } from "lucide-react";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { AuthAlert } from "../../../components/ui/AuthAlert";
import { useAuth } from "../../../hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const { resetPassword, loading, error } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams?.get('token');
  const id = searchParams?.get('id');

  // Dynamic Validation Checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!password || !confirmPassword) {
      setLocalError("Please fill in both password fields.");
      return;
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match. Please re-enter your new password.");
      return;
    }
    if (!token || !id) {
      setLocalError("This reset link is invalid or has expired. Please request a new one.");
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
        <AuthAlert variant="error" message={localError || error} onDismiss={() => setLocalError(null)} />
        <AuthAlert variant="success" message={successMsg} />
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
            <li className={`flex items-center space-x-3 text-sm font-medium ${hasMinLength ? 'text-secondary-dark' : 'text-secondary-light'}`}>
              {hasMinLength ? <CheckCircle2 className="w-4 h-4 text-primary fill-primary-light/20" /> : <Circle className="w-4 h-4 text-secondary-light" />}
              <span>At least 8 characters long</span>
            </li>
            <li className={`flex items-center space-x-3 text-sm font-medium ${hasUppercase ? 'text-secondary-dark' : 'text-secondary-light'}`}>
              {hasUppercase ? <CheckCircle2 className="w-4 h-4 text-primary fill-primary-light/20" /> : <Circle className="w-4 h-4 text-secondary-light" />}
              <span>Contains an uppercase letter</span>
            </li>
            <li className={`flex items-center space-x-3 text-sm font-medium ${hasLowercase ? 'text-secondary-dark' : 'text-secondary-light'}`}>
              {hasLowercase ? <CheckCircle2 className="w-4 h-4 text-primary fill-primary-light/20" /> : <Circle className="w-4 h-4 text-secondary-light" />}
              <span>Contains a lowercase letter</span>
            </li>
            <li className={`flex items-center space-x-3 text-sm font-medium ${hasNumberOrSpecial ? 'text-secondary-dark' : 'text-secondary-light'}`}>
              {hasNumberOrSpecial ? <CheckCircle2 className="w-4 h-4 text-primary fill-primary-light/20" /> : <Circle className="w-4 h-4 text-secondary-light" />}
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
