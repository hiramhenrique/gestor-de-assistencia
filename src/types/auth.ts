export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormData {
  // Dados Pessoais
  fullName: string;
  cpf: string;
  birthDate: string;
  gender: 'masculino' | 'feminino' | 'outro' | '';
  phone: string;

  // Endereço
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;

  // Acesso
  email: string;
  password: string;
  confirmPassword: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  cpf: string;
  phone: string;
  createdAt: string;
}
