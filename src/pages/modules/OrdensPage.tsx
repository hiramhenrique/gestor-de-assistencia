import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ClipboardList,
  FileText,
  Monitor,
  PlusCircle,
  Printer,
  Search,
  Trash2,
  User,
  Wrench,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import type { ModuleId } from '../../types/app';
import { useAuth } from '../../contexts/AuthContext';
import { saveOrders, subscribeOrders, type OrderPriority, type OrderStatus, type ServiceOrder } from './ordersData';
import { loadClients, type ClientRecord } from './clientsData';
import { loadEmployees, type EmployeeRecord } from './employeesData';
import { buildPublicStatusUrl, savePublicStatus } from './publicStatus';

const statusStyles: Record<OrderStatus, string> = {
  'Em análise': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Aguardando aprovação': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Aguardando peça': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Em andamento': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  Concluída: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const emptyDraft = {
  clientId: '',
  client: '',
  phone: '',
  device: '',
  serial: '',
  problem: '',
  status: 'Em análise' as OrderStatus,
  priority: 'Média' as OrderPriority,
  technicianId: '',
  technician: '',
  entryDate: new Date().toLocaleDateString('pt-BR'),
  deadline: '',
  budget: '',
  warranty: '',
  usedParts: '',
  observations: '',
  serviceValue: '',
};

interface OrdensPageProps {
  onNavigate?: (module: ModuleId) => void;
}

