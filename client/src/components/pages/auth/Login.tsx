"use client";

import React from 'react';
import { Mail, Lock, Eye } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Checkbox } from '../../ui/Checkbox';

export default function Login() {
  return (
    <div className="min-h-screen bg-neutral flex items-center justify-center p-4">
      <div className="bg-neutral-surface shadow-elevated rounded-xl max-w-[950px] w-full flex flex-col md:flex-row overflow-hidden min-h-[600px]">
        {/* Left Column (Brand/Editorial) */}
        <div className="w-full md:w-[45%] bg-[#F8FAFC] p-12 flex flex-col justify-between relative overflow-hidden hidden md:flex border-r border-[#E2E8F0] shadow-[inset_-10px_0_20px_-20px_rgba(0,0,0,0.1)]">
          {/* Abstract leaf frame graphic */}
          <div className="absolute inset-0 z-0 flex items-center justify-center p-8 opacity-40">
            <div className="w-full h-[120%] -mt-10 border-[30px] border-white bg-transparent shadow-sm relative">
              {/* SVG Leaf Placeholder */}
              <svg className="absolute -right-24 bottom-16 w-[400px] h-[400px] text-neutral-muted opacity-80" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 8C8 10 5.9 16.19 2 22C4.38 21.36 9 19.38 10.97 14.5C9.82 13 8.35 12.39 6.27 12.31C8.6 11.23 12 11.08 15 13.9C15 8.5 17.5 4 22 2C19.5 4 18.25 5.5 17 8Z" />
              </svg>
            </div>
          </div>

          <div className="relative z-10 w-full mb-8">
            <div className="flex items-center gap-2 mb-16">
              <div className="text-primary font-bold text-2xl flex items-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 19.93C7.06 19.43 4 16.05 4 12C4 7.95 7.06 4.57 11 4.07V19.93ZM13 4.07C16.94 4.57 20 7.95 20 12C20 16.05 16.94 19.43 13 19.93V4.07Z" fill="currentColor" />
                </svg>
                <div className="flex flex-col ml-0.5">
                  <span className="text-neutral-900 tracking-tight leading-none">Eco-Light</span>
                  <span className="text-[10px] text-primary-light font-medium tracking-wide uppercase leading-tight mt-0.5">Space Optimizer</span>
                </div>
              </div>
            </div>

            <h1 className="text-[40px] font-heading mb-5 leading-[1.1] tracking-tight">
              Cultivating<br />
              <span className="text-primary">Sustainable</span><br />
              Intelligence.
            </h1>

            <p className="text-secondary text-sm leading-relaxed max-w-[280px]">
              Access your digital arboretum and optimize your energy footprint with our editorial-grade space management dashboard.
            </p>
          </div>

          <div className="relative z-10 bg-neutral-surface/90 backdrop-blur-md p-6 rounded-lg shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-white max-w-[300px]">
            <p className="italic text-secondary text-sm mb-3">
              "Efficiency is not just a metric; it's a living asset."
            </p>
            <p className="text-[10px] font-bold text-primary tracking-widest uppercase">
              Eco-Light Philosophy
            </p>
          </div>
        </div>

        {/* Right Column (Form) */}
        <div className="w-full md:w-[55%] p-10 sm:p-14 lg:p-16 flex flex-col justify-center bg-white relative z-20">
          <div className="w-full max-w-[360px] mx-auto">
            <h2 className="text-2xl font-heading mb-2">Welcome Back</h2>
            <p className="text-secondary text-sm mb-8 pr-4">
              Please enter your credentials to manage your ecosystem.
            </p>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <Input
                label="Email Address"
                type="email"
                placeholder="name@company.com"
                leftIcon={<Mail className="w-[18px] h-[18px]" />}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="w-[18px] h-[18px]" />}
                rightIcon={<Eye className="w-[18px] h-[18px]" />}
              />

              <div className="flex items-center justify-between pt-1 pb-2">
                <Checkbox label="Remember me" id="remember" />
                <a href="#" className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
                  Forgot password?
                </a>
              </div>

              <Button variant="primary" fullWidth className="py-3 shadow-sm text-base">
                Login
              </Button>
            </form>

            <div className="relative mt-10 mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-4 text-secondary-light font-bold tracking-[0.15em] text-[10px] uppercase">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <button type="button" className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors rounded-md text-sm font-semibold text-secondary-dark border border-neutral-border/50">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              <button type="button" className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors rounded-md text-sm font-semibold text-secondary-dark border border-neutral-border/50">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.82 3.59-.85 1.48-.05 2.66.75 3.38 1.84-2.9 1.67-2.4 5.33.51 6.47-.64 1.76-1.55 3.65-2.56 4.71zm-4.32-14.7c-.2-1.63 1.25-3.15 2.91-3.3.36 1.76-1.46 3.27-2.91 3.3z" />
                </svg>
                Apple
              </button>
            </div>

            <p className="text-center text-sm text-secondary">
              Don't have an account? <a href="#" className="font-bold text-primary hover:underline ml-1">Register here</a>
            </p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 w-full text-center pointer-events-none mt-4">
        <p className="text-[10px] sm:text-xs font-bold text-secondary tracking-widest uppercase">
          © 2024 Eco-Light Systems. All rights reserved.
        </p>
      </div>
    </div>
  );
}
