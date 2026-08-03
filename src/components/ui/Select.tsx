import { type SelectHTMLAttributes } from 'react';
import clsx from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export default function Select({ label, error, options, placeholder, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {props.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        className={clsx(
          'w-full rounded-lg border border-gray-300 dark:border-gray-600',
          'bg-white dark:bg-gray-800',
          'px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100',
          'transition-colors focus:outline-none focus:ring-2',
          'focus:ring-violet-500 focus:border-violet-500',
          'dark:focus:ring-violet-400 dark:focus:border-violet-400',
          error && 'border-red-400 focus:ring-red-400 focus:border-red-400',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
