import React, { useState } from "react";
import { User, Mail, Building, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";
import { useAuth } from "../../../hooks/useAuth";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { register, loading, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !email || !password) return;
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const res = await register(nama, email, password);
    if (res.success) {
      router.push("/login");
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-primary-light/20 text-primary rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M11 20A7 7 0 0 1 14 6c.5 3 2.5 5 5 6a10 10 0 0 1-8 8Z" />
            <path d="M2 12a10 10 0 0 1 10-10c.5 3 2.5 5 5 6" />
            <path d="M14 6c-.5 3-2.5 5-5 6a10 10 0 0 1-7-7" />
          </svg>
        </div>
        <h2 className="font-heading text-3xl font-bold text-secondary-dark mb-2">Create Account</h2>
        <p className="text-secondary-light text-sm">
          Join the Digital Arboretum and optimize your workspace.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <Input
          label="FULL NAME"
          type="text"
          placeholder="John Doe"
          leftIcon={<User className="w-4 h-4" />}
          value={nama}
          onChange={(e: any) => setNama(e.target.value)}
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

        <div className="flex items-start space-x-3 pt-2">
          <div className="mt-0.5">
            <Checkbox id="terms" />
          </div>
          <label htmlFor="terms" className="text-xs font-medium text-secondary-light leading-snug cursor-pointer">
            I agree to the <a href="#" className="font-bold text-primary hover:underline">Terms of Service</a> and <a href="#" className="font-bold text-primary hover:underline">Privacy Policy</a> regarding energy usage data.
          </label>
        </div>

        <Button 
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark text-white py-6 text-sm rounded-md shadow-sm transition-all mt-6 flex items-center justify-center space-x-2"
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
