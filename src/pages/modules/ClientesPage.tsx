import { useMemo, useState } from 'react';
import { PlusCircle, Search, Users, Eye } from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { loadClients, saveClients, type ClientRecord } from './clientsData';

export default function ClientesPage() {
  const [clients, setClients] = useState<ClientRecord[]>(() => loadClients());
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(loadClients()[0]?.id ?? null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [draft, setDraft] = useState({ name: '', phone: '', email: '', cpf: '', address: '', notes: '' });

  const filteredClients = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return clients;
    return clients.filter((client) => [client.name, client.phone, client.email, client.cpf].join(' ').toLowerCase().includes(search));
  }, [clients, query]);

  const selectedClient = filteredClients.find((client) => client.id === selectedId) ?? filteredClients[0] ?? null;

  const handleSave = () => {
    if (isEditing && selectedClient) {
      const updatedClients = clients.map((client) =>
        client.id === selectedClient.id
          ? {
              ...client,
              name: draft.name || 'Cliente sem nome',
              phone: draft.phone || 'Não informado',
              email: draft.email || 'Não informado',
              cpf: draft.cpf || 'Não informado',
              address: draft.address || 'Não informado',
              notes: draft.notes || 'Sem observações',
            }
          : client
      );
      setClients(updatedClients);
      saveClients(updatedClients);
      setSelectedId(selectedClient.id);
    } else {
      const newClient: ClientRecord = {
        id: `CL-${String(clients.length + 1).padStart(3, '0')}`,
        name: draft.name || 'Cliente sem nome',
        phone: draft.phone || 'Não informado',
        email: draft.email || 'Não informado',
        cpf: draft.cpf || 'Não informado',
        address: draft.address || 'Não informado',
        notes: draft.notes || 'Sem observações',
      };
      setClients((current) => {
        const next = [newClient, ...current];
        saveClients(next);
        return next;
      });
      setSelectedId(newClient.id);
    }

    setDraft({ name: '', phone: '', email: '', cpf: '', address: '', notes: '' });
    setShowForm(false);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!selectedClient) return;
    const next = clients.filter((client) => client.id !== selectedClient.id);
    setClients(next);
    saveClients(next);
    setSelectedId(null);
    setConfirmDelete(false);
  };

  const openEdit = (client: ClientRecord) => {
    setDraft({
      name: client.name,
      phone: client.phone,
      email: client.email,
      cpf: client.cpf,
      address: client.address,
      notes: client.notes,
    });
    setSelectedId(client.id);
    setIsEditing(true);
    setShowForm(true);
  };

  const openPreview = (client: ClientRecord) => {
    setSelectedId(client.id);
    setShowPreview(true);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm dark:border-blue-900/40 dark:bg-gray-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Users className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-[0.2em]">Clientes</span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">Cadastro simples e rápido</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => { setShowForm(true); setIsEditing(false); setDraft({ name: '', phone: '', email: '', cpf: '', address: '', notes: '' }); }}>
              <PlusCircle className="h-4 w-4" /> Novo cliente
            </Button>
            <Button variant="secondary" onClick={() => setQuery('')}>
              <Search className="h-4 w-4" /> Limpar busca
            </Button>
          </div>
        </div>

        <div className="mt-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar cliente..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800"
            />
          </label>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr,0.65fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Clientes cadastrados</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">{filteredClients.length} itens</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredClients.map((client) => (
                <div key={client.id} className={`grid grid-cols-[1fr,0.8fr] items-center gap-2 px-3 py-3 ${selectedClient?.id === client.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-900'}`}>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{client.name}</p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="secondary" onClick={() => openPreview(client)} className="px-3 py-1 text-xs"><Eye className="h-4 w-4" /> Visualizar</Button>
                    <Button variant="secondary" onClick={() => openEdit(client)} className="px-3 py-1 text-xs">Editar</Button>
                    <Button variant="secondary" onClick={() => { setSelectedId(client.id); setConfirmDelete(true); }} className="px-3 py-1 text-xs text-red-500">Excluir</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {showForm && (
            <Modal title={isEditing ? 'Editar cliente' : 'Novo cliente'} onClose={() => { setShowForm(false); setIsEditing(false); setDraft({ name: '', phone: '', email: '', cpf: '', address: '', notes: '' }); }} size="md">
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="mb-1 block font-medium">Nome</span>
                    <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800" />
                  </label>
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="mb-1 block font-medium">Telefone</span>
                    <input value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800" />
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="mb-1 block font-medium">E-mail</span>
                    <input value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800" />
                  </label>
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="mb-1 block font-medium">CPF</span>
                    <input value={draft.cpf} onChange={(event) => setDraft((current) => ({ ...current, cpf: event.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800" />
                  </label>
                </div>
                <label className="block text-sm text-gray-600 dark:text-gray-300">
                  <span className="mb-1 block font-medium">Endereço</span>
                  <input value={draft.address} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800" />
                </label>
                <label className="block text-sm text-gray-600 dark:text-gray-300">
                  <span className="mb-1 block font-medium">Observações</span>
                  <textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} rows={3} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800" />
                </label>
                <div className="flex gap-2">
                  <Button onClick={handleSave}>{isEditing ? 'Salvar alterações' : 'Salvar cliente'}</Button>
                  <Button variant="secondary" onClick={() => { setShowForm(false); setIsEditing(false); setDraft({ name: '', phone: '', email: '', cpf: '', address: '', notes: '' }); }}>Cancelar</Button>
                </div>
              </div>
            </Modal>
          )}


          {showPreview && selectedClient && (
            <Modal title="Visualizar cliente" onClose={() => setShowPreview(false)} size="md">
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                  <p className="font-semibold">{selectedClient.name}</p>
                  <p><span className="font-semibold">Telefone:</span> {selectedClient.phone}</p>
                  <p><span className="font-semibold">E-mail:</span> {selectedClient.email}</p>
                  <p><span className="font-semibold">CPF:</span> {selectedClient.cpf}</p>
                  <p><span className="font-semibold">Endereço:</span> {selectedClient.address}</p>
                  <p><span className="font-semibold">Observações:</span> {selectedClient.notes}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setShowPreview(false)}>Fechar</Button>
                </div>
              </div>
            </Modal>
          )}

          {confirmDelete && selectedClient && (
            <Modal title="Confirmar exclusão" onClose={() => setConfirmDelete(false)} size="sm">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Deseja realmente excluir {selectedClient.name}?</p>
                <div className="mt-4 flex gap-2">
                  <Button onClick={handleDelete}>Sim, excluir</Button>
                  <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      </div>
    </div>
  );
}
