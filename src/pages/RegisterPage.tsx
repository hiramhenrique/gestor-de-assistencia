import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  PartyPopper,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { RegisterFormData } from '../types/auth';
import { maskCPF, maskPhone, maskCEP, validateCPF } from '../utils/masks';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import AbstractBackground from '../components/AbstractBackground';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
}

const STEPS = ['Dados Pessoais', 'Endereço', 'Acesso'];

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
].map((s) => ({ value: s, label: s }));

export default function RegisterPage({ onNavigateToLogin }: RegisterPageProps) {
  const { register: registerUser } = useAuth();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    mode: 'onTouched',
    defaultValues: { gender: '', state: '' },
  });

  const password = watch('password');

  const stepFields: (keyof RegisterFormData)[][] = [
    ['fullName', 'cpf', 'birthDate', 'gender', 'phone'],
    ['cep', 'street', 'number', 'neighborhood', 'city', 'state'],
    ['email', 'password', 'confirmPassword'],
  ];

  const handleNext = async () => {
    const valid = await trigger(stepFields[step] as (keyof RegisterFormData)[]);
    if (valid) setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    setLoading(true);
    try {
      await registerUser(data);
      setDone(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao cadastrar.');
      setLoading(false);
    }
  };

  // ── Mask handlers ──
  const handleCPF = (e: React.ChangeEvent<HTMLInputElement>) =>
    setValue('cpf', maskCPF(e.target.value), { shouldValidate: true });

  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) =>
    setValue('phone', maskPhone(e.target.value), { shouldValidate: true });

  // ── Data de nascimento: máscara automática sem precisar digitar '/' ──
  const handleBirthDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setValue('birthDate', formatted, { shouldValidate: digits.length === 8 });
  };

  // ── CEP com autocomplete via ViaCEP ──
  const handleCEP = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCEP(e.target.value);
    setValue('cep', masked, { shouldValidate: true });

    const digits = masked.replace(/\D/g, '');
    if (digits.length !== 8) return;

    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setValue('street', data.logradouro || '', { shouldValidate: true });
        setValue('neighborhood', data.bairro || '', { shouldValidate: true });
        setValue('city', data.localidade || '', { shouldValidate: true });
        setValue('state', data.uf || '', { shouldValidate: true });
      }
    } catch {
      // falha silenciosa — usuário preenche manualmente
    } finally {
      setCepLoading(false);
    }
  };

  // ── Tela de sucesso ──
  if (done) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-violet-200 via-slate-100 to-cyan-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 transition-colors overflow-hidden">
        <AbstractBackground />
        <ThemeToggle />
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-violet-100 dark:border-violet-900 p-10">
            <div className="w-20 h-20 bg-violet-100 dark:bg-violet-900/40 rounded-full flex items-center justify-center mx-auto mb-5">
              <PartyPopper className="w-10 h-10 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Cadastro realizado!</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
              Sua conta foi criada com sucesso. Agora é só fazer o login e começar a usar o sistema.
            </p>
            <Button fullWidth onClick={onNavigateToLogin}>
              Ir para o Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-violet-200 via-slate-100 to-cyan-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 transition-colors overflow-hidden">
      <AbstractBackground />
      <ThemeToggle />
      <div className="relative z-10 w-full max-w-lg">
        {/* Logo em destaque */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-gray-700 rounded-2xl shadow-lg shadow-gray-900 px-8 py-4">
            <Logo className="w-40 h-auto" />
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-0 mb-6">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    i < step
                      ? 'bg-violet-600 text-white'
                      : i === step
                      ? 'bg-violet-600 text-white ring-4 ring-violet-100'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`text-xs mt-1 whitespace-nowrap ${
                    i <= step ? 'text-violet-600 font-medium' : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-16 mx-1 mb-4 transition-all ${
                    i < step ? 'bg-violet-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-violet-100 dark:border-violet-900 p-8">
          {serverError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
              <span className="text-base">✕</span>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* ── STEP 0 · Dados Pessoais ── */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-violet-600" />
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Dados Pessoais</h2>
                </div>

                <Input
                  label="Nome completo"
                  placeholder="João da Silva"
                  required
                  error={errors.fullName?.message}
                  {...register('fullName', {
                    required: 'Nome é obrigatório.',
                    minLength: { value: 3, message: 'Mínimo 3 caracteres.' },
                    validate: (v) =>
                      v.trim().split(/\s+/).length >= 2 || 'Informe nome e sobrenome.',
                  })}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="CPF"
                    placeholder="000.000.000-00"
                    required
                    error={errors.cpf?.message}
                    {...register('cpf', {
                      required: 'CPF é obrigatório.',
                      validate: (v) => validateCPF(v) || 'CPF inválido.',
                    })}
                    onChange={handleCPF}
                  />
                  <Input
                    label="Data de nascimento"
                    placeholder="DD/MM/AAAA"
                    inputMode="numeric"
                    required
                    error={errors.birthDate?.message}
                    {...register('birthDate', {
                      required: 'Data obrigatória.',
                      pattern: {
                        value: /^\d{2}\/\d{2}\/\d{4}$/,
                        message: 'Formato: DD/MM/AAAA',
                      },
                    })}
                    onChange={handleBirthDate}
                  />
                </div>

                <Select
                  label="Gênero"
                  required
                  placeholder="Selecione..."
                  options={[
                    { value: 'masculino', label: 'Masculino' },
                    { value: 'feminino', label: 'Feminino' },
                    { value: 'outro', label: 'Prefiro não informar' },
                  ]}
                  error={errors.gender?.message}
                  {...register('gender', { required: 'Selecione o gênero.' })}
                />

                <Input
                  label="Telefone / Celular"
                  placeholder="(00) 00000-0000"
                  required
                  icon={<Phone className="w-4 h-4" />}
                  error={errors.phone?.message}
                  {...register('phone', {
                    required: 'Telefone obrigatório.',
                    minLength: { value: 14, message: 'Número incompleto.' },
                  })}
                  onChange={handlePhone}
                />
              </div>
            )}

            {/* ── STEP 1 · Endereço ── */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-violet-600" />
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Endereço</h2>
                </div>

                {/* CEP com indicador de loading */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                    <Input
                      label="CEP"
                      placeholder="00000-000"
                      inputMode="numeric"
                      required
                      error={errors.cep?.message}
                      {...register('cep', {
                        required: 'CEP obrigatório.',
                        pattern: { value: /^\d{5}-\d{3}$/, message: 'CEP inválido.' },
                      })}
                      onChange={handleCEP}
                    />
                    {cepLoading && (
                      <Loader2 className="absolute right-3 bottom-2.5 w-4 h-4 text-violet-500 animate-spin" />
                    )}
                  </div>
                  <div className="col-span-2">
                    <Input
                      label="Logradouro"
                      placeholder="Rua, Avenida..."
                      required
                      error={errors.street?.message}
                      {...register('street', { required: 'Logradouro obrigatório.' })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Número"
                    placeholder="123"
                    required
                    error={errors.number?.message}
                    {...register('number', { required: 'Número obrigatório.' })}
                  />
                  <div className="col-span-2">
                    <Input
                      label="Complemento"
                      placeholder="Apto, Sala..."
                      error={errors.complement?.message}
                      {...register('complement')}
                    />
                  </div>
                </div>

                <Input
                  label="Bairro"
                  placeholder="Centro"
                  required
                  error={errors.neighborhood?.message}
                  {...register('neighborhood', { required: 'Bairro obrigatório.' })}
                />

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Input
                      label="Cidade"
                      placeholder="São Paulo"
                      required
                      error={errors.city?.message}
                      {...register('city', { required: 'Cidade obrigatória.' })}
                    />
                  </div>
                  <Select
                    label="UF"
                    required
                    placeholder="--"
                    options={STATES}
                    error={errors.state?.message}
                    {...register('state', { required: 'UF obrigatório.' })}
                  />
                </div>
              </div>
            )}

            {/* ── STEP 2 · Dados de Acesso ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-violet-600" />
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Dados de Acesso</h2>
                </div>

                <Input
                  label="E-mail"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  icon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  {...register('email', {
                    required: 'E-mail obrigatório.',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'E-mail inválido.',
                    },
                  })}
                />

                <div className="relative">
                  <Input
                    label="Senha"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    required
                    icon={<Lock className="w-4 h-4" />}
                    error={errors.password?.message}
                    {...register('password', {
                      required: 'Senha obrigatória.',
                      minLength: { value: 8, message: 'Mínimo 8 caracteres.' },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Use letras maiúsculas, minúsculas e números.',
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 bottom-2.5 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {password && <PasswordStrength password={password} />}

                <div className="relative">
                  <Input
                    label="Confirmar senha"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    required
                    icon={<Lock className="w-4 h-4" />}
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword', {
                      required: 'Confirmação obrigatória.',
                      validate: (v) => v === password || 'As senhas não coincidem.',
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 bottom-2.5 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Navegação entre steps */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <Button type="button" variant="secondary" onClick={handleBack} className="flex-1">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={handleNext} fullWidth={step === 0} className="flex-1">
                  Próximo <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button type="submit" loading={loading} className="flex-1">
                  Criar conta
                </Button>
              )}
            </div>
          </form>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Já tem conta?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-violet-600 dark:text-violet-400 font-semibold hover:underline"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Componente inline de força de senha ──
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Letra maiúscula', ok: /[A-Z]/.test(password) },
    { label: 'Letra minúscula', ok: /[a-z]/.test(password) },
    { label: 'Número', ok: /\d/.test(password) },
    { label: 'Caractere especial', ok: /[^a-zA-Z0-9]/.test(password) },
  ];
  const strength = checks.filter((c) => c.ok).length;
  const bar = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];
  const labels = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i < strength ? bar[strength - 1] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">Força da senha:</span>
        <span
          className={`text-xs font-medium ${
            strength >= 4 ? 'text-green-600' : strength >= 3 ? 'text-violet-600' : 'text-red-500'
          }`}
        >
          {labels[strength - 1] ?? 'Muito fraca'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5 text-xs">
            <div
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                c.ok ? 'bg-green-500' : 'bg-gray-200'
              }`}
            >
              {c.ok && <Check className="w-2 h-2 text-white" />}
            </div>
            <span className={c.ok ? 'text-green-700 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
