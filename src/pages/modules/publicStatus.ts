import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
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

const PUBLIC_STATUS_COLLECTION = 'public-status';

export function buildPublicStatusUrl(orderId: string): string {
  if (typeof window === 'undefined' || !orderId) return '';
  const url = new URL('/status', window.location.origin);
  url.searchParams.set('os', orderId);
  return url.toString();
}

export async function readPublicStatus(orderId: string): Promise<PublicOrderStatusData | null> {
  if (!orderId) return null;

  const ref = doc(db, PUBLIC_STATUS_COLLECTION, orderId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;

  return snapshot.data() as PublicOrderStatusData;
}

export async function savePublicStatus(data: PublicOrderStatusData) {
  const ref = doc(db, PUBLIC_STATUS_COLLECTION, data.orderId);
  await setDoc(ref, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function removePublicStatus(orderId: string) {
  if (!orderId) return;
  const ref = doc(db, PUBLIC_STATUS_COLLECTION, orderId);
  await deleteDoc(ref);
}
