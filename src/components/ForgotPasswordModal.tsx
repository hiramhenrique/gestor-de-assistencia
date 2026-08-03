import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, X, CheckCircle } from 'lucide-react';
import Input from './ui/Input';
import Button from './ui/Button';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormData {
  email: string;
}

export default function ForgotPasswordModal({ open, onClose }: ForgotPasswordModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  // Fecha ao pressionar Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Bloqueia scroll do body enquanto aberta
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function handleClose() {
    onClose();
    // Aguarda animação de saída antes de resetar
    setTimeout(() => {
      reset();
      setSubmitted(false);
      setSubmittedEmail('');
    }, 300);
  }

  const onSubmit = async ({ email }: FormData) => {
    // TODO: chamar API de recuperação de senha aqui
    // Ex: await authService.sendPasswordReset(email)
    setSubmittedEmail(email);
    setSubmitted(true);
  };

  // Fecha ao clicar no overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose();
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black/40 dark:bg-black/60 backdrop-blur-sm
        animate-[fadeIn_0.15s_ease]"
    >
      <div
        className="relative w-full max-w-md
          bg-white dark:bg-gray-800
          rounded-2xl shadow-2xl
          border border-violet-100 dark:border-violet-900
          p-8 animate-[slideUp_0.2s_ease]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-title"
      >
        {/* Botão fechar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          /* ── Estado: formulário ── */
          <>
            <div className="mb-6">
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/40 rounded-xl flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <h2
                id="forgot-title"
                className="text-xl font-semibold text-gray-900 dark:text-gray-100"
              >
                Recuperar senha
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Informe seu e-mail cadastrado. Enviaremos as instruções de recuperação em instantes.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                required
                autoFocus
                icon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email', {
                  required: 'E-mail é obrigatório.',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'E-mail inválido.',
                  },
                })}
              />

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="secondary" fullWidth onClick={handleClose}>
                  Cancelar
                </Button>
                <Button type="submit" fullWidth loading={isSubmitting}>
                  Enviar instruções
                </Button>
              </div>
            </form>
          </>
        ) : (
          /* ── Estado: confirmação ── */
          <div className="text-center py-2">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              E-mail enviado!
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-1">
              As instruções para redefinir sua senha foram enviadas para:
            </p>
            <p className="text-sm font-semibold text-violet-600 dark:text-violet-400 mb-6 break-all">
              {submittedEmail}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
              Não recebeu? Verifique a pasta de spam ou aguarde alguns minutos.
            </p>
            <Button fullWidth onClick={handleClose}>
              Voltar ao login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
