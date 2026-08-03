import { Package }         from 'lucide-react';
import { ShoppingCart }    from 'lucide-react';
import { Wallet }          from 'lucide-react';
import { Activity }        from 'lucide-react';
import { XCircle }         from 'lucide-react';
import type { ComponentProps } from 'react';
import PlaceholderPage from './PlaceholderPage';
import OrdensPageComponent from './OrdensPage';
import ClientesPageComponent from './ClientesPage';
import FuncionariosPageComponent from './FuncionariosPage';
import FormulariosPageComponent from './FormulariosPage';
import OrcamentosPageComponent from './OrcamentosPage';

export function OrdensPage(props: ComponentProps<typeof OrdensPageComponent>) {
  return <OrdensPageComponent {...props} />;
}

export function ClientesPage() {
  return <ClientesPageComponent />;
}

export function FuncionariosPage() {
  return <FuncionariosPageComponent />;
}

export function EstoquePage() {
  return <PlaceholderPage
    title="Estoque"
    description="Controle de peças, componentes e produtos. Alertas de estoque mínimo automáticos."
    icon={<Package className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />}
    color="bg-emerald-100 dark:bg-emerald-900/30"
  />;
}

export function OrcamentosPage() {
  return <OrcamentosPageComponent />;
}

export function VendasPage() {
  return <PlaceholderPage
    title="Vendas"
    description="Registro de vendas de produtos e serviços com emissão de comprovantes."
    icon={<ShoppingCart className="w-9 h-9 text-green-600 dark:text-green-400" />}
    color="bg-green-100 dark:bg-green-900/30"
  />;
}

export function FluxoCaixaPage() {
  return <PlaceholderPage
    title="Fluxo de Caixa"
    description="Controle financeiro completo: entradas, saídas, saldo e relatórios por período."
    icon={<Wallet className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />}
    color="bg-emerald-100 dark:bg-emerald-900/30"
  />;
}

export function AcompanhamentoPage() {
  return <PlaceholderPage
    title="Acompanhamento de Serviços"
    description="Visão em tempo real do andamento de todas as ordens. Status, técnicos e prazos."
    icon={<Activity className="w-9 h-9 text-cyan-600 dark:text-cyan-400" />}
    color="bg-cyan-100 dark:bg-cyan-900/30"
  />;
}

export function CancelamentosPage() {
  return <PlaceholderPage
    title="Cancelamentos"
    description="Registro e análise de cancelamentos. Motivos, histórico e indicadores de retenção."
    icon={<XCircle className="w-9 h-9 text-red-600 dark:text-red-400" />}
    color="bg-red-100 dark:bg-red-900/30"
  />;
}

export function FormulariosPage() {
  return <FormulariosPageComponent />;
}
