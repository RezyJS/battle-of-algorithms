'use client';

import { ScrollText } from 'lucide-react';

interface EventLogProps {
  messages: string[];
}

export function EventLog({ messages }: EventLogProps) {
  return (
    <div className="bg-white/80 rounded-xl border border-slate-200 p-4 flex-1 overflow-y-auto shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <ScrollText className="w-4 h-4 text-slate-500" />
        <h3 className="font-semibold text-sm text-slate-800">Журнал событий</h3>
      </div>
      {messages.length === 0 ? (
        <p className="text-xs text-slate-500 italic">
          Нет событий. Нажмите «Старт».
        </p>
      ) : (
        <div className="space-y-1">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className="text-sm py-1 px-2 rounded bg-slate-50 text-slate-700 border border-slate-200"
            >
              {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
