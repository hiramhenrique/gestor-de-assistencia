export interface EmployeeRecord {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
}

const EMPLOYEES_STORAGE_KEY = 'assistencia_employees';

export const initialEmployees: EmployeeRecord[] = [
  {
    id: 'FUN-001',
    name: 'Renato',
    role: 'Técnico Sênior',
    phone: '(11) 98888-3344',
    email: 'renato@assistencia.com',
  },
  {
    id: 'FUN-002',
    name: 'Ana',
    role: 'Técnica Mobile',
    phone: '(21) 97777-6677',
    email: 'ana@assistencia.com',
  },
];

export function loadEmployees(): EmployeeRecord[] {
  if (typeof window === 'undefined') return initialEmployees;
  const raw = window.localStorage.getItem(EMPLOYEES_STORAGE_KEY);
  if (!raw) return initialEmployees;
  try {
    const parsed = JSON.parse(raw) as EmployeeRecord[];
    return parsed.length ? parsed : initialEmployees;
  } catch {
    return initialEmployees;
  }
}

export function saveEmployees(employees: EmployeeRecord[]) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
  }
}
