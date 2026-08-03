import { useMemo, useState, type ReactElement } from 'react';
import { BatteryCharging, Cpu, FileText, Plug2, Printer, Search, Sparkles, Trash2, Wrench } from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

type BudgetCategory = 'displays' | 'bateria' | 'conectores' | 'servicos-rapidos' | 'servicos-complexos';

interface CatalogItem {
  id: number;
  category: BudgetCategory;
  title: string;
  description: string;
  price: number;
  image: string;
  tags: string[];
}

interface SelectedItem extends CatalogItem {
  quantity: number;
}

function createImage(label: string, accent: string) {
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='640' height='420' viewBox='0 0 640 420'>
      <rect width='100%' height='100%' rx='32' fill='#111827'/>
      <rect x='64' y='64' width='512' height='292' rx='24' fill='${accent}' fill-opacity='0.95'/>
      <rect x='120' y='108' width='400' height='204' rx='16' fill='white' fill-opacity='0.16'/>
      <text x='320' y='220' text-anchor='middle' font-family='Arial, sans-serif' font-size='34' fill='white' font-weight='700'>${label}</text>
      <text x='320' y='260' text-anchor='middle' font-family='Arial, sans-serif' font-size='18' fill='white' opacity='0.9'>Orçamento técnico</text>
    </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function toCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const initialCatalog: CatalogItem[] = [
  {
    id: 1,
    category: 'displays',
    title: 'Display iPhone 14',
    description: 'Troca de display com garantia e calibração.',
    price: 680,
    image: createImage('Display', '#7c3aed'),
    tags: ['iphone', 'tela', 'display'],
  },
  {
    id: 2,
    category: 'displays',
    title: 'Display Samsung Galaxy S24',
    description: 'Substituição completa da tela com sensor.',
    price: 820,
    image: createImage('Samsung', '#2563eb'),
    tags: ['samsung', 'tela', 'display'],
  },
  {
    id: 3,
    category: 'bateria',
    title: 'Troca de bateria iPhone',
    description: 'Bateria original com testes de carga.',
    price: 240,
    image: createImage('Bateria', '#f59e0b'),
    tags: ['bateria', 'iphone'],
  },
  {
    id: 4,
    category: 'bateria',
    title: 'Troca de bateria Samsung',
    description: 'Troca com avaliação do sistema e descarregamento.',
    price: 220,
    image: createImage('Bateria', '#22c55e'),
    tags: ['bateria', 'samsung'],
  },
  {
    id: 5,
    category: 'conectores',
    title: 'Conector de carregamento',
    description: 'Reparo de porta de carga e limpeza da placa.',
    price: 180,
    image: createImage('Conector', '#0f766e'),
    tags: ['conector', 'carregamento'],
  },
  {
    id: 6,
    category: 'servicos-rapidos',
    title: 'Limpeza e manutenção básica',
    description: 'Limpeza interna, revisão e ajuste simples.',
    price: 90,
    image: createImage('Serviço', '#db2777'),
    tags: ['manutenção', 'limpeza'],
  },
  {
    id: 7,
    category: 'servicos-complexos',
    title: 'Reparo de placa mãe',
    description: 'Diagnóstico e reparo de falhas elétricas e componentes.',
    price: 420,
    image: createImage('Placa', '#7c2d12'),
    tags: ['placa', 'complexo'],
  },
  {
    id: 8,
    category: 'servicos-complexos',
    title: 'Recuperação de dados',
    description: 'Diagnóstico e tentativa de recuperação parcial ou total.',
    price: 350,
    image: createImage('Dados', '#4338ca'),
    tags: ['dados', 'recuperação'],
  },
];

const categoryConfig: Array<{ id: BudgetCategory; label: string; description: string; icon: ReactElement }> = [
  { id: 'displays', label: 'Displays', description: 'Telas e módulos visuais', icon: <Cpu className="h-4 w-4" /> },
  { id: 'bateria', label: 'Bateria', description: 'Trocas e testes de bateria', icon: <BatteryCharging className="h-4 w-4" /> },
  { id: 'conectores', label: 'Conectores', description: 'Portas de carga e conexões', icon: <Plug2 className="h-4 w-4" /> },
  { id: 'servicos-rapidos', label: 'Serviços rápidos', description: 'Atendimentos ágeis', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'servicos-complexos', label: 'Serviços complexos', description: 'Reparos técnicos avançados', icon: <Wrench className="h-4 w-4" /> },
];

export default function OrcamentosPage() {
  const [catalog] = useState(initialCatalog);
  const [activeCategory, setActiveCategory] = useState<BudgetCategory>('displays');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [message, setMessage] = useState('');
  const [budgetDateTime] = useState(() => new Date().toLocaleString('pt-BR'));
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalValue, setModalValue] = useState('');

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return catalog.filter((item) => item.category === activeCategory && (!term || [item.title, item.description, item.tags.join(' ')].join(' ').toLowerCase().includes(term)));
  }, [catalog, activeCategory, searchTerm]);

  const totalBudget = useMemo(() => selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [selectedItems]);

  const addItem = (item: CatalogItem) => {
    setSelectedItems((current) => {
      const existing = current.find((entry) => entry.id === item.id);
      if (existing) {
        return current.map((entry) => (entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry));
      }
      return [...current, { ...item, quantity: 1 }];
    });
    setMessage(`${item.title} adicionado ao orçamento.`);
  };

  const removeItem = (id: number) => {
    setSelectedItems((current) => current.filter((item) => item.id !== id));
  };

  const openItemModal = (item: SelectedItem) => {
    setSelectedItem(item);
    setModalQuantity(item.quantity);
    setModalValue(String(item.price));
  };

  const saveItemModal = () => {
    if (!selectedItem) return;
    setSelectedItems((current) => current.map((item) => (item.id === selectedItem.id ? { ...item, quantity: Math.max(1, modalQuantity), price: Number(modalValue) || item.price } : item)));
    setSelectedItem(null);
  };

  const printBudget = () => {
    const items = selectedItems.map((item) => `${item.quantity}x ${item.title} — ${toCurrency(item.price * item.quantity)}`).join('<br/>');
    const content = `
      <html>
        <head><meta charset="utf-8" /><title>Orçamento</title></head>
        <body style="font-family:Arial,sans-serif;padding:24px;color:#111">
          <h2>Orçamento técnico</h2>
          <p><strong>Data/Hora:</strong> ${budgetDateTime}</p>
          <p><strong>Itens:</strong></p>
          <div>${items || 'Nenhum item selecionado.'}</div>
          <hr style="margin:16px 0" />
          <p><strong>Total:</strong> ${toCurrency(totalBudget)}</p>
        </body>
      </html>`;
    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!printWindow) return;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
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
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">Montagem rápida de orçamento com busca e seleção por categoria</h2>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/70 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Orçamento atual</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Data e hora registradas automaticamente.</p>
            <p className="mt-1 text-sm font-medium text-violet-700 dark:text-violet-300">{budgetDateTime}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-violet-600">{toCurrency(totalBudget)}</span>
            <Button variant="secondary" onClick={printBudget}>
              <Printer className="h-4 w-4" /> Imprimir orçamento
            </Button>
          </div>
        </div>

        <label className="relative mb-4 block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por aparelho, serviço ou peça..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
          />
        </label>

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

        {message && (
          <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-700 dark:border-violet-900/40 dark:bg-violet-900/20 dark:text-violet-300">
            {message}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[1.3fr,0.7fr]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{categoryConfig.find((entry) => entry.id === activeCategory)?.label}</h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">{filteredItems.length} itens</span>
            </div>
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-violet-600">{toCurrency(item.price)}</span>
                    <Button onClick={() => addItem(item)} className="px-2.5 py-1.5 text-xs">
                      Adicionar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800/70">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Itens selecionados</h4>
              <span className="text-sm font-semibold text-violet-600">{toCurrency(totalBudget)}</span>
            </div>
            <div className="space-y-2">
              {selectedItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Nenhum item selecionado ainda.
                </div>
              ) : (
                selectedItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-900">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{toCurrency(item.price)} cada</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => openItemModal(item)} className="rounded-lg bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">
                          Editar
                        </button>
                        <button type="button" onClick={() => removeItem(item.id)} className="rounded-lg p-1 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Qtd. {item.quantity}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{toCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedItem && (
        <Modal title="Detalhes do item" onClose={() => setSelectedItem(null)} size="sm">
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedItem.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{selectedItem.description}</p>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Modelo</span>
              <input
                value={selectedItem.title}
                onChange={(event) => setSelectedItem((current) => (current ? { ...current, title: event.target.value } : current))}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Valor</span>
              <input
                type="number"
                min="0"
                value={modalValue}
                onChange={(event) => setModalValue(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Quantidade</span>
              <input
                type="number"
                min="1"
                value={modalQuantity}
                onChange={(event) => setModalQuantity(Number(event.target.value) || 1)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-800"
              />
            </label>
            <div className="flex gap-2">
              <Button onClick={saveItemModal}>Salvar</Button>
              <Button variant="secondary" onClick={() => setSelectedItem(null)}>Cancelar</Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
