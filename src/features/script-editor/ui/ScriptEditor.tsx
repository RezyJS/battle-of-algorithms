'use client';

import { JavaScriptCodeEditor } from '@/src/shared/ui/JavaScriptCodeEditor';
import { algorithmTemplates, AlgorithmTemplateName } from '../model/templates';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

interface ScriptTemplateSelectProps {
  disabled: boolean;
  onSelect: (script: string) => void;
}

interface ScriptEditorProps {
  playerLabel: string;
  playerEmoji: string;
  script: string;
  onScriptChange: (script: string) => void;
  disabled: boolean;
  submissionVersion?: string;
  showHeader?: boolean;
}

export function ScriptTemplateSelect({
  disabled,
  onSelect,
}: ScriptTemplateSelectProps) {
  const handleLoadTemplate = (key: string) => {
    if (key in algorithmTemplates) {
      onSelect(algorithmTemplates[key as AlgorithmTemplateName].code);
    }
  };

  return (
    <Select
      disabled={disabled}
      onValueChange={handleLoadTemplate}
    >
      <SelectTrigger
        size='sm'
        className='w-[190px] bg-white'
      >
        <SelectValue placeholder='Загрузить шаблон...' />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {Object.entries(algorithmTemplates).map(([key, tmpl]) => (
            <SelectItem
              key={key}
              value={key}
            >
              {tmpl.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function ScriptEditor({
  playerLabel,
  playerEmoji,
  script,
  onScriptChange,
  disabled,
  submissionVersion,
  showHeader = true,
}: ScriptEditorProps) {
  return (
    <div className='space-y-3'>
      {showHeader && (
        <div className='flex justify-between items-center'>
          <h3 className='text-sm font-semibold text-slate-800 flex items-center gap-2'>
            <span className='text-lg'>{playerEmoji}</span>
            <p>{playerLabel}</p>
            {submissionVersion && (
              <span className='text-xs text-slate-500'>{`(v${submissionVersion})`}</span>
            )}
          </h3>
          <ScriptTemplateSelect
            disabled={disabled}
            onSelect={onScriptChange}
          />
        </div>
      )}
      <JavaScriptCodeEditor
        value={script}
        height='350px'
        editable={!disabled}
        onChange={onScriptChange}
      />
    </div>
  );
}
