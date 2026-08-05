import { useEffect, useMemo, useState } from 'react';
import { PlusCircle, Search, UserCog } from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { initialEmployees, loadEmployees, saveEmployees, type EmployeeRecord } from './employeesData';

export default function FuncionariosPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState(initialEmployees);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({ name: '', role: '', phone: '', email: '' });

  useEffect(() => {
    if (!user?.id) return;
    loadEmployees(user.id).then((items) => {
      setEmployees(items);
      setSelectedId((current) => current ?? items[0]?.id ?? null);
    });
  }, [user?.id]);

  const filteredEmployees = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return employees;
    return employees.filter((employee) => [employee.name, employee.role, employee.phone, employee.email].join(' ').toLowerCase().includes(search));
  }, [employees, query]);

  const selectedEmployee = filteredEmployees.find((employee) => employee.id === selectedId) ?? filteredEmployees[0] ?? null;

  const handleSave = async () => {
    if (isEditing && selectedEmployee) {
      const updated = employees.map((employee) =>
        employee.id === selectedEmployee.id
          ? { ...employee, name: draft.name || employee.name, role: draft.role || employee.role, phone: draft.phone || employee.phone, email: draft.email || employee.email }
          : employee
      );
      setEmployees(updated);
      await saveEmployees(user?.id, updated);
    } else {
      const newEmployee: EmployeeRecord = {
        id: `FUN-${String(employees.length + 1).padStart(3, '0')}`,
        name: draft.name || 'Funcionário sem nome',
        role: draft.role || 'Cargo não informado',
        phone: draft.phone || 'Não informado',
        email: draft.email || 'Não informado',
      };
      const next = [newEmployee, ...employees];
      setEmployees(next);
      await saveEmployees(user?.id, next);
      setSelectedId(newEmployee.id);
    }

    setDraft({ name: '', role: '', phone: '', email: '' });
    setShowForm(false);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    const next = employees.filter((employee) => employee.id !== selectedEmployee.id);
    setEmployees(next);
    await saveEmployees(user?.id, next);
    setSelectedId(null);
    setConfirmDelete(false);
  };

  const openEdit = (employee: EmployeeRecord) => {
    setDraft({ name: employee.name, role: employee.role, phone: employee.phone, email: employee.email });
    setSelectedId(employee.id);
    setIsEditing(true);
    setShowForm(true);
  };

  const openPreview = (employee: EmployeeRecord) => {
    setSelectedId(employee.id);
    setShowPreview(true);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm dark:border-violet-900/40 dark:bg-gray-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
              <UserCog className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-[0.2em]">Funcionários</span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">Cadastro simples para equipe técnica</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => { setShowForm(true); setIsEditing(false); setDraft({ name: '', role: '', phone: '', email: '' }); }}>
              <PlusCircle className="h-4 w-4" /> Novo funcionário
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
              placeholder="Buscar funcionário..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
            />
          </label>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr,0.65fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Equipe cadastrada</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">{filteredEmployees.length} itens</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEmployees.map((employee) => (
                <div key={employee.id} className={`grid grid-cols-[1fr,auto] items-center gap-3 px-4 py-4 ${selectedEmployee?.id === employee.id ? 'bg-violet-50 dark:bg-violet-900/20' : 'bg-white dark:bg-gray-900'}`}>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{employee.name}</p>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="secondary" onClick={() => openPreview(employee)} className="px-3 py-1 text-xs">Visualizar</Button>
                    <Button variant="secondary" onClick={() => openEdit(employee)} className="px-3 py-1 text-xs">Editar</Button>
                    <Button variant="outline" onClick={() => { setSelectedId(employee.id); setConfirmDelete(true); }} className="px-3 py-1 text-xs text-red-500">Excluir</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {showForm && (
            <Modal title={isEditing ? 'Editar funcionário' : 'Novo funcionário'} onClose={() => { setShowForm(false); setIsEditing(false); setDraft({ name: '', role: '', phone: '', email: '' }); }} size="md">
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="mb-1 block font-medium">Nome</span>
                    <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800" />
                  </label>
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="mb-1 block font-medium">Cargo</span>
                    <input value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800" />
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="mb-1 block font-medium">Telefone</span>
                    <input value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800" />
                  </label>
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="mb-1 block font-medium">E-mail</span>
                    <input value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800" />
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave}>Salvar funcionário</Button>
                  <Button variant="secondary" onClick={() => { setShowForm(false); setIsEditing(false); setDraft({ name: '', role: '', phone: '', email: '' }); }}>Cancelar</Button>
                </div>
              </div>
            </Modal>
          )}


          {showPreview && selectedEmployee && (
            <Modal title="Visualizar funcionário" onClose={() => setShowPreview(false)} size="md">
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                  <p className="font-semibold">{selectedEmployee.name}</p>
                  <p><span className="font-semibold">Cargo:</span> {selectedEmployee.role}</p>
                  <p><span className="font-semibold">Telefone:</span> {selectedEmployee.phone}</p>
                  <p><span className="font-semibold">E-mail:</span> {selectedEmployee.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setShowPreview(false)}>Fechar</Button>
                </div>
              </div>
            </Modal>
          )}

          {confirmDelete && selectedEmployee && (
            <Modal title="Confirmar exclusão" onClose={() => setConfirmDelete(false)} size="sm">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Deseja realmente excluir {selectedEmployee.name}?</p>
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
