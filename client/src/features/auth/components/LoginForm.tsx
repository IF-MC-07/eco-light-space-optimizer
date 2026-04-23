import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col justify-center h-full">
      <h2 className="font-heading text-3xl font-bold text-secondary-dark mb-2">Welcome Back</h2>
      <p className="text-secondary-light text-sm mb-8 leading-relaxed">
        Please enter your credentials to manage your ecosystem.
      </p>

      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          leftIcon={<Mail className="w-4 h-4" />}
        />

        <div className="space-y-4">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
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
            <a href="#" className="text-xs font-bold text-primary hover:text-primary-dark transition-colors">
              Forgot password?
            </a>
          </div>
        </div>

        <Button className="w-full bg-primary hover:bg-primary-dark text-white py-6 text-sm rounded-md shadow-sm transition-all mt-4">
          Login
        </Button>
      </form>

      <div className="flex items-center my-8">
        <div className="flex-1 border-t border-neutral-border"></div>
        <span className="px-4 text-[10px] font-bold text-secondary-light uppercase tracking-wider">Or Continue With</span>
        <div className="flex-1 border-t border-neutral-border"></div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Button variant="outline" className="w-full bg-[#F8FAFC] border-none hover:bg-neutral-border/50 text-secondary-dark py-5 text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-2">
          <FcGoogle className="w-5 h-5" />
          Google
        </Button>
        <Button variant="outline" className="w-full bg-[#F8FAFC] border-none hover:bg-neutral-border/50 text-secondary-dark py-5 text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-2">
          <FaApple className="w-5 h-5 text-black" />
          Apple
        </Button>
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
