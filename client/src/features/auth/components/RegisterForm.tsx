import React, { useState } from "react";
import { User, Mail, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";
import { AuthAlert } from "../../../components/ui/AuthAlert";
import { useAuth } from "../../../hooks/useAuth";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const { register, loading, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!nama || !username || !email || !password || !confirmPassword) {
      setLocalError("All fields are required. Please fill in every field.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match. Please re-enter your password.");
      return;
    }
    if (!agreedToTerms) {
      setTermsError(true);
      setLocalError("You must agree to the Terms of Service and Privacy Policy to create an account.");
      return;
    }

    const res = await register(nama, username, email, password);
    if (res.success) {
      setSuccessMsg("Account created! Redirecting to login...");
      setTimeout(() => router.push("/login"), 1500);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="w-60 h-60 flex items-center justify-center mx-auto">
          <img src="/images/Logo Eco-Light.png" alt="Logo" />
        </div>
        <h2 className="font-heading text-3xl font-bold text-secondary-dark mb-2">Create Account</h2>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthAlert variant="error" message={localError || error} onDismiss={() => setLocalError(null)} />
        <AuthAlert variant="success" message={successMsg} />
        <Input
          label="FULL NAME"
          type="text"
          placeholder="John Doe"
          leftIcon={<User className="w-4 h-4" />}
          value={nama}
          onChange={(e: any) => setNama(e.target.value)}
        />

        <Input
          label="USERNAME"
          type="text"
          placeholder="john_doe"
          leftIcon={<User className="w-4 h-4" />}
          value={username}
          onChange={(e: any) => setUsername(e.target.value)}
        />

        <Input
          label="EMAIL ADDRESS"
          type="email"
          placeholder="john@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e: any) => setEmail(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="PASSWORD"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
          />
          <Input
            label="CONFIRM PASSWORD"
            type="password"
            placeholder="••••••••"
            leftIcon={<ShieldCheck className="w-4 h-4" />}
            value={confirmPassword}
            onChange={(e: any) => setConfirmPassword(e.target.value)}
          />
        </div>

        <div className={`flex items-start space-x-3 pt-2 rounded-lg transition-all duration-200 ${
          termsError ? 'bg-red-50 border border-red-200 px-3 py-2' : ''
        }`}>
          <div className="mt-0.5">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                if (e.target.checked) {
                  setTermsError(false);
                  setLocalError(null);
                }
              }}
            />
          </div>
          <label htmlFor="terms" className={`text-xs font-medium leading-snug cursor-pointer ${
            termsError ? 'text-red-600' : 'text-secondary-light'
          }`}>
            I agree to the <a href="#" className="font-bold text-primary hover:underline">Terms of Service</a> and <a href="#" className="font-bold text-primary hover:underline">Privacy Policy</a> regarding energy usage data.
          </label>
        </div>

        <Button 
          type="submit"
          disabled={loading}
          className={`w-full text-white py-6 text-sm rounded-md shadow-sm transition-all mt-6 flex items-center justify-center space-x-2 ${
            agreedToTerms
              ? 'bg-primary hover:bg-primary-dark'
              : 'bg-neutral-300 cursor-not-allowed opacity-60'
          }`}
        >
          <span>{loading ? "Creating..." : "Create Account"}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      <p className="text-center text-sm font-medium text-secondary-light mt-8">
        Already have an account?{" "}
        <a href="login" className="font-bold text-primary hover:text-primary-dark transition-colors">
          Sign In
        </a>
      </p>
    </div>
  );
}
