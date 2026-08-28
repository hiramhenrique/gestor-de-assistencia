import type { OrderStatus } from './ordersData';

export const statusSequence: OrderStatus[] = ['Em análise', 'Aguardando aprovação', 'Aguardando peça', 'Em andamento', 'Concluída'];

export interface PublicOrderStatusData {
  orderId: string;
  client: string;
  device: string;
  phone: string;
  status: OrderStatus;
  updatedAt: string;
  shareUrl: string;
}

const PUBLIC_STATUS_KEY_PREFIX = 'public-order-status:';

export function buildPublicStatusUrl(orderId: string): string {
  if (typeof window === 'undefined' || !orderId) return '';
  const url = new URL('/status', window.location.origin);
  url.searchParams.set('os', orderId);
  return url.toString();
}

export function readPublicStatus(orderId: string): PublicOrderStatusData | null {
  if (typeof window === 'undefined' || !orderId) return null;

  try {
    const raw = window.localStorage.getItem(`${PUBLIC_STATUS_KEY_PREFIX}${orderId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PublicOrderStatusData;
    return parsed;
  } catch {
    return null;
  }
}

export function savePublicStatus(data: PublicOrderStatusData) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`${PUBLIC_STATUS_KEY_PREFIX}${data.orderId}`, JSON.stringify(data));
}

export function removePublicStatus(orderId: string) {
  if (typeof window === 'undefined' || !orderId) return;
  window.localStorage.removeItem(`${PUBLIC_STATUS_KEY_PREFIX}${orderId}`);
}
