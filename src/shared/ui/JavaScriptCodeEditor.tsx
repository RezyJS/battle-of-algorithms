'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { javascript } from '@codemirror/lang-javascript';
import { linter, lintGutter } from '@codemirror/lint';
import type { Diagnostic } from '@codemirror/lint';
import { JSHINT } from 'jshint';

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full animate-pulse rounded-lg bg-slate-100" />
  ),
});

interface JavaScriptCodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  editable?: boolean;
  height?: string;
}

interface JSHintError {
  line?: number;
  character?: number;
  reason?: string;
}

export function JavaScriptCodeEditor({
  value,
  onChange,
  editable = true,
  height = '350px',
}: JavaScriptCodeEditorProps) {
  const extensions = useMemo(
    () => [
      javascript(),
      lintGutter(),
      linter((view) => {
        JSHINT(view.state.doc.toString(), {
          esversion: 2021,
          browser: false,
          devel: false,
          undef: false,
        });

        const errors = (JSHINT.errors ?? []) as Array<JSHintError | null>;

        return errors.flatMap((error) => {
          if (
            !error ||
            error.line == null ||
            error.character == null ||
            !error.reason
          ) {
            return [];
          }

          const line = view.state.doc.line(error.line);
          const from = Math.min(
            line.from + Math.max(error.character - 1, 0),
            line.to,
          );
          const to = from === line.to ? from : from + 1;

          return [
            {
              from,
              to,
              severity: 'error',
              message: error.reason,
            } satisfies Diagnostic,
          ];
        });
      }),
    ],
    [],
  );

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
      <CodeMirror
        value={value}
        height={height}
        theme="light"
        extensions={extensions}
        editable={editable}
        onChange={(nextValue) => onChange?.(nextValue)}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
        }}
      />
    </div>
  );
}
