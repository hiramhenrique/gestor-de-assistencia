import { useRef, useState, type ChangeEvent } from 'react';
import { ArchiveRestore, Download, Upload, TriangleAlert } from 'lucide-react';
import { downloadLocalBackup, parseLocalBackupJson, restoreLocalBackup } from '../../lib/localBackup';

export default function BackupPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleExport = () => {
    setError('');
    setMessage('');
    downloadLocalBackup();
    setMessage('Backup exportado com sucesso. Guarde o arquivo em local seguro.');
  };

  const handleImportClick = () => {
    setError('');
    setMessage('');
    inputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const content = await file.text();
      const parsed = parseLocalBackupJson(content);

      const confirmed = window.confirm('Restaurar backup irá substituir todo o progresso local atual. Deseja continuar?');
      if (!confirmed) {
        setBusy(false);
        event.target.value = '';
        return;
      }

      restoreLocalBackup(parsed);
      setMessage('Backup restaurado com sucesso. A aplicação será recarregada para aplicar os dados.');
      setTimeout(() => window.location.reload(), 700);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Não foi possível restaurar o backup.');
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm dark:border-blue-900/40 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            <ArchiveRestore className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Segurança de Dados</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Backup local do progresso</h2>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          Exporte seu progresso para um arquivo JSON e restaure quando precisar. Isso protege seus dados de clientes,
          ordens, funcionários, estoque, vendas e configurações de sessão local.
        </p>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              O módulo de acompanhamento público enviado ao cliente continua no Firebase e não é sobrescrito por este backup local.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          Exportar backup
        </button>

        <button
          type="button"
          onClick={handleImportClick}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-700 dark:bg-gray-900 dark:text-blue-300 dark:hover:bg-blue-900/20"
        >
          <Upload className="h-4 w-4" />
          Restaurar backup
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleImportFile}
        className="hidden"
      />

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
