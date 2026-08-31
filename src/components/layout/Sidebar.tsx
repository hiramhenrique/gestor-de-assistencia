import {
  LayoutDashboard,
  ClipboardList,
  Users,
  UserCog,
  Package,
  FileText,
  Printer,
  ShoppingCart,
  Wallet,
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { ModuleId } from '../../types/app';
import Logo from '../Logo';
import clsx from 'clsx';

interface SidebarProps {
  active: ModuleId;
  onNavigate: (id: ModuleId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const NAV_ITEMS: { id: ModuleId; label: string; icon: React.ReactNode; badge?: number }[] = [
  { id: 'dashboard',      label: 'Dashboard',            icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'ordens',         label: 'Ordens de Serviço',    icon: <ClipboardList    className="w-5 h-5" /> },
  { id: 'formularios',    label: 'Formulários',          icon: <Printer          className="w-5 h-5" /> },
  { id: 'acompanhamento', label: 'Acompanhamento',        icon: <Activity         className="w-5 h-5" /> },
  { id: 'clientes',       label: 'Clientes',              icon: <Users            className="w-5 h-5" /> },
  { id: 'funcionarios',   label: 'Funcionários',          icon: <UserCog          className="w-5 h-5" /> },
  { id: 'orcamentos',     label: 'Orçamentos',            icon: <FileText         className="w-5 h-5" /> },
  { id: 'vendas',         label: 'Vendas',                icon: <ShoppingCart     className="w-5 h-5" /> },
  { id: 'estoque',        label: 'Estoque',               icon: <Package          className="w-5 h-5" /> },
  { id: 'fluxo-caixa',    label: 'Fluxo de Caixa',       icon: <Wallet           className="w-5 h-5" /> },
];

export default function Sidebar({ active, onNavigate, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className={clsx(
        'relative flex flex-col h-screen bg-gray-900 dark:bg-gray-950 transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={clsx(
        'flex items-center h-16 border-b border-gray-700/60 shrink-0 overflow-hidden transition-all',
        collapsed ? 'justify-center px-0' : 'px-5'
      )}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center shrink-0">
            <Logo className="w-6 h-auto" />
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-gray-700 rounded-xl px-3 py-1.5">
            <Logo className="w-28 h-auto" />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={clsx(
                'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group',
                isActive
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {!collapsed && item.badge !== undefined && (
                <span className={clsx(
                  'ml-auto text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center',
                  isActive ? 'bg-white/20 text-white' : 'bg-violet-500/20 text-violet-400'
                )}>
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge !== undefined && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-violet-500" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="shrink-0 border-t border-gray-700/60 p-2">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center rounded-xl p-2 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-all"
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4" />
            : <><ChevronLeft className="w-4 h-4" /><span className="text-xs ml-2">Recolher</span></>
          }
        </button>
      </div>
    </aside>
  );
}
