import { Activity, CheckCircle2, Package, ShoppingCart, Wallet, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import PlaceholderPage from './PlaceholderPage';
import OrdensPageComponent from './OrdensPage';
import ClientesPageComponent from './ClientesPage';
import FuncionariosPageComponent from './FuncionariosPage';
import FormulariosPageComponent from './FormulariosPage';
import OrcamentosPageComponent from './OrcamentosPage';
import BackupPageComponent from './BackupPage';
import { useAuth } from '../../contexts/AuthContext';
import { loadOrders, saveOrders, subscribeOrders, type OrderStatus, type ServiceOrder } from './ordersData';
import { buildPublicStatusUrl, savePublicStatus } from './publicStatus';
import { getWhatsAppTarget } from '../../utils/masks';
import { loadUserCollection, saveUserCollection } from '../../lib/userData';

interface StockItem {
  id: string;
  name: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
  unitPrice?: number;
  updatedAt: string;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(value);

const statusSequence: OrderStatus[] = ['Em análise', 'Aguardando aprovação', 'Aguardando peça', 'Em andamento', 'Concluída'];

const statusStyles: Record<OrderStatus, string> = {
  'Em análise': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  'Aguardando aprovação': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Aguardando peça': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'Em andamento': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
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

export function BackupPage() {
  return <BackupPageComponent />;
}

export function EstoquePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<StockItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);
  const [draft, setDraft] = useState({ name: '', quantity: 1, costPrice: 0, salePrice: 0 });

  useEffect(() => {
    if (!user?.id) return;
    void loadUserCollection<StockItem>(user.id, 'estoque').then((items) => setProducts(items));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    void saveUserCollection(user.id, 'estoque', products);
  }, [products, user?.id]);

  const handleAddProduct = () => {
    const cleanName = draft.name.trim();
    if (!cleanName) return;

    const salePrice = Math.max(0, Number(draft.salePrice) || 0);
    const nextItem: StockItem = {
      id: crypto.randomUUID(),
      name: cleanName,
      quantity: Math.max(0, Number(draft.quantity) || 0),
      costPrice: Math.max(0, Number(draft.costPrice) || 0),
      salePrice,
      unitPrice: salePrice,
      updatedAt: new Date().toISOString(),
    };

    setProducts((current) => [nextItem, ...current]);
    setDraft({ name: '', quantity: 1, costPrice: 0, salePrice: 0 });
    setShowAddModal(false);
  };

  const updateProduct = (id: string, nextValue: Partial<StockItem>) => {
    setProducts((current) => current.map((item) => item.id === id
      ? { ...item, ...nextValue, updatedAt: new Date().toISOString() }
      : item));
  };

  const openEditModal = (product: StockItem) => {
    setEditingProduct(product);
    setEditDraft({
      quantity: product.quantity,
      costPrice: product.costPrice ?? product.unitPrice ?? 0,
      salePrice: product.salePrice ?? product.unitPrice ?? 0,
    });
  };

  const removeProduct = (id: string) => {
    setProducts((current) => current.filter((item) => item.id !== id));
  };

  const [editingProduct, setEditingProduct] = useState<StockItem | null>(null);
  const [editDraft, setEditDraft] = useState({ quantity: 0, costPrice: 0, salePrice: 0 });

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = !normalizedSearch || product.name.toLowerCase().includes(normalizedSearch);
      const matchesMissing = !showOnlyMissing || product.quantity === 0;
      return matchesSearch && matchesMissing;
    });
  }, [products, search, showOnlyMissing]);

  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  const getProfitMetrics = (product: StockItem) => {
    const salePrice = product.salePrice ?? product.unitPrice ?? 0;
    const costPrice = product.costPrice ?? 0;
    const unitProfit = Math.max(0, salePrice - costPrice);
    const marginPercent = salePrice > 0 ? (unitProfit / salePrice) * 100 : 0;
    return {
      salePrice,
      costPrice,
      unitProfit,
      marginPercent,
      totalProfit: product.quantity * unitProfit,
    };
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm dark:border-emerald-900/40 dark:bg-gray-900 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Estoque</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Produtos em estoque</h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Package className="h-4 w-4" />
          Adicionar produto
        </button>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm dark:border-emerald-900/40 dark:bg-gray-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar produto"
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 pl-10 text-sm text-gray-900 outline-none transition focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
          </div>

          <button
            type="button"
            onClick={() => setShowOnlyMissing((current) => !current)}
            className={`inline-flex items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
              showOnlyMissing
                ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Em falta
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-emerald-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-emerald-800 dark:bg-gray-900 dark:text-gray-400">
            {products.length === 0
              ? 'Nenhum produto cadastrado ainda. Adicione o primeiro item para controlar o estoque.'
              : 'Nenhum produto encontrado com os filtros atuais.'}
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isLowStock = product.quantity === 0;
            const metrics = getProfitMetrics(product);
            const isExpanded = expandedProductId === product.id;

            return (
              <div
                key={product.id}
                className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-sm ${
                  isLowStock
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="truncate text-base font-bold text-gray-900 dark:text-gray-100">{product.name}</p>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{product.quantity} und</span>
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(metrics.salePrice)}</span>
                    </div>

                    {isLowStock && (
                      <div className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
                        Produto em falta
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1 md:ml-4">
                    <button
                      type="button"
                      onClick={() => setExpandedProductId((current) => current === product.id ? null : product.id)}
                      className="inline-flex items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                    >
                      {isExpanded ? 'Fechar' : 'Detalhe'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(product)}
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-2 py-1.5 text-[11px] font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-200 bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-900/40"
                      aria-label={`Remover ${product.name}`}
                      title="Remover produto"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
                    <div className="grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Custo</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(metrics.costPrice)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Valor final</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(metrics.salePrice)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Lucro</p>
                        <p className="font-semibold text-emerald-700 dark:text-emerald-300">{formatCurrency(metrics.unitProfit)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Margem</p>
                        <p className="font-semibold text-emerald-700 dark:text-emerald-300">{metrics.marginPercent.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Adicionar produto</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Fechar modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Nome do produto</label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none ring-0 transition focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Ex: Tela Samsung S25"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Valor de custo</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={draft.costPrice === 0 ? '' : String(draft.costPrice)}
                  onChange={(event) => {
                    const raw = event.target.value.replace(',', '.');
                    const parsed = Number(raw);
                    setDraft((current) => ({ ...current, costPrice: raw === '' ? 0 : Number.isFinite(parsed) ? parsed : current.costPrice }));
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none ring-0 transition focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Ex: 45,00"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Valor de venda</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={draft.salePrice === 0 ? '' : String(draft.salePrice)}
                  onChange={(event) => {
                    const raw = event.target.value.replace(',', '.');
                    const parsed = Number(raw);
                    setDraft((current) => ({ ...current, salePrice: raw === '' ? 0 : Number.isFinite(parsed) ? parsed : current.salePrice }));
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none ring-0 transition focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Ex: 89,90"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Quantidade inicial</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={draft.quantity === 0 ? '' : String(draft.quantity)}
                  onChange={(event) => {
                    const raw = event.target.value.replace(/[^0-9]/g, '');
                    setDraft((current) => ({ ...current, quantity: raw === '' ? 0 : Number(raw) }));
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none ring-0 transition focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Ex: 12"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddProduct}
                disabled={!draft.name.trim()}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Editar produto</h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Fechar modal de edição"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Nome</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  disabled
                  className="w-full rounded-xl border border-gray-300 bg-gray-100 px-3 py-2.5 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Valor de custo</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editDraft.costPrice === 0 ? '' : String(editDraft.costPrice)}
                  onChange={(event) => {
                    const raw = event.target.value.replace(',', '.');
                    const parsed = Number(raw);
                    setEditDraft((current) => ({ ...current, costPrice: raw === '' ? 0 : Number.isFinite(parsed) ? parsed : current.costPrice }));
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Valor de venda</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editDraft.salePrice === 0 ? '' : String(editDraft.salePrice)}
                  onChange={(event) => {
                    const raw = event.target.value.replace(',', '.');
                    const parsed = Number(raw);
                    setEditDraft((current) => ({ ...current, salePrice: raw === '' ? 0 : Number.isFinite(parsed) ? parsed : current.salePrice }));
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Quantidade</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editDraft.quantity === 0 ? '' : String(editDraft.quantity)}
                  onChange={(event) => {
                    const raw = event.target.value.replace(/[^0-9]/g, '');
                    setEditDraft((current) => ({ ...current, quantity: raw === '' ? 0 : Number(raw) }));
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  updateProduct(editingProduct.id, {
                    quantity: Math.max(0, Number(editDraft.quantity) || 0),
                    costPrice: Math.max(0, Number(editDraft.costPrice) || 0),
                    salePrice: Math.max(0, Number(editDraft.salePrice) || 0),
                    unitPrice: Math.max(0, Number(editDraft.salePrice) || 0),
                  });
                  setEditingProduct(null);
                }}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function OrcamentosPage() {
  return <OrcamentosPageComponent />;
}

export function VendasPage() {
  const { user } = useAuth();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [saleHistory, setSaleHistory] = useState<Array<{
    id: string;
    createdAt: string;
    items: Array<{ id: string; name: string; quantity: number; unitPrice: number }>;
    paymentMethod: string;
    discount: number;
    subtotal: number;
    total: number;
    printed: boolean;
  }>>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [discount, setDiscount] = useState(0);
  const [saleItems, setSaleItems] = useState<Array<{ id: string; name: string; quantity: number; unitPrice: number }>>([]);

  useEffect(() => {
    if (!user?.id) return;
    void loadUserCollection<StockItem>(user.id, 'estoque').then((items) => {
      setStock(items);
    });
    void loadUserCollection<{ id: string; createdAt: string; items: Array<{ id: string; name: string; quantity: number; unitPrice: number }>; paymentMethod: string; discount: number; subtotal: number; total: number; printed: boolean }>(user.id, 'vendas').then((items) => {
      setSaleHistory(items);
    });
  }, [user?.id]);

  const availableProducts = stock.filter((item) => item.quantity > 0);
  const selectedProduct = availableProducts.find((item) => item.id === selectedProductId) ?? null;

  useEffect(() => {
    if (availableProducts.length === 0) {
      setSelectedProductId('');
      return;
    }

    const hasSelectedProduct = availableProducts.some((product) => product.id === selectedProductId);
    if (!hasSelectedProduct) {
      setSelectedProductId(availableProducts[0].id);
    }
  }, [availableProducts, selectedProductId]);

  const matchingProducts = useMemo(() => {
    const normalizedSearch = productSearch.trim().toLowerCase();
    if (!normalizedSearch) {
      return [];
    }

    return availableProducts.filter((product) => product.name.toLowerCase().includes(normalizedSearch));
  }, [availableProducts, productSearch]);

  const addProductToSale = () => {
    const product = selectedProduct ?? matchingProducts[0] ?? availableProducts[0] ?? null;
    if (!product) return;

    const normalizedQty = Math.max(1, Number(quantity) || 1);
    const sellingPrice = product.salePrice ?? product.unitPrice ?? 0;

    setSaleItems((current) => {
      const existingIndex = current.findIndex((item) => item.id === product.id);

      if (existingIndex >= 0) {
        const next = [...current];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + normalizedQty,
        };
        return next;
      }

      return [...current, {
        id: product.id,
        name: product.name,
        quantity: normalizedQty,
        unitPrice: sellingPrice,
      }];
    });

    setQuantity(1);
  };

  const updateSaleItem = (id: string, delta: number) => {
    setSaleItems((current) => current
      .map((item) => item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
        : item)
      .filter((item) => item.quantity > 0));
  };

  const removeSaleItem = (id: string) => {
    setSaleItems((current) => current.filter((item) => item.id !== id));
  };

  const totalItems = saleItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalValue = saleItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const safeDiscount = Math.min(Math.max(0, discount), subtotalValue);
  const totalValue = Math.max(0, subtotalValue - safeDiscount);

  const openSaleConfirmation = () => {
    if (saleItems.length === 0) return;
    setShowSaleModal(true);
  };

  const finalizeSale = (printed: boolean) => {
    if (!user?.id || saleItems.length === 0) return;

    const nextSale = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      items: saleItems.map((item) => ({ ...item })),
      paymentMethod,
      discount: safeDiscount,
      subtotal: subtotalValue,
      total: totalValue,
      printed,
    };

    const nextHistory = [nextSale, ...saleHistory];
    setSaleHistory(nextHistory);
    void saveUserCollection(user.id, 'vendas', nextHistory);

    const nextStock = stock.map((item) => {
      const soldQuantity = saleItems.find((saleItem) => saleItem.id === item.id)?.quantity ?? 0;
      if (!soldQuantity) return item;

      const nextSalePrice = item.salePrice ?? item.unitPrice ?? 0;

      return {
        ...item,
        salePrice: nextSalePrice,
        unitPrice: nextSalePrice,
        quantity: Math.max(0, item.quantity - soldQuantity),
        updatedAt: new Date().toISOString(),
      };
    });

    setStock(nextStock);
    void saveUserCollection(user.id, 'estoque', nextStock);

    setSaleItems([]);
    setProductSearch('');
    setSelectedProductId('');
    setQuantity(1);
    setDiscount(0);
    setPaymentMethod('Dinheiro');
    setShowSaleModal(false);
  };


  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-green-100 bg-white p-4 shadow-sm dark:border-green-900/40 dark:bg-gray-900 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Vendas</h2>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Adicionar produto</h3>

          {availableProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              Nenhum produto disponível no estoque para venda.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Produto</label>
                <div className="relative">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="Buscar produto"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 outline-none transition focus:border-green-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
                </div>

                {productSearch.trim() && (
                  matchingProducts.length > 0 ? (
                    <div className="mt-2 max-h-52 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800/70">
                      {matchingProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            setSelectedProductId(product.id);
                            setProductSearch(product.name);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                            selectedProductId === product.id
                              ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300'
                              : 'border-transparent bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800'
                          }`}
                        >
                          <span className="font-medium">{product.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{product.quantity} und</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                      Nenhum produto encontrado na lista de estoque.
                    </p>
                  )
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Quantidade</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={quantity === 0 ? '' : String(quantity)}
                  onChange={(event) => {
                    const raw = event.target.value.replace(/[^0-9]/g, '');
                    setQuantity(raw === '' ? 0 : Number(raw));
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Ex: 2"
                />
              </div>

              <button
                type="button"
                onClick={addProductToSale}
                className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Adicionar à venda
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Resumo da nota</h3>
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
              {totalItems} itens
            </span>
          </div>

          <div className="space-y-3">
            {saleItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                Nenhum item adicionado à nota.
              </div>
            ) : (
              saleItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{item.quantity}x</span>
                        <span>{formatCurrency(item.unitPrice)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(item.quantity * item.unitPrice)}</p>
                      <div className="mt-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateSaleItem(item.id, -1)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                          aria-label={`Diminuir quantidade de ${item.name}`}
                        >
                          −
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSaleItem(item.id, 1)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                          aria-label={`Aumentar quantidade de ${item.name}`}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSaleItem(item.id)}
                          className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-md border border-red-200 bg-red-50 text-xs font-bold text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
                          aria-label={`Remover ${item.name}`}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>Subtotal</span>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(subtotalValue)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>Desconto</span>
              <span>- {formatCurrency(safeDiscount)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
              <span>Total</span>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalValue)}</span>
            </div>
          </div>

          <button
            type="button"
            disabled={saleItems.length === 0}
            onClick={openSaleConfirmation}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
          >
            Concluir venda
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Histórico de vendas</h3>
          <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
            {saleHistory.length} registro(s)
          </span>
        </div>

        {saleHistory.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma venda concluída ainda.</p>
        ) : (
          <div className="space-y-2">
            {saleHistory.slice(0, 5).map((sale) => (
              <div key={sale.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{new Date(sale.createdAt).toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{sale.paymentMethod} · {sale.items.length} item(ns)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(sale.total)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Resumo da venda</h3>
              <button
                type="button"
                onClick={() => setShowSaleModal(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Fechar resumo da venda"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
              {saleItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.quantity}x · {formatCurrency(item.unitPrice)}</p>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Forma de pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Pix">Pix</option>
                  <option value="Transferência">Transferência</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Desconto</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={discount === 0 ? '' : String(discount)}
                  onChange={(event) => {
                    const raw = event.target.value.replace(',', '.');
                    const parsed = Number(raw);
                    const nextValue = raw === '' ? 0 : Number.isFinite(parsed) ? Math.min(parsed, subtotalValue) : discount;
                    setDiscount(nextValue);
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Ex: 10,00"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Subtotal</span>
              <span className="text-base font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(subtotalValue)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>Desconto</span>
              <span>- {formatCurrency(safeDiscount)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalValue)}</span>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => finalizeSale(false)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Não imprimir
              </button>
              <button
                type="button"
                onClick={() => finalizeSale(true)}
                className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function FluxoCaixaPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [sales, setSales] = useState<Array<{
    id: string;
    createdAt: string;
    total: number;
    discount: number;
    paymentMethod: string;
    items: Array<{ id: string; name: string; quantity: number; unitPrice: number }>;
  }>>([]);
  const [manualExpenses, setManualExpenses] = useState<Array<{ id: string; label: string; value: number; type: 'Garantia' | 'Prejuízo' | 'Outros' }>>([
    { id: 'garantia-default', label: 'Garantia', value: 0, type: 'Garantia' },
    { id: 'prejuizo-default', label: 'Prejuízo', value: 0, type: 'Prejuízo' },
  ]);
  const [expenseLabel, setExpenseLabel] = useState('');
  const [expenseValue, setExpenseValue] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'hoje' | '7d' | '30d' | 'mes' | 'custom'>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const dateRanges = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);

    return {
      hoje: { start: startOfToday, end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999) },
      '7d': { start: oneWeekAgo, end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999) },
      '30d': { start: oneMonthAgo, end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999) },
      mes: { start: startOfMonth, end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999) },
    } as const;
  }, []);

  const matchesPeriod = (date: string | undefined) => {
    if (!date) return false;

    const currentDate = new Date(date);
    if (Number.isNaN(currentDate.getTime())) return false;

    if (selectedPeriod === 'custom') {
      const startDate = customStartDate ? new Date(`${customStartDate}T00:00:00`) : null;
      const endDate = customEndDate ? new Date(`${customEndDate}T23:59:59.999`) : null;

      if (startDate && currentDate < startDate) return false;
      if (endDate && currentDate > endDate) return false;
      return true;
    }

    const range = dateRanges[selectedPeriod];
    if (!range) return true;

    return currentDate >= range.start && currentDate <= range.end;
  };

  useEffect(() => {
    if (!user?.id) return;

    Promise.all([
      loadOrders(user.id),
      loadUserCollection<{ id: string; createdAt: string; total: number; discount: number; paymentMethod: string; items: Array<{ id: string; name: string; quantity: number; unitPrice: number }> }>(user.id, 'vendas'),
    ]).then(([nextOrders, nextSales]) => {
      setOrders(nextOrders);
      setSales(nextSales.map((sale) => ({
        ...sale,
        total: Number(sale.total) || 0,
        discount: Number(sale.discount) || 0,
      })));
    });
  }, [user?.id]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

  const parseMonetaryValue = (value: string | number | undefined) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (!value) return 0;

    const sanitized = String(value).replace(/[R$\s.]/g, '').replace(',', '.');
    const parsed = Number(sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const filteredOrders = useMemo(
    () => orders.filter((order) => matchesPeriod(order.createdAt)),
    [orders, selectedPeriod, customStartDate, customEndDate],
  );

  const filteredSales = useMemo(
    () => sales.filter((sale) => matchesPeriod(sale.createdAt)),
    [sales, selectedPeriod, customStartDate, customEndDate],
  );

  const serviceRevenue = useMemo(
    () => filteredOrders.reduce((sum, order) => sum + parseMonetaryValue(order.serviceValue), 0),
    [filteredOrders],
  );

  const salesRevenue = useMemo(
    () => filteredSales.reduce((sum, sale) => sum + sale.total, 0),
    [filteredSales],
  );

  const totalEntries = salesRevenue + serviceRevenue;
  const totalDiscounts = filteredSales.reduce((sum, sale) => sum + (sale.discount || 0), 0);
  const totalExpenses = manualExpenses.reduce((sum, expense) => sum + expense.value, 0);
  const netProfit = totalEntries - totalExpenses - totalDiscounts;

  const paymentBreakdown = useMemo(() => {
    const labels = ['Dinheiro', 'Pix', 'Cartão', 'Transferência'];
    return labels.map((label) => {
      const value = filteredSales
        .filter((sale) => sale.paymentMethod === label)
        .reduce((sum, sale) => sum + sale.total, 0);

      return { label, value };
    });
  }, [filteredSales]);

  const maxPaymentValue = Math.max(...paymentBreakdown.map((item) => item.value), 1);

  const revenueSources = useMemo(() => [
    { label: 'Vendas', value: salesRevenue },
    { label: 'Serviços', value: serviceRevenue },
  ], [salesRevenue, serviceRevenue]);

  const maxRevenueSource = Math.max(...revenueSources.map((item) => item.value), 1);

  const recentMovements = useMemo(() => {
    const salesMovements = filteredSales.map((sale) => ({
      id: sale.id,
      label: `Venda · ${sale.items.length} item(ns)`,
      value: sale.total,
      date: sale.createdAt,
      type: 'Entrada' as const,
    }));

    const serviceMovements = filteredOrders.map((order) => ({
      id: order.id,
      label: `${order.client} · ${order.device}`,
      value: parseMonetaryValue(order.serviceValue),
      date: order.createdAt,
      type: 'Serviço' as const,
    }));

    return [...salesMovements, ...serviceMovements]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [filteredOrders, filteredSales]);

  const addExpense = () => {
    const label = expenseLabel.trim();
    const value = Number(expenseValue.replace(',', '.'));
    if (!label || !Number.isFinite(value) || value <= 0) return;

    setManualExpenses((current) => [
      { id: crypto.randomUUID(), label, value, type: 'Outros' },
      ...current,
    ]);
    setExpenseLabel('');
    setExpenseValue('');
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm dark:border-emerald-900/40 dark:bg-gray-900">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Fluxo de Caixa</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Financeiro da empresa</h2>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-wrap gap-2">
              {(['hoje', '7d', '30d', 'mes'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setSelectedPeriod(period)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                    selectedPeriod === period
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {period === 'hoje' ? 'Hoje' : period === '7d' ? '7 dias' : period === '30d' ? '30 dias' : 'Mês'}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setSelectedPeriod('custom')}
                className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  selectedPeriod === 'custom'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Personalizado
              </button>
            </div>

            {selectedPeriod === 'custom' && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(event) => setCustomStartDate(event.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
                <span className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">até</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(event) => setCustomEndDate(event.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm dark:border-emerald-800 dark:from-emerald-950/40 dark:to-gray-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Entradas</p>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalEntries)}</p>
          <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">Vendas + serviços</p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-4 shadow-sm dark:border-red-800 dark:from-red-950/40 dark:to-gray-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-700 dark:text-red-300">Saídas</p>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalExpenses + totalDiscounts)}</p>
          <p className="mt-2 text-xs text-red-700 dark:text-red-300">Garantias, prejuízos e descontos</p>
        </div>

        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm dark:border-violet-800 dark:from-violet-950/40 dark:to-gray-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">Lucro líquido</p>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(netProfit)}</p>
          <p className="mt-2 text-xs text-violet-700 dark:text-violet-300">Resultado atual do negócio</p>
        </div>

        <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-4 shadow-sm dark:border-cyan-800 dark:from-cyan-950/40 dark:to-gray-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Vendas</p>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(salesRevenue)}</p>
          <p className="mt-2 text-xs text-cyan-700 dark:text-cyan-300">Total em vendas concluidas</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Lucro por origem</h3>
            <span className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Tempo real</span>
          </div>

          <div className="space-y-4">
            {revenueSources.map((source) => (
              <div key={source.label}>
                <div className="mb-1 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>{source.label}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(source.value)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-full rounded-full ${source.label === 'Vendas' ? 'bg-emerald-500' : 'bg-violet-500'}`}
                    style={{ width: `${(source.value / maxRevenueSource) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Formas de pagamento</h3>
            <span className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Vendas</span>
          </div>

          <div className="space-y-3">
            {paymentBreakdown.map((entry) => (
              <div key={entry.label}>
                <div className="mb-1 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>{entry.label}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(entry.value)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-600"
                    style={{ width: `${(entry.value / maxPaymentValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Entradas e saídas</h3>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              Atualização em tempo real
            </span>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between text-sm text-emerald-800 dark:text-emerald-300">
                <span>Entradas totais</span>
                <span className="font-bold">{formatCurrency(totalEntries)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
              <div className="flex items-center justify-between text-sm text-red-800 dark:text-red-300">
                <span>Descontos e perdas</span>
                <span className="font-bold">{formatCurrency(totalExpenses + totalDiscounts)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 dark:border-violet-800 dark:bg-violet-950/20">
              <div className="flex items-center justify-between text-sm text-violet-800 dark:text-violet-300">
                <span>Lucro líquido</span>
                <span className="font-bold">{formatCurrency(netProfit)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Perdas / garantias</h3>
            <span className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Saídas</span>
          </div>

          <div className="space-y-3">
            {manualExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{expense.label}</p>
                  <p className="text-[11px] uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">{expense.type}</p>
                </div>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">-{formatCurrency(expense.value)}</span>
              </div>
            ))}
            <div className="space-y-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
              <input
                value={expenseLabel}
                onChange={(event) => setExpenseLabel(event.target.value)}
                placeholder="Nome da perda / garantia"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
              <div className="flex gap-2">
                <input
                  value={expenseValue}
                  onChange={(event) => setExpenseValue(event.target.value.replace(/[^0-9,.-]/g, ''))}
                  placeholder="Valor"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={addExpense}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Movimentações recentes</h3>
          <span className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Últimos registros</span>
        </div>

        <div className="space-y-2">
          {recentMovements.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Ainda não há movimentações no caixa.</p>
          ) : (
            recentMovements.map((movement) => (
              <div key={`${movement.type}-${movement.id}`} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{movement.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(movement.date).toLocaleString('pt-BR')}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${movement.type === 'Entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-violet-600 dark:text-violet-400'}`}>
                    {movement.type === 'Entrada' ? '+' : ''}{formatCurrency(movement.value)}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">{movement.type}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function AcompanhamentoPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [sendingOrderId, setSendingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    return subscribeOrders(user.id, (items) => setOrders(items));
  }, [user?.id]);

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status !== 'Concluída').sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders],
  );

  const buildStatusTrackingMessage = (order: ServiceOrder, shareUrl: string) =>
    `Olá ${order.client}!\nAcompanhe o andamento do seu aparelho ${order.device} aqui:\n${shareUrl}`;

  const updateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    const updated = orders.map((order) => order.id === orderId ? { ...order, status: nextStatus } : order);
    setOrders(updated);
    await saveOrders(user?.id, updated);

    const target = updated.find((order) => order.id === orderId);
    if (!target) return;

    try {
      await savePublicStatus({
        orderId: target.id,
        client: target.client,
        device: target.device,
        phone: target.phone,
        status: target.status,
        updatedAt: new Date().toISOString(),
        shareUrl: buildPublicStatusUrl(target.id),
      });
    } catch (error) {
      console.error('Erro ao sincronizar status público:', error);
    }
  };

  const moveStatus = async (orderId: string, direction: 'prev' | 'next') => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;

    const currentIndex = statusSequence.indexOf(order.status);
    const targetIndex = direction === 'prev' ? Math.max(currentIndex - 1, 0) : Math.min(currentIndex + 1, statusSequence.length - 1);
    if (currentIndex === targetIndex) return;

    const nextStatus = statusSequence[targetIndex];
    await updateStatus(orderId, nextStatus);
  };

  const openWhatsApp = async (order: ServiceOrder) => {
    if (order.status === 'Concluída' || sendingOrderId === order.id) return;

    const targetPhone = getWhatsAppTarget(order.phone ?? '');
    if (!targetPhone) return;

    setSendingOrderId(order.id);

    try {
      const shareUrl = buildPublicStatusUrl(order.id);
      const message = buildStatusTrackingMessage(order, shareUrl);
      const link = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;

      try {
        await savePublicStatus({
          orderId: order.id,
          client: order.client,
          device: order.device,
          phone: order.phone,
          status: order.status,
          updatedAt: new Date().toISOString(),
          shareUrl,
        });
      } catch (error) {
        console.error('Erro ao atualizar status público do WhatsApp:', error);
      }

      window.open(link, '_blank', 'noopener,noreferrer');
    } finally {
      setSendingOrderId(null);
    }
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
            const progressPercent = ((activeIndex + 1) / statusSequence.length) * 100;

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

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveStatus(order.id, 'prev')}
                      disabled={activeIndex === 0}
                      aria-label="Status anterior"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-xl font-black text-gray-700 shadow-sm transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      «
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStatus(order.id, 'next')}
                      disabled={activeIndex === statusSequence.length - 1}
                      aria-label="Próximo status"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-xl font-black text-gray-700 shadow-sm transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      »
                    </button>
                    {!order.status || order.status !== 'Concluída' ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          openWhatsApp(order);
                        }}
                        disabled={sendingOrderId === order.id || !getWhatsAppTarget(order.phone ?? '') || order.phone === 'Não informado'}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
                      >
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
                        <path d="M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.48 0 .09 5.39.09 12.01c0 2.1.55 4.15 1.59 5.95L0 24l6.18-1.62A11.93 11.93 0 0 0 12.08 24c6.62 0 12-5.39 12-12.01 0-3.2-1.24-6.22-3.56-8.51ZM12.08 21.9c-1.89 0-3.74-.5-5.35-1.45l-.38-.23-3.67.96 1-3.57-.24-.37a9.88 9.88 0 0 1-1.54-5.22c0-5.46 4.46-9.9 9.96-9.9a9.87 9.87 0 0 1 7 2.92 9.78 9.78 0 0 1 2.92 7.02c.01 5.46-4.45 9.9-9.91 9.9Zm5.43-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.46-.15-.66.15-.19.3-.74.97-.91 1.17-.17.2-.33.22-.62.08-.3-.15-1.27-.47-2.41-1.49-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.33.45-.5.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.91-2.2-.24-.57-.48-.49-.66-.49h-.57c-.2 0-.52.07-.79.37-.27.3-1.03 1.01-1.03 2.46s1.05 2.84 1.2 3.04c.15.2 2.05 3.13 4.98 4.39.7.3 1.24.48 1.67.62.7.22 1.34.19 1.84.12.56-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.18-1.42-.08-.12-.27-.2-.57-.35Z" />
                        </svg>
                        Enviar status
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                    <span>Progresso</span>
                    <span>{activeIndex + 1}/{statusSequence.length}</span>
                  </div>

                  <div className="relative mb-6">
                    <div className="absolute left-0 right-0 top-4 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div
                      className="absolute left-0 top-4 h-1 rounded-full bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />

                    <div className="relative flex items-start justify-between">
                      {statusSequence.map((status, index) => {
                        const isComplete = index <= activeIndex;
                        const isCurrent = index === activeIndex;

                        return (
                          <div key={status} className="flex w-full flex-col items-center gap-2">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-bold transition ${
                              isComplete
                                ? 'border-cyan-500 bg-cyan-500 text-white shadow-md'
                                : 'border-gray-300 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
                            } ${isCurrent ? 'ring-4 ring-cyan-100 dark:ring-cyan-900/40' : ''}`}>
                              {index + 1}
                            </div>
                            <span className={`max-w-[90px] text-center text-[10px] font-medium ${isCurrent ? 'text-cyan-700 dark:text-cyan-300' : 'text-gray-500 dark:text-gray-400'}`}>
                              {status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
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
