'use client';

import { ScrollText } from 'lucide-react';

interface EventLogProps {
  messages: string[];
}

export function EventLog({ messages }: EventLogProps) {
  return (
    <div className="bg-gray-900/50 rounded-xl border border-white/5 p-4 flex-1 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <ScrollText className="w-4 h-4 text-gray-400" />
        <h3 className="font-semibold text-sm text-gray-300">Журнал событий</h3>
      </div>
      {messages.length === 0 ? (
        <p className="text-xs text-gray-500 italic">
          Нет событий. Нажмите «Старт».
        </p>
      ) : (
        <div className="space-y-1">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className="text-sm py-1 px-2 rounded bg-gray-800/50 text-gray-300"
            >
              {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
