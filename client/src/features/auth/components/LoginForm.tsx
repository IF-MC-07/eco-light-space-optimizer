import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";
import { AuthAlert } from "../../../components/ui/AuthAlert";
import { useAuth } from "../../../hooks/useAuth";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const { login, loading, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email && !password) {
      setLocalError("Please enter your email and password.");
      return;
    }
    if (!email) {
      setLocalError("Email address is required.");
      return;
    }
    if (!password) {
      setLocalError("Password is required.");
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col justify-center h-full">
      <h2 className="font-heading text-3xl font-bold text-secondary-dark mb-2">Welcome Back</h2>
      <p className="text-secondary-light text-sm mb-8 leading-relaxed">
        Please enter your credentials to manage your ecosystem.
      </p>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthAlert
          variant="error"
          message={localError || error}
          onDismiss={() => setLocalError(null)}
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          leftIcon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e: any) => setEmail(e.target.value)}
        />

        <div className="space-y-4">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
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

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" />
              <label htmlFor="remember" className="text-xs font-semibold text-secondary-dark cursor-pointer">
                Remember me
              </label>
            </div>
            <a href="forgot-password" className="text-xs font-bold text-primary hover:text-primary-dark transition-colors">
              Forgot password?
            </a>
          </div>
        </div>

        <Button 
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark text-white py-6 text-sm rounded-md shadow-sm transition-all mt-4"
        >
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>

      <div className="flex items-center my-8">
        <div className="flex-1 border-t border-neutral-border"></div>
        <div className="flex-1 border-t border-neutral-border"></div>
      </div>
      <p className="text-center text-xs font-medium text-secondary-light">
        Don't have an account?{" "}
        <a href="register" className="font-bold text-primary hover:text-primary-dark transition-colors">
          Register here
        </a>
      </p>
    </div>
  );
}
