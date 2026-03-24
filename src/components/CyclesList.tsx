import Icon from "@/components/ui/icon";
import { SleepCycle, Settings, minutesToTime, timeToMinutes, rebuildFromIndex } from "@/components/sleep-utils";

interface CyclesListProps {
  cycles: SleepCycle[];
  localSettings: Settings;
  totalSleep: number;
  totalWake: number;
  hasManualEdits: boolean;
  editingIndex: number | null;
  editStart: string;
  editEnd: string;
  editError: string;
  onOpenEdit: (index: number) => void;
  onCloseEdit: () => void;
  onApplyEdit: () => void;
  onEditStartChange: (val: string) => void;
  onEditEndChange: (val: string) => void;
  onReset: () => void;
}

export default function CyclesList({
  cycles,
  localSettings,
  totalSleep,
  totalWake,
  hasManualEdits,
  editingIndex,
  editStart,
  editEnd,
  editError,
  onOpenEdit,
  onCloseEdit,
  onApplyEdit,
  onEditStartChange,
  onEditEndChange,
  onReset,
}: CyclesListProps) {
  if (cycles.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-border animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Расписание на день
        </h3>
        {hasManualEdits && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-80"
            style={{ background: "hsl(35 30% 93%)", color: "hsl(35 30% 40%)" }}
          >
            <Icon name="RotateCcw" size={12} />
            Сбросить
          </button>
        )}
      </div>

      <div className="space-y-2">
        {cycles.map((cycle, i) => (
          <div key={i}>
            {/* Cycle row */}
            <div
              className="flex items-center justify-between py-2.5 px-3 rounded-2xl transition-all cursor-pointer"
              style={{
                background: cycle.type === "sleep" ? "hsl(260 40% 96%)" : "hsl(45 90% 95%)",
                outline:
                  editingIndex === i
                    ? `2px solid ${cycle.type === "sleep" ? "hsl(260 40% 65%)" : "hsl(45 80% 55%)"}`
                    : "none",
              }}
              onClick={() => (editingIndex === i ? onCloseEdit() : onOpenEdit(i))}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{cycle.type === "sleep" ? "💤" : "☀️"}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">{cycle.label}</span>
                    {cycle.pinned && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: "hsl(260 40% 88%)", color: "hsl(260 40% 40%)" }}
                      >
                        изменён
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {minutesToTime(cycle.start)} – {minutesToTime(cycle.end)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: cycle.type === "sleep" ? "hsl(260 40% 88%)" : "hsl(45 90% 85%)",
                    color: cycle.type === "sleep" ? "hsl(260 40% 40%)" : "hsl(35 80% 35%)",
                  }}
                >
                  {cycle.end - cycle.start} мин
                </span>
                <Icon
                  name={editingIndex === i ? "ChevronUp" : "Pencil"}
                  size={14}
                  color="hsl(230 15% 65%)"
                />
              </div>
            </div>

            {/* Inline edit form */}
            {editingIndex === i && (
              <div
                className="mx-1 mt-1 mb-2 p-4 rounded-2xl space-y-3 animate-slide-up"
                style={{ background: "hsl(35 30% 97%)", border: "1px solid hsl(35 25% 88%)" }}
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Реальное время
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Начало</label>
                    <input
                      type="time"
                      value={editStart}
                      onChange={(e) => onEditStartChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                      style={{
                        borderColor: "hsl(35 25% 88%)",
                        background: "white",
                        color: "hsl(230 20% 20%)",
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Конец</label>
                    <input
                      type="time"
                      value={editEnd}
                      onChange={(e) => onEditEndChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                      style={{
                        borderColor: "hsl(35 25% 88%)",
                        background: "white",
                        color: "hsl(230 20% 20%)",
                      }}
                    />
                  </div>
                </div>

                {editError && (
                  <p className="text-xs font-medium" style={{ color: "hsl(0 60% 55%)" }}>
                    ⚠️ {editError}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  Все последующие циклы пересчитаются автоматически
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={onApplyEdit}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, hsl(260 40% 65%), hsl(220 40% 68%))" }}
                  >
                    Применить
                  </button>
                  <button
                    onClick={onCloseEdit}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                    style={{ background: "hsl(35 25% 90%)", color: "hsl(230 15% 40%)" }}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Всего сна</p>
          <p className="font-bold text-lg" style={{ color: "hsl(260 40% 55%)" }}>
            {Math.floor(totalSleep / 60)}ч {totalSleep % 60}м
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Бодрствования</p>
          <p className="font-bold text-lg" style={{ color: "hsl(35 80% 50%)" }}>
            {Math.floor(totalWake / 60)}ч {totalWake % 60}м
          </p>
        </div>
      </div>
    </div>
  );
}
