import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const samples = [
  {
    id: 'form-01',
    title: 'Ordem de Serviço - Modelo A',
    fields: {
      cliente: 'Paulo Cesar Fernandes',
      equipamento: 'J5',
      problema: 'Troca de bateria',
      tecnico: 'HIRAM',
      valor: 'R$ 150,00',
      entrada: '28/07/2026',
    },
  },
  {
    id: 'form-02',
    title: 'Ordem de Serviço - Modelo B',
    fields: {
      cliente: 'Maria Silva',
      equipamento: 'iPhone X',
      problema: 'Tela trincada',
      tecnico: 'ANA',
      valor: 'R$ 350,00',
      entrada: '01/08/2026',
    },
  },
];

const emptyForm = {
  title: '',
  cliente: '',
  equipamento: '',
  problema: '',
  tecnico: '',
  valor: '',
  entrada: '',
};

export default function FormulariosPage() {
  const [list, setList] = useState(samples);
  const [draft, setDraft] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selected, setSelected] = useState<typeof samples[0] | null>(samples[0]);

  const handleNewForm = () => {
    const nextForm = {
      id: `form-${String(list.length + 1).padStart(2, '0')}`,
      title: draft.title || 'Novo formulário',
      fields: {
        cliente: draft.cliente || 'Cliente não informado',
        equipamento: draft.equipamento || 'Equipamento não informado',
        problema: draft.problema || 'Problema não informado',
        tecnico: draft.tecnico || 'Técnico não informado',
        valor: draft.valor || 'R$ 0,00',
        entrada: draft.entrada || new Date().toLocaleDateString('pt-BR'),
      },
    };
    setList((current) => [nextForm, ...current]);
    setDraft(emptyForm);
    setShowForm(false);
  };

  const openPreview = (item: typeof samples[0]) => {
    setSelected(item);
    setShowPreview(true);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm dark:border-violet-900/40 dark:bg-gray-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Formulários</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Modelos de formulários preenchidos para impressão futura.</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <PlusCircle className="h-4 w-4" /> Novo formulário
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Modelos disponíveis</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">{list.length} itens</span>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {list.map((item) => (
              <div key={item.id} className="grid grid-cols-[2fr,1fr,0.9fr] items-center gap-3 px-4 py-4 bg-white text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Entrada: {item.fields.entrada}</p>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{item.fields.cliente}</span>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="secondary" onClick={() => openPreview(item)} className="px-3 py-1 text-xs">Visualizar</Button>
                  <Button variant="secondary" onClick={() => setSelected(item)} className="px-3 py-1 text-xs">Editar</Button>
                  <Button variant="outline" onClick={() => setList((current) => current.filter((form) => form.id !== item.id))} className="px-3 py-1 text-xs text-red-500">Excluir</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <Modal title="Novo formulário" onClose={() => setShowForm(false)} size="md">
          <div className="space-y-3">
            <label className="block text-sm text-gray-600 dark:text-gray-300">
              <span className="mb-1 block font-medium">Título</span>
              <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800" />
            </label>
            <label className="grid gap-1 text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Cliente</span>
              <input value={draft.cliente} onChange={(event) => setDraft((current) => ({ ...current, cliente: event.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800" />
            </label>
            <label className="grid gap-1 text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Equipamento</span>
              <input value={draft.equipamento} onChange={(event) => setDraft((current) => ({ ...current, equipamento: event.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800" />
            </label>
            <label className="grid gap-1 text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Problema</span>
              <textarea value={draft.problema} onChange={(event) => setDraft((current) => ({ ...current, problema: event.target.value }))} rows={3} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800" />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">
                <span className="mb-1 block font-medium">Técnico</span>
                <input value={draft.tecnico} onChange={(event) => setDraft((current) => ({ ...current, tecnico: event.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800" />
              </label>
              <label className="text-sm text-gray-600 dark:text-gray-300">
                <span className="mb-1 block font-medium">Valor</span>
                <input value={draft.valor} onChange={(event) => setDraft((current) => ({ ...current, valor: event.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800" />
              </label>
            </div>
            <label className="text-sm text-gray-600 dark:text-gray-300">
              <span className="mb-1 block font-medium">Data de entrada</span>
              <input value={draft.entrada} onChange={(event) => setDraft((current) => ({ ...current, entrada: event.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800" />
            </label>
            <div className="flex gap-2">
              <Button onClick={handleNewForm}>Salvar formulário</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        </Modal>
      )}

      {showPreview && selected && (
        <Modal title={`Preview — ${selected.title}`} onClose={() => setShowPreview(false)} size="md">
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
              <p className="font-semibold">{selected.title}</p>
              <p><span className="font-semibold">Cliente:</span> {selected.fields.cliente}</p>
              <p><span className="font-semibold">Equipamento:</span> {selected.fields.equipamento}</p>
              <p><span className="font-semibold">Problema:</span> {selected.fields.problema}</p>
              <p><span className="font-semibold">Técnico:</span> {selected.fields.tecnico}</p>
              <p><span className="font-semibold">Valor:</span> {selected.fields.valor}</p>
              <p><span className="font-semibold">Data de entrada:</span> {selected.fields.entrada}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowPreview(false)}>Fechar</Button>
              <Button onClick={() => { /* impressão pendente */ }}>Imprimir (pendente)</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
