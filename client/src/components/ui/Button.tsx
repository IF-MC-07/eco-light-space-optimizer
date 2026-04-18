import React, { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'inverted' | 'outlined' | 'edit' | 'action' | 'icon-gray' | 'icon-red';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function Button({ variant = 'primary', fullWidth, className = '', children, ...props }: ButtonProps) {
  let baseStyles = 'inline-flex items-center justify-center transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  if (['primary', 'secondary', 'inverted', 'outlined', 'action'].includes(variant)) {
    baseStyles += ' px-4 py-2 text-sm font-medium';
  }

  const variants = {
    primary: 'bg-primary text-white rounded-md hover:bg-primary-dark',
    secondary: 'bg-secondary text-white rounded-md hover:bg-secondary-dark',
    inverted: 'bg-primary-dark text-white rounded-md hover:bg-primary',
    outlined: 'bg-transparent border border-secondary text-secondary rounded-md hover:bg-secondary hover:text-white',
    edit: 'bg-tertiary text-white p-2 rounded-md hover:bg-tertiary-dark',
    action: 'bg-primary text-white p-2 rounded-md hover:bg-primary-dark',
    'icon-gray': 'bg-secondary text-white p-2 rounded-md hover:bg-secondary-dark',
    'icon-red': 'bg-tertiary text-white p-2 rounded-md hover:bg-tertiary-dark',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
