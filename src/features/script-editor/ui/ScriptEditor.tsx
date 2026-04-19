'use client';

import { JavaScriptCodeEditor } from '@/src/shared/ui/JavaScriptCodeEditor';
import {
  algorithmTemplates,
  AlgorithmTemplateName,
} from '../model/templates';

interface ScriptEditorProps {
  playerLabel: string;
  playerEmoji: string;
  script: string;
  onScriptChange: (script: string) => void;
  disabled: boolean;
}

export function ScriptEditor({
  playerLabel,
  playerEmoji,
  script,
  onScriptChange,
  disabled,
}: ScriptEditorProps) {
  const handleLoadTemplate = (key: string) => {
    if (key in algorithmTemplates) {
      onScriptChange(algorithmTemplates[key as AlgorithmTemplateName].code);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <span className="text-lg">{playerEmoji}</span>
          {playerLabel}
        </h3>
        <select
          className="text-xs px-2 py-1 rounded-md bg-white border border-slate-300 text-slate-700 focus:outline-none focus:border-indigo-500"
          onChange={(e) => handleLoadTemplate(e.target.value)}
          disabled={disabled}
          defaultValue=""
        >
          <option value="" disabled>
            Загрузить шаблон...
          </option>
          {Object.entries(algorithmTemplates).map(([key, tmpl]) => (
            <option key={key} value={key}>
              {tmpl.name}
            </option>
          ))}
        </select>
      </div>
      <JavaScriptCodeEditor
        value={script}
        height="350px"
        editable={!disabled}
        onChange={onScriptChange}
      />
      <p className="text-xs text-slate-500 text-right">
        Сохранение и отправка выполняются кнопками сверху
      </p>
    </div>
  );
}
