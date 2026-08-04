export interface EmployeeRecord {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
}

import { loadUserCollection, saveUserCollection } from '../../lib/userData';

export const initialEmployees: EmployeeRecord[] = [];

export async function loadEmployees(userId?: string): Promise<EmployeeRecord[]> {
  if (!userId) return initialEmployees;
  return loadUserCollection<EmployeeRecord>(userId, 'funcionarios');
}

export async function saveEmployees(userId: string | undefined, employees: EmployeeRecord[]) {
  if (!userId) return;
  return saveUserCollection(userId, 'funcionarios', employees);
}
