import React, { useState } from "react";
import { User, Mail, Building, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";
import { useAuth } from "../../../hooks/useAuth";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { register, loading, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !username || !email || !password) return;
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const res = await register(nama, username, email, password);
    if (res.success) {
      router.push("/login");
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="w-60 h-60 flex items-center justify-center mx-auto">
          <img src="images/Logo Eco-Light.png" alt="Logo" />
        </div>
        <h2 className="font-heading text-3xl font-bold text-secondary-dark mb-2">Create Account</h2>
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
