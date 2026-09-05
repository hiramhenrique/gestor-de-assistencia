import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, Wrench } from 'lucide-react';
import { type OrderStatus } from './ordersData';
import { type PublicOrderStatusData, statusSequence, subscribeToPublicStatus } from './publicStatus';

interface PublicOrderStatusPageProps {
  statusId: string;
}

export default function PublicOrderStatusPage({ statusId }: PublicOrderStatusPageProps) {
  const [entry, setEntry] = useState<PublicOrderStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!statusId) {
      setEntry(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToPublicStatus(statusId, (nextEntry) => {
      setEntry(nextEntry);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [statusId]);

  const activeIndex = useMemo(() => {
    if (!entry) return 0;
    return statusSequence.indexOf(entry.status as OrderStatus);
  }, [entry]);

  const progressPercent = entry ? ((activeIndex + 1) / statusSequence.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400">
            <ClipboardList className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Carregando acompanhamento</h1>
          <p className="mt-3 text-sm text-slate-300">
            Aguarde enquanto buscamos o status mais recente do seu aparelho.
          </p>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400">
            <ClipboardList className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Acompanhamento em andamento</h1>
          <p className="mt-3 text-sm text-slate-300">
            O atendimento foi registrado e ainda está sendo processado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="border-b border-slate-700 px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Acompanhamento</p>
              <h1 className="mt-1 text-2xl font-bold">{entry.client}</h1>
            </div>
            <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              {entry.orderId}
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Aparelho</p>
              <p className="text-lg font-semibold">{entry.device}</p>
            </div>
          </div>

          <div className={`rounded-2xl border p-4 ${entry.status === 'Concluída' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100'}`}>
            {entry.status === 'Concluída' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-lg font-bold">
                  <CheckCircle2 className="h-5 w-5" />
                  Serviço concluído
                </div>
                <p className="text-sm text-emerald-100/90">
                  Seu aparelho está pronto para retirada ou podemos combinar a entrega.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium">Status atual</p>
                <p className="mt-1 text-xl font-bold">{entry.status}</p>
              </>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              <span>Progresso</span>
              <span>{activeIndex + 1}/{statusSequence.length}</span>
            </div>

            <div className="relative">
              <div className="absolute left-0 right-0 top-4 h-1 rounded-full bg-slate-700" />
              <div
                className={`absolute left-0 top-4 h-1 rounded-full transition-all duration-300 ${entry.status === 'Concluída' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-500'}`}
                style={{ width: `${progressPercent}%` }}
              />

              <div className="relative flex items-start justify-between">
                {statusSequence.map((status, index) => {
                  const isComplete = index <= activeIndex;
                  const isCurrent = index === activeIndex;

                  return (
                    <div key={status} className="flex w-full flex-col items-center gap-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-bold transition ${
                        isComplete
                          ? entry.status === 'Concluída'
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-cyan-500 bg-cyan-500 text-white'
                          : 'border-slate-600 bg-slate-800 text-slate-400'
                      } ${isCurrent ? 'ring-4 ring-cyan-500/20' : ''}`}>
                        {index + 1}
                      </div>
                      <span className={`max-w-[90px] text-center text-[10px] font-medium ${isCurrent ? 'text-cyan-300' : 'text-slate-400'}`}>
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
