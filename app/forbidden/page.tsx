import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900/70 backdrop-blur p-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300">
          403
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Доступ запрещён</h1>
        <p className="mt-3 text-sm text-gray-400">
          Для этого раздела не хватает прав.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-white/10 px-5 text-sm font-medium text-gray-200 transition-colors hover:bg-white/5"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
