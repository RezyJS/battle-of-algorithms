export default function ArenaLegend() {
  return (
    <div className="bg-white/80 rounded-xl border border-slate-200 p-4 shadow-sm">
      <h3 className="font-semibold text-sm text-slate-800 mb-3">Обозначения</h3>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span>🔴</span> Игрок 1
        </div>
        <div className="flex items-center gap-1.5">
          <span>🟢</span> Игрок 2
        </div>
        <div className="flex items-center gap-1.5">
          <span>🔑</span> Ключ
        </div>
        <div className="flex items-center gap-1.5">
          <span className="opacity-30">🔑</span> Подобран
        </div>
        <div className="flex items-center gap-1.5">
          <span>🚪</span> Выход
        </div>
        <div className="flex items-center gap-1.5">
          <span>💥</span> Столкновение
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-slate-300 border border-slate-400" />{' '}
          Стена
        </div>
      </div>
    </div>
  );
}
