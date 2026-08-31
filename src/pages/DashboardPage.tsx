import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { ModuleId } from '../types/app';
import Sidebar from '../components/layout/Sidebar';
import AppHeader from '../components/layout/AppHeader';
import HomePage from './modules/HomePage';
import {
  OrdensPage, ClientesPage, FuncionariosPage, EstoquePage, OrcamentosPage,
  VendasPage, FluxoCaixaPage, AcompanhamentoPage,
} from './modules';
import { FormulariosPage } from './modules';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [active, setActive] = useState<ModuleId>('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const firstName = user?.fullName?.split(' ')[0] ?? 'Usuário';

  function renderPage() {
    switch (active) {
      case 'formularios':   return <FormulariosPage />;
      case 'ordens':         return <OrdensPage onNavigate={setActive} />;
      case 'clientes':       return <ClientesPage />;
      case 'funcionarios':   return <FuncionariosPage />;
      case 'estoque':        return <EstoquePage />;
      case 'orcamentos':     return <OrcamentosPage />;
      case 'vendas':         return <VendasPage />;
      case 'fluxo-caixa':    return <FluxoCaixaPage />;
      case 'acompanhamento': return <AcompanhamentoPage />;
      default:               return <HomePage onNavigate={setActive} userName={firstName} />;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Sidebar */}
      <Sidebar
        active={active}
        onNavigate={setActive}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppHeader
          active={active}
          userName={firstName}
          onLogout={logout}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
