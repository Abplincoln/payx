import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 border border-transparent',
  secondary:
    'bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800 border border-transparent',
  outline:
    'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 active:bg-gray-100',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 border border-transparent',
  danger:
    'bg-error-600 text-white hover:bg-error-700 active:bg-error-800 border border-transparent',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 rounded-md gap-1.5',
  md: 'text-sm px-4 py-2 rounded-lg gap-2',
  lg: 'text-base px-5 py-2.5 rounded-lg gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
