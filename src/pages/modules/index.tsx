import { Activity, CheckCircle2, MessageCircleMore, Package, ShoppingCart, Wallet, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import PlaceholderPage from './PlaceholderPage';
import OrdensPageComponent from './OrdensPage';
import ClientesPageComponent from './ClientesPage';
import FuncionariosPageComponent from './FuncionariosPage';
import FormulariosPageComponent from './FormulariosPage';
import OrcamentosPageComponent from './OrcamentosPage';
import { useAuth } from '../../contexts/AuthContext';
import { loadOrders, saveOrders, type OrderStatus, type ServiceOrder } from './ordersData';

const statusSequence: OrderStatus[] = ['Em análise', 'Aguardando peça', 'Em andamento', 'Aguardando aprovação', 'Concluída'];

const statusStyles: Record<OrderStatus, string> = {
  'Em análise': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  'Aguardando peça': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'Em andamento': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  'Aguardando aprovação': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Concluída: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

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
  const { user } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    loadOrders(user.id).then((items) => setOrders(items));
  }, [user?.id]);

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status !== 'Concluída').sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders],
  );

  const updateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    const updated = orders.map((order) => order.id === orderId ? { ...order, status: nextStatus } : order);
    setOrders(updated);
    await saveOrders(user?.id, updated);
  };

  const openWhatsApp = (order: ServiceOrder) => {
    const digits = order.phone.replace(/\D/g, '');
    if (!digits) return;

    const message = `Olá ${order.client}!\nSeu aparelho ${order.device} está com status: ${order.status}.\nAcompanhe a ordem ${order.id}.`;
    const link = `https://wa.me/55${digits}?text=${encodeURIComponent(message)}`;
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm dark:border-cyan-900/40 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">Acompanhamento</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Ordens em aberto</h2>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {pendingOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            Nenhuma ordem pendente no momento.
          </div>
        ) : (
          pendingOrders.map((order) => {
            const activeIndex = statusSequence.indexOf(order.status);

            return (
              <div key={order.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">{order.id}</span>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[order.status]}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{order.client}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Aparelho: <span className="font-semibold">{order.device}</span></p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openWhatsApp(order)}
                    disabled={!order.phone || order.phone === 'Não informado'}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
                  >
                    <MessageCircleMore className="h-4 w-4" />
                    Enviar status
                  </button>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                    <span>Progresso</span>
                    <span>{activeIndex + 1}/{statusSequence.length}</span>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {statusSequence.map((status, index) => {
                      const isActive = index <= activeIndex;
                      const isCurrent = index === activeIndex;

                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => updateStatus(order.id, status)}
                          className={`rounded-xl border px-2 py-2 text-center text-[10px] font-semibold transition ${
                            isActive
                              ? `${statusStyles[status]} border-transparent shadow-sm`
                              : 'border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
                          } ${isCurrent ? 'ring-2 ring-cyan-300 dark:ring-cyan-700' : ''}`}
                          title={`Definir status como ${status}`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <span>Responsável: {order.technician}</span>
                  <span className="inline-flex items-center gap-1">
                    {activeIndex === statusSequence.length - 1 ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <span className="h-2 w-2 rounded-full bg-cyan-500" />}
                    {order.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
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
