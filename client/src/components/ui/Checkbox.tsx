import React, { InputHTMLAttributes, forwardRef } from 'react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const checkboxId = id || props.name;
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <input
          type="checkbox"
          id={checkboxId}
          ref={ref}
          className="w-4 h-4 rounded-sm border-neutral-border text-primary focus:ring-primary focus:ring-offset-0 bg-neutral-surface cursor-pointer"
          {...props}
        />
        {label && (
          <label htmlFor={checkboxId} className="text-sm font-medium text-secondary cursor-pointer">
            {label}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';