export default function OrdensPage({ onNavigate }: OrdensPageProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [printTarget, setPrintTarget] = useState<ServiceOrder | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<ServiceOrder | null>(null);
  const [paymentDraft, setPaymentDraft] = useState({ method: 'Dinheiro', received: '', spent: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'todos' | OrderStatus>('todos');
  const [priorityFilter, setPriorityFilter] = useState<'todos' | OrderPriority>('todos');
  const [draft, setDraft] = useState(emptyDraft);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = subscribeOrders(user.id, (nextOrders) => {
      setOrders(nextOrders);
      setSelectedId((current) => {
        if (current && nextOrders.some((order) => order.id === current)) {
          return current;
        }
        return nextOrders[0]?.id ?? null;
      });
    });

    Promise.all([loadClients(user.id), loadEmployees(user.id)]).then(([nextClients, nextEmployees]) => {
      setClients(nextClients);
      setEmployees(nextEmployees);
    });

    return unsubscribe;
  }, [user?.id]);

  const selectedClientFromDraft = clients.find((client) => client.name.toLowerCase() === draft.client.trim().toLowerCase());
  const isNewClient = draft.client.trim().length > 0 && !selectedClientFromDraft;

  const filteredOrders = useMemo(() => {
    const search = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch = !search || [order.id, order.client, order.device, order.problem, order.technician].join(' ').toLowerCase().includes(search);
      const matchesStatus = statusFilter === 'todos' || order.status === statusFilter;
      const matchesPriority = priorityFilter === 'todos' || order.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [orders, query, statusFilter, priorityFilter]);

  const selectedOrder = filteredOrders.find((order) => order.id === selectedId) ?? filteredOrders[0] ?? null;
  const activeOrders = useMemo(() => filteredOrders.filter((order) => order.status !== 'Concluída'), [filteredOrders]);
  const completedOrders = useMemo(() => filteredOrders.filter((order) => order.status === 'Concluída'), [filteredOrders]);

  const getOrderVisualState = (order: ServiceOrder) => {
    const hasPaymentInfo = Boolean(order.paymentMethod || typeof order.paymentReceived === 'number' || typeof order.paymentSpent === 'number');
    if (order.status === 'Concluída' && hasPaymentInfo) {
      return {
        badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        label: 'Concluída',
      };
    }

    return {
      badgeClass: statusStyles[order.status],
      label: order.status,
    };
  };

  const getPaymentStateForStatus = (status: OrderStatus, currentOrder?: ServiceOrder) => {
    if (status !== 'Concluída') {
      return {
        paymentMethod: undefined,
        paymentReceived: undefined,
        paymentSpent: undefined,
      };
    }

    if (currentOrder && currentOrder.status === 'Concluída') {
      return {
        paymentMethod: currentOrder.paymentMethod,
        paymentReceived: currentOrder.paymentReceived,
        paymentSpent: currentOrder.paymentSpent,
      };
    }

    return {
      paymentMethod: undefined,
      paymentReceived: undefined,
      paymentSpent: undefined,
    };
  };

  const handleRegisterPayment = async () => {
    if (!paymentTarget || !user?.id) return;

    const parsedReceived = Number(String(paymentDraft.received).replace(/[R$\s.]/g, '').replace(',', '.'));
    const parsedSpent = Number(String(paymentDraft.spent).replace(/[R$\s.]/g, '').replace(',', '.'));

    const nextOrders = orders.map((order) => order.id === paymentTarget.id
      ? {
          ...order,
          paymentMethod: paymentDraft.method,
          paymentReceived: Number.isFinite(parsedReceived) ? parsedReceived : 0,
          paymentSpent: Number.isFinite(parsedSpent) ? parsedSpent : 0,
        }
      : order,
    );

    setOrders(nextOrders);
    await saveOrders(user.id, nextOrders);
    setShowPaymentModal(false);
    setPaymentTarget(null);
    setPaymentDraft({ method: 'Dinheiro', received: '', spent: '' });
  };

  const handleCreateOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const selectedClient = clients.find((client) => client.name.toLowerCase() === draft.client.trim().toLowerCase());
    const selectedEmployee = employees.find((employee) => employee.name.toLowerCase() === draft.technician.trim().toLowerCase());
    const paymentState = getPaymentStateForStatus(draft.status, isEditing ? selectedOrder ?? undefined : undefined);
    const baseOrder: Omit<ServiceOrder, 'id'> = {
      publicStatusId: isEditing ? selectedOrder?.publicStatusId || crypto.randomUUID() : crypto.randomUUID(),
      client: selectedClient?.name || draft.client || 'Cliente não informado',
      phone: selectedClient?.phone || draft.phone || 'Não informado',
      device: draft.device || 'Dispositivo não informado',
      serial: draft.serial || 'Sem serial',
      problem: draft.problem || 'Descrição em branco',
      status: draft.status,
      priority: draft.priority,
      technician: selectedEmployee?.name || draft.technician || 'A definir',
      entryDate: draft.entryDate || new Date().toLocaleDateString('pt-BR'),
      deadline: draft.deadline || 'A definir',
      budget: draft.budget || 'R$ 0,00',
      warranty: draft.warranty || 'Sem garantia',
      usedParts: draft.usedParts.split(',').map((part) => part.trim()).filter(Boolean),
      observations: draft.observations || 'Nenhuma observação.',
      createdAt: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      serviceValue: draft.serviceValue || 'R$ 0,00',
      paymentMethod: paymentState.paymentMethod,
      paymentReceived: paymentState.paymentReceived,
      paymentSpent: paymentState.paymentSpent,
      clientId: selectedClient?.id || draft.clientId || '',
      technicianId: selectedEmployee?.id || draft.technicianId || '',
    };

    let savedOrderId: string | null = null;

    try {
      if (isEditing && selectedOrder) {
        const updatedOrders = orders.map((order) =>
          order.id === selectedOrder.id
            ? { ...order, ...baseOrder }
            : order
        );
        setOrders(updatedOrders);
        await saveOrders(user?.id, updatedOrders);

        savedOrderId = selectedOrder.id;
        setSelectedId(selectedOrder.id);
      } else {
        const nextNumber = orders.reduce((max, order) => {
          const parsed = Number(order.id.match(/\d+/)?.[0] ?? 0);
          return Math.max(max, parsed);
        }, 0) + 1;
        const nextOrder: ServiceOrder = {
          id: `OS-${String(nextNumber).padStart(4, '0')}`,
          ...baseOrder,
        };

        const next = [nextOrder, ...orders];
        setOrders(next);
        await saveOrders(user?.id, next);

        savedOrderId = nextOrder.id;
        setSelectedId(nextOrder.id);
      }

      if (savedOrderId) {
        try {
          await savePublicStatus({
            statusId: baseOrder.publicStatusId,
            orderId: savedOrderId,
            client: baseOrder.client,
            device: baseOrder.device,
            phone: baseOrder.phone,
            status: baseOrder.status,
            updatedAt: new Date().toISOString(),
            shareUrl: buildPublicStatusUrl(baseOrder.publicStatusId || savedOrderId, savedOrderId),
          });
        } catch (statusError) {
          console.error('Erro ao salvar status público da ordem:', statusError);
        }
      }
    } finally {
      setShowForm(false);
      setIsEditing(false);
      setDraft(emptyDraft);
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    const next = orders.filter((order) => order.id !== selectedOrder.id);
    setOrders(next);
    await saveOrders(user?.id, next);
    setSelectedId(null);
    setShowDeleteConfirm(false);
  };

  const handleOpenDetails = (order: ServiceOrder) => {
    setSelectedId(order.id);
    setDraft({
      clientId: order.clientId,
      client: order.client,
      phone: order.phone,
      device: order.device,
      serial: order.serial,
      problem: order.problem,
      status: order.status,
      priority: order.priority,
      technicianId: order.technicianId,
      technician: order.technician,
      entryDate: order.entryDate,
      deadline: order.deadline,
      budget: order.budget,
      warranty: order.warranty,
      usedParts: order.usedParts.join(', '),
      observations: order.observations,
      serviceValue: order.serviceValue,
    });
    setShowDetailsModal(true);
    setIsEditing(false);
  };

  const handleEditOrder = (order: ServiceOrder) => {
    setSelectedId(order.id);
    setDraft({
      clientId: order.clientId,
      client: order.client,
      phone: order.phone,
      device: order.device,
      serial: order.serial,
      problem: order.problem,
      status: order.status,
      priority: order.priority,
      technicianId: order.technicianId,
      technician: order.technician,
      entryDate: order.entryDate,
      deadline: order.deadline,
      budget: order.budget,
      warranty: order.warranty,
      usedParts: order.usedParts.join(', '),
      observations: order.observations,
      serviceValue: order.serviceValue,
    });
    setShowDetailsModal(false);
    setShowForm(true);
    setIsEditing(true);
  };

  const handlePrintOrder = (order?: ServiceOrder) => {
    const target = order ?? selectedOrder;
    if (!target) return;
    setPrintTarget(target);
    setShowPrintOptions(true);
  };

  const performPrint = (type: 'os' | 'garantia' | 'termo' | 'laudo' | 'orcamento' | 'promissoria') => {
    const target = printTarget ?? selectedOrder;
    if (!target) return;
    const safe = (str?: string) => (str || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!printWindow) return;

    let body = '';
    const header = `<div class="header"><div><div class="company">MIRACELL</div><div class="small">Praça Doutor Wenceslau Braz, 95 - Centro • Itajubá / MG</div><div class="small">Telefone: (35) 99149-2868 • CNPJ: 24.096.516/0001-40</div></div><div class="meta"><div><strong>Nº OS:</strong> ${safe(target.id)}</div><div><strong>Dt. Entrada:</strong> ${safe(target.entryDate)}</div><div><strong>Status:</strong> ${safe(target.status)}</div></div></div>`;

    switch (type) {
      case 'os':
        body = `
          <h2 class="title">ORDEM DE SERVIÇO</h2>
          <table class="grid">` +
          `<tr><th style="width:65%">Cliente</th><th style="width:35%">Equipamento</th></tr>` +
          `<tr><td>${safe(target.client)}</td><td>${safe(target.device)}</td></tr>` +
          `<tr><th colspan="2">Problema informado</th></tr><tr><td colspan="2">${safe(target.problem)}</td></tr>` +
          `</table>`;
        break;
      case 'garantia':
        body = `<h2 class="title">GARANTIA</h2><p><strong>Cliente:</strong> ${safe(target.client)}</p><p><strong>Equipamento:</strong> ${safe(target.device)}</p><p><strong>Garantia:</strong> ${safe(target.warranty)}</p>`;
        break;
      case 'termo':
        body = `<h2 class="title">TERMO DE RESPONSABILIDADE</h2><p>${safe(target.observations || 'Termo padrão de responsabilidade')}</p>`;
        break;
      case 'laudo':
        body = `<h2 class="title">LAUDO TÉCNICO</h2><p><strong>Cliente:</strong> ${safe(target.client)}</p><p><strong>Problema:</strong> ${safe(target.problem)}</p><p><strong>Laudo:</strong> ${safe(target.observations)}</p>`;
        break;
      case 'orcamento':
        body = `<h2 class="title">ORÇAMENTO</h2><p><strong>Cliente:</strong> ${safe(target.client)}</p><p><strong>Valor do serviço:</strong> ${safe(target.serviceValue || 'R$ 0,00')}</p><p><strong>Orçamento:</strong> ${safe(target.budget || 'R$ 0,00')}</p>`;
        break;
      case 'promissoria':
        body = `<h2 class="title">PROMISSÓRIA</h2><p><strong>Cliente:</strong> ${safe(target.client)}</p><p>Documento promissório referente à OS ${safe(target.id)}</p>`;
        break;
    }

    printWindow.document.write(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Imprimir ${safe(target.id)}</title>
          <style>
            @media print { @page { margin: 20mm } }
            body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 20px; }
            .header { display:flex; justify-content:space-between; align-items:center; }
            .company { font-weight:700; font-size:18px; }
            .meta { text-align:right; font-size:12px; }
            .grid { width:100%; border-collapse:collapse; margin-top:10px; }
            .grid td, .grid th { border:1px solid #999; padding:6px 8px; font-size:12px; }
            .title { text-align:center; font-weight:700; margin:12px 0; }
            .section { margin-top:10px; }
            .label { font-weight:700; }
            .obs { min-height:40px; }
            .signature { display:flex; justify-content:space-between; margin-top:28px; }
            .sig-line { width:45%; border-top:1px solid #000; text-align:center; padding-top:6px; font-size:12px; }
            .terms { font-size:11px; margin-top:14px; color:#333; }
            .small { font-size:11px; }
          </style>
        </head>
        <body>
          ${header}
          ${body}
        </body>
      </html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 300);
    setShowPrintOptions(false);
    setPrintTarget(null);
  };

return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm dark:border-violet-900/40 dark:bg-gray-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
              <ClipboardList className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-[0.2em]">Ordens de Serviço</span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">Gestão rápida da assistência</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { setShowForm(true); setShowSearch(false); setShowDeleteConfirm(false); }}>
              <PlusCircle className="h-4 w-4" /> Nova O.S.
            </Button>
            <Button variant="secondary" onClick={() => { setShowSearch((value) => !value); setShowForm(false); }}>
              <Search className="h-4 w-4" /> Pesquisar
            </Button>
          </div>
        </div>

        {showSearch && (
          <div className="mt-3 grid gap-3 md:grid-cols-[1.4fr,0.7fr,0.7fr]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por cliente, equipamento ou técnico..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-violet-400 focus:bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'todos' | OrderStatus)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="todos">Todos os status</option>
              <option value="Em análise">Em análise</option>
              <option value="Aguardando aprovação">Aguardando aprovação</option>
              <option value="Aguardando peça">Aguardando peça</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Concluída">Concluída</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as 'todos' | OrderPriority)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="todos">Todas as prioridades</option>
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Ordens cadastradas</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">{filteredOrders.length} itens</span>
          </div>

          <div className="space-y-4 overflow-hidden rounded-xl">
            {filteredOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-400">
                Nenhuma ordem encontrada.
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
                  <div className="mb-2 flex items-center justify-between px-2 pt-1">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Em andamento</h4>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">{activeOrders.length}</span>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {activeOrders.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">Nenhuma ordem em andamento.</div>
                    ) : (
                      activeOrders.map((order) => {
                        const isPending = order.status === 'Em análise' || order.status === 'Aguardando peça' || order.status === 'Em andamento';
                        return (
                          <div key={order.id} className={`grid grid-cols-[1fr,0.7fr] items-center gap-2 px-3 py-3 text-sm ${selectedOrder?.id === order.id ? 'bg-violet-50 dark:bg-violet-900/20' : 'bg-white dark:bg-gray-900'} ${isPending ? 'border-l-4 border-amber-500' : ''}`}>
                            <button type="button" onClick={() => { setSelectedId(order.id); setShowForm(false); setShowDeleteConfirm(false); }} className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-gray-900 dark:text-gray-100">{order.client}</span>
                              </div>
                              <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{order.id}</p>
                            </button>
                            <div className="flex items-center justify-end gap-1">
                              <button type="button" onClick={() => handleOpenDetails(order)} className="rounded-lg px-2 py-2 text-sm font-medium text-violet-600 transition hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20">
                                Detalhes
                              </button>
                              <button type="button" onClick={() => handlePrintOrder(order)} className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                                <Printer className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => { setSelectedId(order.id); setShowDeleteConfirm(true); }} className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 dark:border-emerald-800 dark:bg-emerald-950/20">
                  <div className="mb-2 flex items-center justify-between px-2 pt-1">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">Concluídas</h4>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">{completedOrders.length}</span>
                  </div>
                  <div className="divide-y divide-emerald-200 dark:divide-emerald-800">
                    {completedOrders.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-emerald-700 dark:text-emerald-300">Nenhuma ordem concluída.</div>
                    ) : (
                      completedOrders.map((order) => {
                        const hasPaymentInfo = Boolean(order.paymentMethod || typeof order.paymentReceived === 'number' || typeof order.paymentSpent === 'number');

                        return (
                          <div key={order.id} className={`grid grid-cols-[1fr,auto] items-center gap-2 px-3 py-3 text-sm ${selectedOrder?.id === order.id ? 'bg-slate-100/80 dark:bg-slate-800/40' : 'bg-transparent'}`}>
                            <button type="button" onClick={() => { setSelectedId(order.id); setShowForm(false); setShowDeleteConfirm(false); }} className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-gray-900 dark:text-gray-100">{order.client}</span>
                                {hasPaymentInfo && (
                                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                    {order.paymentMethod}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                                {order.id} · {hasPaymentInfo ? 'Pagamento registrado' : 'Pagamento pendente'}
                              </p>
                            </button>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditOrder(order)}
                                className="rounded-md bg-violet-600 px-2 py-1.5 text-[10px] font-medium text-white hover:bg-violet-700"
                              >
                                Editar O.S.
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentTarget(order);
                                  setPaymentDraft({
                                    method: order.paymentMethod || 'Dinheiro',
                                    received: order.paymentReceived !== undefined ? String(order.paymentReceived) : '',
                                    spent: order.paymentSpent !== undefined ? String(order.paymentSpent) : '',
                                  });
                                  setShowPaymentModal(true);
                                }}
                                className={`rounded-md px-2 py-1.5 text-[10px] font-medium ${hasPaymentInfo ? 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                              >
                                {hasPaymentInfo ? 'Editar forma de pagamento' : 'Inserir forma de pagamento'}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {showDeleteConfirm && selectedOrder && (
            <Modal title="Confirmar exclusão" onClose={() => setShowDeleteConfirm(false)} size="sm">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p className="font-semibold text-gray-900 dark:text-gray-100">Deseja realmente excluir esta ordem?</p>
                <p className="mt-2">{selectedOrder.id} — {selectedOrder.client}</p>
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
                  <Button onClick={handleDeleteOrder}>Confirmar exclusão</Button>
                </div>
              </div>
            </Modal>
          )}

          {showForm ? (
            <Modal title={isEditing ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'} onClose={() => { setShowForm(false); setIsEditing(false); setDraft(emptyDraft); }} size="md">
              <form className="space-y-3" onSubmit={handleCreateOrder}>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="mb-1 block font-medium">Cliente</span>
                    <input
                      value={draft.client}
                      onChange={(event) => {
                        const typed = event.target.value;
                        const selectedClient = clients.find((client) => client.name.toLowerCase() === typed.trim().toLowerCase());
                        setDraft((current) => ({
                          ...current,
                          client: typed,
                          clientId: selectedClient?.id || '',
                          phone: selectedClient?.phone || current.phone,
                        }));
                      }}
                      list="clients-list"
                      placeholder="Digite o nome do cliente"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
                    />
                    <datalist id="clients-list">
                      {clients.map((client) => (
                        <option key={client.id} value={client.name} />
                      ))}
                    </datalist>
                    {isNewClient && (
                      <div className="mt-3 flex items-center gap-2">
                        <Button type="button" variant="secondary" onClick={() => onNavigate?.('clientes')}>
                          Cadastrar cliente
                        </Button>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Cliente não encontrado no cadastro.</span>
                      </div>
                    )}
                  </label>
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="mb-1 block font-medium">Data de entrada</span>
                    <input
                      value={draft.entryDate}
                      onChange={(event) => setDraft((current) => ({ ...current, entryDate: event.target.value }))}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
                    />
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-1">
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="mb-1 block font-medium">Equipamento</span>
                    <input value={draft.device} onChange={(event) => setDraft((current) => ({ ...current, device: event.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800" />
                  </label>
                </div>
                <label className="block text-sm text-gray-600 dark:text-gray-300">
                  <span className="mb-1 block font-medium">Defeito / problema</span>
                  <textarea value={draft.problem} onChange={(event) => setDraft((current) => ({ ...current, problem: event.target.value }))} rows={2} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800" />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="mb-1 block font-medium">Status</span>
                    <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as OrderStatus }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800">
                      <option>Em análise</option>
                      <option>Aguardando aprovação</option>
                      <option>Aguardando peça</option>
                      <option>Em andamento</option>
                      <option>Concluída</option>
                    </select>
                  </label>
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="mb-1 block font-medium">Prioridade</span>
                    <select value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value as OrderPriority }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800">
                      <option>Baixa</option>
                      <option>Média</option>
                      <option>Alta</option>
                      <option>Urgente</option>
                    </select>
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="mb-1 block font-medium">Técnico</span>
                    <input
                      value={draft.technician}
                      onChange={(event) => {
                        const typed = event.target.value;
                        const selectedEmployee = employees.find((employee) => employee.name.toLowerCase() === typed.trim().toLowerCase());
                        setDraft((current) => ({
                          ...current,
                          technician: typed,
                          technicianId: selectedEmployee?.id || current.technicianId,
                        }));
                      }}
                      list="employees-list"
                      placeholder="Digite o nome do técnico"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
                    />
                    <datalist id="employees-list">
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.name} />
                      ))}
                    </datalist>
                  </label>
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="mb-1 block font-medium">Valor do serviço</span>
                    <input value={draft.serviceValue} onChange={(event) => setDraft((current) => ({ ...current, serviceValue: event.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800" />
                  </label>
                </div>
                <label className="block text-sm text-gray-600 dark:text-gray-300">
                  <span className="mb-1 block font-medium">Observações</span>
                  <textarea value={draft.observations} onChange={(event) => setDraft((current) => ({ ...current, observations: event.target.value }))} rows={2} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800" />
                </label>
                <div className="flex gap-2">
                  <Button type="submit">{isEditing ? 'Salvar alterações' : 'Salvar O.S.'}</Button>
                  <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setIsEditing(false); setDraft(emptyDraft); }}>Cancelar</Button>
                </div>
              </form>
            </Modal>
          ) : showDetailsModal && selectedOrder ? (
            <Modal title="Detalhes da O.S." onClose={() => setShowDetailsModal(false)} size="md">
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-semibold">{selectedOrder.id}</span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">Resumo da O.S.</h3>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getOrderVisualState(selectedOrder).badgeClass}`}>
                    {getOrderVisualState(selectedOrder).label}
                  </span>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/70">
                  <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100"><User className="h-4 w-4 text-violet-600" /> Cliente</div>
                  <p className="mt-1">{selectedOrder.client}</p>
                  <p className="mt-1 text-gray-500 dark:text-gray-400">{selectedOrder.phone}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/70">
                  <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100"><Monitor className="h-4 w-4 text-violet-600" /> Equipamento</div>
                  <p className="mt-1">{selectedOrder.device}</p>
                  <p className="mt-1 text-gray-500 dark:text-gray-400">Serial: {selectedOrder.serial}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/70">
                  <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100"><Wrench className="h-4 w-4 text-violet-600" /> Detalhes</div>
                  <p className="mt-1">{selectedOrder.problem}</p>
                  <p className="mt-1 text-gray-500 dark:text-gray-400">Técnico: {selectedOrder.technician} • Prioridade {selectedOrder.priority}</p>
                </div>
                {/* Orçamento block removed per UX request */}
                <div className="flex gap-2">
                  <Button onClick={() => handlePrintOrder(selectedOrder)}>Imprimir</Button>
                  <Button variant="secondary" onClick={() => handleEditOrder(selectedOrder)}>Editar</Button>
                  <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>Fechar</Button>
                </div>
              </div>
            </Modal>
          ) : null}
          {showPrintOptions && printTarget && (
            <Modal title="Imprimir" onClose={() => { setShowPrintOptions(false); setPrintTarget(null); }} size="sm">
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <p>Escolha o documento para imprimir:</p>
                <div className="grid gap-2">
                  <Button onClick={() => performPrint('os')}>Ordem de Serviço</Button>
                  <Button variant="secondary" onClick={() => performPrint('garantia')}>Garantia</Button>
                  <Button variant="secondary" onClick={() => performPrint('termo')}>Termo de responsabilidade</Button>
                  <Button variant="secondary" onClick={() => performPrint('laudo')}>Laudo técnico</Button>
                  <Button variant="secondary" onClick={() => performPrint('orcamento')}>Orçamento</Button>
                  <Button variant="secondary" onClick={() => performPrint('promissoria')}>Promissória</Button>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" onClick={() => { setShowPrintOptions(false); setPrintTarget(null); }}>Cancelar</Button>
                </div>
              </div>
            </Modal>
          )}

          {showPaymentModal && paymentTarget && (
            <Modal title="Pagamento da O.S." onClose={() => { setShowPaymentModal(false); setPaymentTarget(null); setPaymentDraft({ method: 'Dinheiro', received: '', spent: '' }); }} size="sm">
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <p className="font-medium text-gray-900 dark:text-gray-100">{paymentTarget.id} · {paymentTarget.client}</p>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Forma de pagamento</span>
                  <select
                    value={paymentDraft.method}
                    onChange={(event) => setPaymentDraft((current) => ({ ...current, method: event.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <option>Dinheiro</option>
                    <option>Pix</option>
                    <option>Cartão</option>
                    <option>Transferência</option>
                  </select>
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Valor recebido</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={paymentDraft.received}
                      onChange={(event) => setPaymentDraft((current) => ({ ...current, received: event.target.value }))}
                      placeholder="Ex: 280,00"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Valor gasto</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={paymentDraft.spent}
                      onChange={(event) => setPaymentDraft((current) => ({ ...current, spent: event.target.value }))}
                      placeholder="Ex: 180,00"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
                    />
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" onClick={() => { setShowPaymentModal(false); setPaymentTarget(null); setPaymentDraft({ method: 'Dinheiro', received: '', spent: '' }); }}>Cancelar</Button>
                  <Button onClick={handleRegisterPayment}>Salvar pagamento</Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      </div>
    </div>
  );
}
