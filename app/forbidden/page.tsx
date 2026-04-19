import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/85 backdrop-blur p-8 text-center shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-600">
          403
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Доступ запрещён</h1>
        <p className="mt-3 text-sm text-slate-600">
          Для этого раздела не хватает прав.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
