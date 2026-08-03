import { Bell, Search, User, LogOut } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import type { ModuleId } from '../../types/app';

const PAGE_TITLES: Record<ModuleId, string> = {
  dashboard:      'Dashboard',
  ordens:         'Ordens de Serviço',
  formularios:    'Formulários',
  clientes:       'Clientes',
  funcionarios:   'Funcionários',
  estoque:        'Estoque',
  orcamentos:     'Orçamentos',
  vendas:         'Vendas',
  'fluxo-caixa':  'Fluxo de Caixa',
  acompanhamento: 'Acompanhamento de Serviços',
  cancelamentos:  'Cancelamentos',
};

interface AppHeaderProps {
  active: ModuleId;
  userName: string;
  onLogout: () => void;
}

export default function AppHeader({ active, userName, onLogout }: AppHeaderProps) {
  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-5 gap-4 shrink-0">
      {/* Título da página atual */}
      <div className="flex-1">
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {PAGE_TITLES[active]}
        </h1>
      </div>

      {/* Busca */}
      <div className="relative hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar..."
          className="pl-9 pr-4 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 w-48 placeholder:text-gray-400 transition-all"
        />
      </div>

      {/* Notificações */}
      <button className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <Bell className="w-5 h-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500" />
      </button>

      {/* Dark mode toggle */}
      <div className="relative">
        <ThemeToggle inline />
      </div>

      {/* Usuário */}
      <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
        <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/50 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
          {userName}
        </span>
        <button
          onClick={onLogout}
          title="Sair"
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
