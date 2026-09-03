import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { BatteryCharging, Cpu, FileText, MessageCircle, PlusCircle, Plug2, Printer, Search, Sparkles, Trash2, Wrench } from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { getWhatsAppTarget } from '../../utils/masks';
import { loadClients, type ClientRecord } from './clientsData';
import { loadOrcamentos, saveOrcamentos, type BudgetCategory, type BudgetItem } from './orcamentosData';

function toCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const categoryConfig: Array<{ id: BudgetCategory; label: string; description: string; icon: ReactElement }> = [
  { id: 'displays', label: 'Display', description: 'Tela e módulo visual', icon: <Cpu className="h-4 w-4" /> },
  { id: 'bateria', label: 'Bateria', description: 'Troca e teste de bateria', icon: <BatteryCharging className="h-4 w-4" /> },
  { id: 'conectores', label: 'Conector', description: 'Porta de carga e conexão', icon: <Plug2 className="h-4 w-4" /> },
  { id: 'servicos-rapidos', label: 'Serviço rápido', description: 'Atendimento ágil', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'servicos-complexos', label: 'Serviço complexo', description: 'Reparo técnico avançado', icon: <Wrench className="h-4 w-4" /> },
];

export default function OrcamentosPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [draft, setDraft] = useState({ model: '', value: '', quality: 'Incell', observations: '' });
  const [activeCategory, setActiveCategory] = useState<BudgetCategory>('displays');
  const [query, setQuery] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<BudgetItem | null>(null);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [whatsAppClientName, setWhatsAppClientName] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([loadOrcamentos(user.id), loadClients(user.id)]).then(([savedItems, savedClients]) => {
      setItems(savedItems);
      setClients(savedClients);
    });
  }, [user?.id]);

  const itemsByCategory = useMemo(() => {
    return categoryConfig.reduce<Record<BudgetCategory, BudgetItem[]>>((acc, category) => {
      acc[category.id] = items.filter((item) => item.category === category.id);
      return acc;
    }, {
      displays: [],
      bateria: [],
      conectores: [],
      'servicos-rapidos': [],
      'servicos-complexos': [],
    });
  }, [items]);

  const selectedItems = useMemo(
    () => selectedItemIds.map((id) => items.find((item) => item.id === id)).filter((item): item is BudgetItem => !!item),
    [items, selectedItemIds]
  );

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return items;
    return items.filter((item) => {
      const categoryLabel = getCategoryLabel(item.category).toLowerCase();
      return [item.model, item.quality, categoryLabel, item.observations || ''].join(' ').toLowerCase().includes(search);
    });
  }, [items, query]);

  const tableItems = useMemo(() => {
    if (query.trim()) return filteredItems;
    return itemsByCategory[activeCategory];
  }, [activeCategory, filteredItems, itemsByCategory, query]);

  const totalBudget = useMemo(() => selectedItems.reduce((sum, item) => sum + item.value, 0), [selectedItems]);

  const requiresObservations = activeCategory === 'servicos-rapidos' || activeCategory === 'servicos-complexos';

  function getCategoryLabel(category: BudgetCategory) {
    return categoryConfig.find((entry) => entry.id === category)?.label || category;
  }

  const openAddModal = (category: BudgetCategory) => {
    setActiveCategory(category);
    setDraft({ model: '', value: '', quality: 'Incell', observations: '' });
    setEditingItemId(null);
    setShowModal(true);
  };

  const handleSaveItem = async () => {
    if (!draft.model.trim() || !draft.value) return;

    if (editingItemId) {
      const next = items.map((item) =>
        item.id === editingItemId
          ? {
              ...item,
              model: draft.model.trim(),
              value: Number(draft.value),
              quality: draft.quality,
              observations: requiresObservations ? draft.observations.trim() : '',
            }
          : item
      );
      setItems(next);
      await saveOrcamentos(user?.id, next);
      setShowModal(false);
      setEditingItemId(null);
      setDraft({ model: '', value: '', quality: 'Incell', observations: '' });
      return;
    }

    const newItem: BudgetItem = {
      id: `BQ-${Date.now()}`,
      category: activeCategory,
      model: draft.model.trim(),
      value: Number(draft.value),
      quality: draft.quality,
      observations: requiresObservations ? draft.observations.trim() : '',
    };

    const next = [newItem, ...items];
    setItems(next);
    await saveOrcamentos(user?.id, next);
    setShowModal(false);
    setDraft({ model: '', value: '', quality: 'Incell', observations: '' });
  };

  const openEditModal = (item: BudgetItem) => {
    setEditingItemId(item.id);
    setActiveCategory(item.category);
    setDraft({ model: item.model, value: String(item.value), quality: item.quality, observations: item.observations || '' });
    setShowModal(true);
  };

  const closeItemModal = () => {
    setShowModal(false);
    setEditingItemId(null);
    setDraft({ model: '', value: '', quality: 'Incell', observations: '' });
  };

  const requestDeleteItem = (item: BudgetItem) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    const next = items.filter((item) => item.id !== itemToDelete.id);
    setItems(next);
    await saveOrcamentos(user?.id, next);
    setSelectedItemIds((current) => current.filter((id) => id !== itemToDelete.id));
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const toggleItemInBudget = (itemId: string, checked: boolean) => {
    setSelectedItemIds((current) => {
      if (checked) {
        if (current.includes(itemId)) return current;
        return [itemId, ...current];
      }
      return current.filter((id) => id !== itemId);
    });
  };

  const finishBudget = () => {
    setSelectedItemIds([]);
  };

  const buildBudgetMessage = (overrideClientName?: string, overridePhone?: string) => {
    const currentClient = clients.find((client) => client.id === selectedClientId);
    const clientName = (overrideClientName ?? whatsAppClientName ?? currentClient?.name ?? '').trim() || 'Cliente';
    const phone = (overridePhone ?? whatsAppPhone ?? currentClient?.phone ?? '').trim();
    const target = getWhatsAppTarget(phone);
    if (!target) return null;

    const lines = selectedItems.map((item) => `- ${item.model} (${getCategoryLabel(item.category)}) — ${toCurrency(item.value)}`).join('\n');
    return {
      target,
      message: [
        `Olá ${clientName}!`,
        '',
        'Aqui está o seu orçamento atual:',
        '',
        lines,
        '',
        `Total: ${toCurrency(totalBudget)}`,
        '',
        `Atenciosamente, ${user?.fullName || 'Equipe'}.`,
      ].join('\n'),
    };
  };

  const sendBudgetByWhatsApp = () => {
    if (selectedItems.length === 0) return;

    const payload = buildBudgetMessage();
    if (!payload) return;

    window.open(`https://wa.me/${payload.target}?text=${encodeURIComponent(payload.message)}`, '_blank', 'noopener,noreferrer');
    setShowWhatsAppModal(false);
    setWhatsAppPhone('');
    setWhatsAppClientName('');
    setSelectedClientId('');
  };

  const copyBudgetMessage = async () => {
    if (selectedItems.length === 0) return;

    const payload = buildBudgetMessage();
    if (!payload) return;

    try {
      await navigator.clipboard.writeText(payload.message);
    } catch {
      window.prompt('Mensagem pronta para copiar', payload.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm dark:border-violet-900/40 dark:bg-gray-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
              <FileText className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-[0.2em]">Orçamentos</span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">Orçamento atual em montagem</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-700 dark:border-violet-900/40 dark:bg-violet-900/20 dark:text-violet-300">
              Total: {toCurrency(totalBudget)}
            </div>
            <Button variant="secondary" disabled title="Disponível em breve">
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button variant="outline" onClick={() => setShowWhatsAppModal(true)} disabled={selectedItems.length === 0}>
              <MessageCircle className="h-4 w-4" /> Enviar WhatsApp
            </Button>
            <Button variant="secondary" onClick={finishBudget} disabled={selectedItems.length === 0}>
              Finalizar orçamento
            </Button>
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-[1.2fr_1fr_0.7fr_0.7fr] items-center gap-2 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <span>Modelo</span>
            <span>Tipo de serviço</span>
            <span>Qualidade</span>
            <span>Valor</span>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {selectedItems.length === 0 ? (
              <div className="px-3 py-5 text-sm text-gray-500 dark:text-gray-400">Marque itens na tabela para montar este orçamento.</div>
            ) : (
              selectedItems.map((item) => (
                <div key={item.id} className="grid grid-cols-[1.2fr_1fr_0.7fr_0.7fr] items-center gap-2 bg-white px-3 py-2.5 dark:bg-gray-900">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{item.model}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{getCategoryLabel(item.category)}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{item.quality}</span>
                  <span className="text-sm font-medium text-violet-600">{toCurrency(item.value)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {categoryConfig.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.id)}
            className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${activeCategory === category.id ? 'border-violet-500 bg-violet-600 text-white' : 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}
          >
            {category.icon}
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-3 flex flex-col gap-2 px-1 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar em todos os tipos de serviço..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
            />
          </label>
          <Button onClick={() => openAddModal(activeCategory)}>
            <PlusCircle className="h-4 w-4" /> Adicionar item
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-[0.35fr_1.2fr_1fr_0.7fr_0.7fr_0.6fr] items-center gap-2 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <span>OK</span>
            <span>Modelo</span>
            <span>Tipo de serviço</span>
            <span>Qualidade</span>
            <span>Valor</span>
            <span className="text-right">Ações</span>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {tableItems.length === 0 ? (
              <div className="px-3 py-6 text-sm text-gray-500 dark:text-gray-400">
                {query.trim() ? 'Nenhum item encontrado para esta busca.' : 'Nenhum item cadastrado nesta categoria ainda.'}
              </div>
            ) : (
              tableItems.map((item) => (
                <div key={item.id} className="grid grid-cols-[0.35fr_1.2fr_1fr_0.7fr_0.7fr_0.6fr] items-center gap-2 bg-white px-3 py-3 dark:bg-gray-900">
                  <div>
                    <input
                      type="checkbox"
                      checked={selectedItemIds.includes(item.id)}
                      onChange={(event) => toggleItemInBudget(item.id, event.target.checked)}
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-violet-600"
                      aria-label={`Selecionar ${item.model} no orçamento atual`}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{item.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{getCategoryLabel(item.category)}</p>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{item.quality}</div>
                  <div className="text-sm font-medium text-violet-600">{toCurrency(item.value)}</div>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => openEditModal(item)} className="px-3 py-1 text-xs">Editar</Button>
                    <Button variant="outline" onClick={() => requestDeleteItem(item)} className="px-2 py-1 text-xs text-red-500" aria-label="Excluir item">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <Modal title={editingItemId ? 'Editar item' : 'Adicionar item'} onClose={closeItemModal} size="sm">
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <label className="block">
              <span className="mb-1 block font-medium">Modelo</span>
              <input
                value={draft.model}
                onChange={(event) => setDraft((current) => ({ ...current, model: event.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
                placeholder="Ex.: Display iPhone 14"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-medium">Valor</span>
              <input
                type="number"
                min="0"
                value={draft.value}
                onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
                placeholder="0"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-medium">Qualidade</span>
              <select
                value={draft.quality}
                onChange={(event) => setDraft((current) => ({ ...current, quality: event.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="Incell">Incell</option>
                <option value="LCD">LCD</option>
                <option value="OLED">OLED</option>
                <option value="Paralela">Paralela</option>
                <option value="Primeira linha">Primeira linha</option>
                <option value="Original">Original</option>
                <option value="Retirada">Retirada</option>
              </select>
            </label>
            {requiresObservations && (
              <label className="block">
                <span className="mb-1 block font-medium">Observações</span>
                <textarea
                  value={draft.observations}
                  onChange={(event) => setDraft((current) => ({ ...current, observations: event.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="Detalhes do serviço..."
                />
              </label>
            )}
            <div className="flex gap-2">
              <Button onClick={handleSaveItem}>Salvar</Button>
              <Button variant="secondary" onClick={closeItemModal}>Cancelar</Button>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteConfirm && itemToDelete && (
        <Modal title="Confirmar exclusão" onClose={() => { setShowDeleteConfirm(false); setItemToDelete(null); }} size="sm">
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <p>Tem certeza que deseja excluir o item <span className="font-semibold">{itemToDelete.model}</span>?</p>
            <div className="flex gap-2">
              <Button onClick={confirmDeleteItem}>Sim, excluir</Button>
              <Button variant="secondary" onClick={() => { setShowDeleteConfirm(false); setItemToDelete(null); }}>Cancelar</Button>
            </div>
          </div>
        </Modal>
      )}

      {showWhatsAppModal && (
        <Modal title="Enviar orçamento por WhatsApp" onClose={() => { setShowWhatsAppModal(false); setWhatsAppPhone(''); setWhatsAppClientName(''); setSelectedClientId(''); }} size="sm">
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <label className="block">
              <span className="mb-1 block font-medium">Cliente cadastrado</span>
              <select
                value={selectedClientId}
                onChange={(event) => {
                  const nextId = event.target.value;
                  setSelectedClientId(nextId);
                  const nextClient = clients.find((client) => client.id === nextId);
                  if (nextClient) {
                    setWhatsAppClientName(nextClient.name);
                    setWhatsAppPhone(nextClient.phone);
                  } else {
                    setWhatsAppClientName('');
                    setWhatsAppPhone('');
                  }
                }}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="">Usar outro cliente / telefone</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block font-medium">Nome do cliente</span>
              <input
                value={whatsAppClientName}
                onChange={(event) => setWhatsAppClientName(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
                placeholder="Nome do cliente"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-medium">Telefone</span>
              <input
                value={whatsAppPhone}
                onChange={(event) => setWhatsAppPhone(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
                placeholder="(11) 99999-9999"
              />
            </label>
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-300">
              Você pode usar um cliente cadastrado ou informar um telefone novo. A mensagem do orçamento será gerada automaticamente.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={sendBudgetByWhatsApp} disabled={!buildBudgetMessage()}>
                Enviar
              </Button>
              <Button variant="secondary" onClick={copyBudgetMessage} disabled={!buildBudgetMessage()}>
                Copiar mensagem
              </Button>
              <Button variant="secondary" onClick={() => { setShowWhatsAppModal(false); setWhatsAppPhone(''); setWhatsAppClientName(''); setSelectedClientId(''); }}>
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
