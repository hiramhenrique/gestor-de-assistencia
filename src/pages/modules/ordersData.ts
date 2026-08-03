export type OrderStatus = 'Em análise' | 'Aguardando peça' | 'Em andamento' | 'Concluída' | 'Aguardando aprovação';
export type OrderPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

export interface ServiceOrder {
  id: string;
  client: string;
  phone: string;
  device: string;
  serial: string;
  problem: string;
  status: OrderStatus;
  priority: OrderPriority;
  technician: string;
  entryDate: string;
  deadline: string;
  budget: string;
  warranty: string;
  usedParts: string[];
  observations: string;
  createdAt: string;
  serviceValue: string;
  clientId: string;
  technicianId: string;
}

const ORDERS_STORAGE_KEY = 'assistencia_orders';

export const initialOrders: ServiceOrder[] = [
  {
    id: 'OS-0241',
    client: 'João Ferreira',
    phone: '(11) 98888-1122',
    device: 'Notebook Dell Inspiron 15',
    serial: 'DL-874512',
    problem: 'Tela com manchas e teclado travado.',
    status: 'Em andamento',
    priority: 'Alta',
    technician: 'Renato',
    entryDate: '15/07/2026',
    deadline: '17/07/2026',
    budget: 'R$ 980,00',
    warranty: '12 meses',
    usedParts: ['Teclado', 'Tela LCD'],
    observations: 'Cliente optou por manutenção com prazo urgente.',
    createdAt: '15/07/2026 09:20',
    serviceValue: 'R$ 980,00',
    clientId: 'CL-001',
    technicianId: 'FUN-001',
  },
  {
    id: 'OS-0240',
    client: 'Maria Santos',
    phone: '(21) 97777-4455',
    device: 'iPhone 13 Pro',
    serial: 'IPH-221344',
    problem: 'Bateria descarregando e tela sem resposta.',
    status: 'Aguardando peça',
    priority: 'Média',
    technician: 'Ana',
    entryDate: '14/07/2026',
    deadline: '18/07/2026',
    budget: 'R$ 640,00',
    warranty: '90 dias',
    usedParts: ['Bateria'],
    observations: 'Peça aguardando chegada do fornecedor.',
    createdAt: '14/07/2026 13:45',
    serviceValue: 'R$ 640,00',
    clientId: 'CL-002',
    technicianId: 'FUN-002',
  },
  {
    id: 'OS-0239',
    client: 'Carlos Oliveira',
    phone: '(31) 96666-7788',
    device: 'Smart TV Samsung 55"',
    serial: 'TV-981203',
    problem: 'TV sem imagem, áudio funcionando.',
    status: 'Concluída',
    priority: 'Baixa',
    technician: 'Bruno',
    entryDate: '12/07/2026',
    deadline: '12/07/2026',
    budget: 'R$ 320,00',
    warranty: '6 meses',
    usedParts: ['Placa de vídeo', 'Fonte'],
    observations: 'Serviço concluído e cliente retirou o equipamento.',
    createdAt: '12/07/2026 16:05',
    serviceValue: 'R$ 320,00',
    clientId: '',
    technicianId: '',
  },
];

export function loadOrders(): ServiceOrder[] {
  if (typeof window === 'undefined') return initialOrders;
  const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
  if (!raw) return initialOrders;
  try {
    const parsed = JSON.parse(raw) as ServiceOrder[];
    return parsed.length ? parsed : initialOrders;
  } catch {
    return initialOrders;
  }
}

export function saveOrders(orders: ServiceOrder[]) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  }
}
