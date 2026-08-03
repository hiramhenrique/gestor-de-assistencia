import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  loading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  loading = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variant === 'primary' && [
          'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800',
          'focus:ring-violet-500',
        ],
        variant === 'secondary' && [
          'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200',
          'border border-gray-300 dark:border-gray-600',
          'hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600',
          'focus:ring-violet-400',
        ],
        variant === 'ghost' && [
          'text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30',
          'focus:ring-violet-400',
        ],
        variant === 'outline' && [
          'border border-violet-300 bg-transparent text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/30',
          'focus:ring-violet-400',
        ],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Aguarde...
        </>
      ) : (
        children
      )}
    </button>
  );
}
