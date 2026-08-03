export interface ClientRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpf: string;
  address: string;
  notes: string;
}

const CLIENTS_STORAGE_KEY = 'assistencia_clients';

export const initialClients: ClientRecord[] = [
  {
    id: 'CL-001',
    name: 'João Ferreira',
    phone: '(11) 98888-1122',
    email: 'joao@email.com',
    cpf: '123.456.789-00',
    address: 'Rua das Flores, 123',
    notes: 'Cliente preferencial',
  },
  {
    id: 'CL-002',
    name: 'Maria Santos',
    phone: '(21) 97777-4455',
    email: 'maria@email.com',
    cpf: '987.654.321-00',
    address: 'Av. do Sol, 99',
    notes: 'Prefere atendimento rápido',
  },
];

export function loadClients(): ClientRecord[] {
  if (typeof window === 'undefined') return initialClients;
  const raw = window.localStorage.getItem(CLIENTS_STORAGE_KEY);
  if (!raw) return initialClients;
  try {
    const parsed = JSON.parse(raw) as ClientRecord[];
    return parsed.length ? parsed : initialClients;
  } catch {
    return initialClients;
  }
}

export function saveClients(clients: ClientRecord[]) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  }
}
