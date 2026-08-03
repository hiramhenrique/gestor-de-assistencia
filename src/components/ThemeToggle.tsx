import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';

interface ThemeToggleProps {
  /** Quando true, renderiza sem posicionamento fixed (para uso dentro do header) */
  inline?: boolean;
}

export default function ThemeToggle({ inline = false }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className={clsx(
        'flex items-center justify-center w-9 h-9 rounded-full transition-all hover:scale-105 active:scale-95',
        'text-violet-600 dark:text-violet-400',
        inline
          ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          : 'fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 border border-violet-200 dark:border-violet-700 shadow-md hover:shadow-lg'
      )}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
