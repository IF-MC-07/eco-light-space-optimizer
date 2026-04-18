import React, { InputHTMLAttributes, ReactNode, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ leftIcon, rightIcon, label, error, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className={`w-full flex flex-col gap-1.5 ${className}`}>
        {label && <label htmlFor={inputId} className="text-sm font-semibold text-secondary-dark">{label}</label>}
        <div className="relative flex items-center w-full">
          {leftIcon && <div className="absolute left-3 text-secondary-light flex items-center">{leftIcon}</div>}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-[#E2E8F0] bg-opacity-40 border-none rounded-md text-sm text-secondary-dark placeholder-secondary-light focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 transition-colors ${leftIcon ? 'pl-10' : 'pl-3'} ${rightIcon ? 'pr-10' : 'pr-3'} py-3`}
            {...props}
          />
          {rightIcon && <div className="absolute right-3 text-secondary-light flex items-center">{rightIcon}</div>}
        </div>
        {error && <span className="text-xs text-tertiary">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
