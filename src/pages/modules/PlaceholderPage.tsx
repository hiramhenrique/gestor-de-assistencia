import { type ReactNode } from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
}

export default function PlaceholderPage({ title, description, icon, color }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 ${color}`}>
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">{description}</p>
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-500 dark:text-gray-400">
        <Construction className="w-4 h-4" />
        Módulo em desenvolvimento
      </div>
    </div>
  );
}
