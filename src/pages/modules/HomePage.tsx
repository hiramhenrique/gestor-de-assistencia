import { useMemo, useState, type ReactNode } from 'react';
import {
  ClipboardList, Users, Activity, Package,
  TrendingUp, TrendingDown, Clock, CheckCircle2,
  AlertCircle, ArrowRight, XCircle,
} from 'lucide-react';
import type { ModuleId } from '../../types/app';
import { loadClients, type ClientRecord } from './clientsData';
import { loadOrders, type ServiceOrder } from './ordersData';

interface HomePageProps {
  onNavigate: (id: ModuleId) => void;
  userName: string;
}

const colorMap: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  violet:   { bg: 'bg-violet-50 dark:bg-violet-900/20',  text: 'text-violet-600 dark:text-violet-400',  border: 'border-violet-100 dark:border-violet-800', iconBg: 'bg-violet-100 dark:bg-violet-900/40' },
  cyan:     { bg: 'bg-cyan-50 dark:bg-cyan-900/20',      text: 'text-cyan-600 dark:text-cyan-400',      border: 'border-cyan-100 dark:border-cyan-800',    iconBg: 'bg-cyan-100 dark:bg-cyan-900/40' },
  green:    { bg: 'bg-green-50 dark:bg-green-900/20',    text: 'text-green-600 dark:text-green-400',    border: 'border-green-100 dark:border-green-800',  iconBg: 'bg-green-100 dark:bg-green-900/40' },
  blue:     { bg: 'bg-blue-50 dark:bg-blue-900/20',      text: 'text-blue-600 dark:text-blue-400',      border: 'border-blue-100 dark:border-blue-800',    iconBg: 'bg-blue-100 dark:bg-blue-900/40' },
  emerald:  { bg: 'bg-emerald-50 dark:bg-emerald-900/20',text: 'text-emerald-600 dark:text-emerald-400',border: 'border-emerald-100 dark:border-emerald-800',iconBg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  red:      { bg: 'bg-red-50 dark:bg-red-900/20',        text: 'text-red-600 dark:text-red-400',        border: 'border-red-100 dark:border-red-800',      iconBg: 'bg-red-100 dark:bg-red-900/40' },
};

