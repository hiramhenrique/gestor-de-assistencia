export type OrderStatus = 'Em análise' | 'Aguardando aprovação' | 'Aguardando peça' | 'Em andamento' | 'Concluída';
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
  paymentMethod?: string;
  paymentReceived?: number;
  paymentSpent?: number;
  clientId: string;
  technicianId: string;
}

import { loadUserCollection, saveUserCollection, subscribeUserCollection } from '../../lib/userData';

export const initialOrders: ServiceOrder[] = [];

export async function loadOrders(userId?: string): Promise<ServiceOrder[]> {
  if (!userId) return initialOrders;
  return loadUserCollection<ServiceOrder>(userId, 'ordens');
}

export async function saveOrders(userId: string | undefined, orders: ServiceOrder[]) {
  if (!userId) return;
  return saveUserCollection(userId, 'ordens', orders);
}

export function subscribeOrders(userId: string, onChange: (orders: ServiceOrder[]) => void) {
  return subscribeUserCollection<ServiceOrder>(userId, 'ordens', onChange);
}
