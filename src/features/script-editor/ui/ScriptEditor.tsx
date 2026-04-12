'use client';

import dynamic from 'next/dynamic';
import {
  algorithmTemplates,
  AlgorithmTemplateName,
} from '../model/templates';

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 bg-gray-900 rounded-lg animate-pulse" />
  ),
});

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
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <span className="text-lg">{playerEmoji}</span>
          {playerLabel}
        </h3>
        <select
          className="text-xs px-2 py-1 rounded-md bg-gray-800 border border-gray-700 text-gray-300 focus:outline-none focus:border-indigo-500"
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
      <div className="rounded-lg overflow-hidden border border-gray-800">
        <CodeMirror
          value={script}
          height="350px"
          theme="dark"
          editable={!disabled}
          onChange={(value) => onScriptChange(value)}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: true,
          }}
        />
      </div>
      <p className="text-xs text-gray-500 text-right">
        Сохранение и отправка выполняются кнопками сверху
      </p>
    </div>
  );
}