const statusBadge: Record<string, string> = {
  cyan:   'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
  yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  green:  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
  red:    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

const QUICK_ACTIONS: { id?: ModuleId; label: string; icon: ReactNode; color: string; action?: 'navigate' | 'disabled' }[] = [
  { id: 'ordens', label: 'Nova OS', icon: <ClipboardList className="w-5 h-5" />, color: 'violet', action: 'navigate' },
  { id: 'clientes', label: 'Novo Cliente', icon: <Users className="w-5 h-5" />, color: 'blue', action: 'navigate' },
  { label: 'Orçamento', icon: <ClipboardList className="w-5 h-5" />, color: 'cyan', action: 'disabled' },
  { label: 'Estoque', icon: <Package className="w-5 h-5" />, color: 'green', action: 'disabled' },
  { label: 'Venda', icon: <ClipboardList className="w-5 h-5" />, color: 'emerald', action: 'disabled' },
  { label: 'Fluxo de Caixa', icon: <Activity className="w-5 h-5" />, color: 'red', action: 'disabled' },
];

function parseDateTime(value: string) {
  const match = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (!match) return 0;
  const [, day, month, year, hour = '0', minute = '0'] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
}

function getStatusColor(status: ServiceOrder['status']) {
  switch (status) {
    case 'Em andamento':
      return 'cyan';
    case 'Aguardando peça':
      return 'yellow';
    case 'Concluída':
      return 'green';
    case 'Aguardando aprovação':
      return 'violet';
    default:
      return 'violet';
  }
}

export default function HomePage({ onNavigate, userName }: HomePageProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const [orders] = useState<ServiceOrder[]>(() => loadOrders());
  const [clients] = useState<ClientRecord[]>(() => loadClients());

  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const openOrders = orders.filter((order) => order.status !== 'Concluída').length;
    const inProgress = orders.filter((order) => order.status === 'Em andamento').length;
    const completedThisMonth = orders.filter((order) => {
      if (order.status !== 'Concluída') return false;
      const [day, month, year] = (order.entryDate || '').split('/').map(Number);
      return Number.isFinite(day) && Number.isFinite(month) && Number.isFinite(year) && month === currentMonth && year === currentYear;
    }).length;

    return {
      openOrders,
      inProgress,
      completedThisMonth,
      clientsTotal: clients.length,
    };
  }, [clients, orders]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => parseDateTime(b.createdAt || b.entryDate) - parseDateTime(a.createdAt || a.entryDate))
      .slice(0, 4)
      .map((order) => ({
        id: order.id,
        client: order.client,
        device: order.device,
        status: order.status,
        statusColor: getStatusColor(order.status),
        date: order.createdAt || order.entryDate,
      }));
  }, [orders]);

  const kpiCards = [
    {
      label: 'Ordens Abertas',
      value: metrics.openOrders.toString(),
      sub: metrics.openOrders === 0 ? 'Nenhuma aberta' : `${metrics.openOrders} em aberto`,
      trend: 'up' as const,
      color: 'violet' as const,
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      label: 'Em Andamento',
      value: metrics.inProgress.toString(),
      sub: metrics.inProgress === 0 ? 'Nenhuma em execução' : `${metrics.inProgress} em andamento`,
      trend: 'up' as const,
      color: 'cyan' as const,
      icon: <Activity className="w-5 h-5" />,
    },
    {
      label: 'Concluídas (mês)',
      value: metrics.completedThisMonth.toString(),
      sub: metrics.completedThisMonth === 0 ? 'Nenhuma concluída' : `${metrics.completedThisMonth} neste mês`,
      trend: 'up' as const,
      color: 'green' as const,
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      label: 'Clientes Ativos',
      value: metrics.clientsTotal.toString(),
      sub: metrics.clientsTotal === 0 ? 'Nenhum cadastrado' : `${metrics.clientsTotal} cadastrados`,
      trend: 'up' as const,
      color: 'blue' as const,
      icon: <Users className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {greeting}, {userName}! 👋
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Aqui está o resumo do dia.{' '}
          <span className="font-medium text-violet-600 dark:text-violet-400">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const c = colorMap[kpi.color];
          return (
            <div
              key={kpi.label}
              className={`rounded-xl border p-4 ${c.bg} ${c.border} flex flex-col gap-3`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.iconBg} ${c.text}`}>
                  {kpi.icon}
                </div>
                {kpi.trend === 'up'
                  ? <TrendingUp className="w-4 h-4 text-green-500" />
                  : <TrendingDown className="w-4 h-4 text-red-400" />}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{kpi.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{kpi.label}</p>
                <p className={`text-xs font-medium mt-0.5 ${c.text}`}>{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Ordens Recentes</h3>
            <button
              type="button"
              onClick={() => onNavigate('ordens')}
              className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
            >
              Ver todas <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentOrders.length === 0 ? (
              <div className="px-5 py-6 text-sm text-gray-500 dark:text-gray-400">Nenhuma ordem cadastrada ainda.</div>
            ) : recentOrders.map((order) => (
              <div key={order.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="shrink-0 w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{order.client}</p>
                  <p className="text-xs text-gray-400 truncate">{order.device}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge[order.statusColor]}`}>
                    {order.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3" /> {order.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Ações Rápidas</h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const c = colorMap[action.color];
              const isClickable = action.action === 'navigate' && action.id;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => {
                    if (isClickable && action.id) {
                      onNavigate(action.id);
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 border transition-all ${isClickable ? 'hover:scale-[1.03] active:scale-[0.98]' : 'cursor-default opacity-80'} ${c.bg} ${c.border}`}
                >
                  <span className={`${c.text}`}>{action.icon}</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500" /> Alertas do Sistema
          </h3>
        </div>
        <div className="px-5 py-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
            <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-red-700 dark:text-red-400">{metrics.openOrders} OS abertas</p>
              <p className="text-xs text-red-500 dark:text-red-500 mt-0.5">Acompanhe os prazos ativos.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
            <Package className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">Estoque em revisão</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">Acompanhe peças e componentes sem ação no momento.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-100 dark:border-violet-800">
            <Users className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">{metrics.clientsTotal} clientes</p>
              <p className="text-xs text-violet-500 dark:text-violet-500 mt-0.5">Base atualizada no cadastro.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
