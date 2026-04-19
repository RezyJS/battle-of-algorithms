import Link from 'next/link';

export function ForbiddenCard({
  title = 'Доступ запрещён',
  description = 'Для этого раздела не хватает прав.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="max-w-md mx-auto rounded-2xl border border-slate-200 bg-white/85 p-8 text-center shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
      <p className="mt-3 text-sm text-slate-600">{description}</p>

      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
      >
        На главную
      </Link>
    </div>
  );
}
