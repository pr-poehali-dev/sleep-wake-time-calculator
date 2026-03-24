import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

interface SleepCycle {
  type: "sleep" | "wake";
  start: number;
  end: number;
  label: string;
  pinned?: boolean;
}

interface Settings {
  sleepDuration: number;
  wakeDuration: number;
  dayStart: number;
  dayEnd: number;
}

interface SleepCalculatorProps {
  settings: Settings;
  onSave: (cycles: SleepCycle[], settings: Settings) => void;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function buildCycles(settings: Settings): SleepCycle[] {
  const { sleepDuration, wakeDuration, dayStart, dayEnd } = settings;
  const cycles: SleepCycle[] = [];
  let cursor = dayStart;
  let wakeIndex = 1;
  let sleepIndex = 1;

  const firstWakeEnd = cursor + wakeDuration;
  if (firstWakeEnd >= dayEnd) {
    cycles.push({ type: "wake", start: cursor, end: dayEnd, label: "Бодрствование" });
    return cycles;
  }
  cycles.push({ type: "wake", start: cursor, end: firstWakeEnd, label: `Бодрствование ${wakeIndex++}` });
  cursor = firstWakeEnd;

  while (cursor + sleepDuration <= dayEnd) {
    const sleepEnd = cursor + sleepDuration;
    cycles.push({ type: "sleep", start: cursor, end: sleepEnd, label: `Сон ${sleepIndex++}` });
    cursor = sleepEnd;

    if (cursor + wakeDuration + sleepDuration <= dayEnd) {
      const wakeEnd = cursor + wakeDuration;
      cycles.push({ type: "wake", start: cursor, end: wakeEnd, label: `Бодрствование ${wakeIndex++}` });
      cursor = wakeEnd;
    } else {
      if (cursor < dayEnd) {
        cycles.push({ type: "wake", start: cursor, end: dayEnd, label: `Бодрствование ${wakeIndex++}` });
      }
      break;
    }
  }

  return cycles;
}

// Rebuild cycles from index onwards, keeping pinned ones as anchors
function rebuildFromIndex(cycles: SleepCycle[], fromIndex: number, settings: Settings): SleepCycle[] {
  const result = cycles.slice(0, fromIndex + 1);
  let cursor = result[result.length - 1].end;
  const { sleepDuration, wakeDuration, dayEnd } = settings;

  // Determine next type
  const lastType = result[result.length - 1].type;
  let nextType: "sleep" | "wake" = lastType === "sleep" ? "wake" : "sleep";

  let wakeIndex = result.filter((c) => c.type === "wake").length + 1;
  let sleepIndex = result.filter((c) => c.type === "sleep").length + 1;

  while (cursor < dayEnd) {
    const duration = nextType === "sleep" ? sleepDuration : wakeDuration;
    if (cursor + duration > dayEnd) {
      // Fill remainder as final wake if needed
      if (nextType === "wake" && cursor < dayEnd) {
        result.push({ type: "wake", start: cursor, end: dayEnd, label: `Бодрствование ${wakeIndex++}` });
      }
      break;
    }
    const end = cursor + duration;
    if (nextType === "sleep") {
      result.push({ type: "sleep", start: cursor, end, label: `Сон ${sleepIndex++}` });
    } else {
      result.push({ type: "wake", start: cursor, end, label: `Бодрствование ${wakeIndex++}` });
    }
    cursor = end;
    nextType = nextType === "sleep" ? "wake" : "sleep";
  }

  return result;
}

export default function SleepCalculator({ settings, onSave }: SleepCalculatorProps) {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [cycles, setCycles] = useState<SleepCycle[]>([]);
  const [saved, setSaved] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editError, setEditError] = useState("");

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    setCycles(buildCycles(localSettings));
    setEditingIndex(null);
  }, [localSettings]);

  const totalMinutes = localSettings.dayEnd - localSettings.dayStart;
  const sleepCount = cycles.filter((c) => c.type === "sleep").length;
  const totalSleep = cycles.filter((c) => c.type === "sleep").reduce((a, c) => a + (c.end - c.start), 0);
  const totalWake = cycles.filter((c) => c.type === "wake").reduce((a, c) => a + (c.end - c.start), 0);

  const handleSave = () => {
    onSave(cycles, localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const openEdit = (index: number) => {
    setEditingIndex(index);
    setEditStart(minutesToTime(cycles[index].start));
    setEditEnd(minutesToTime(cycles[index].end));
    setEditError("");
  };

  const closeEdit = () => {
    setEditingIndex(null);
    setEditError("");
  };

  const applyEdit = () => {
    if (editingIndex === null) return;

    const newStart = timeToMinutes(editStart);
    const newEnd = timeToMinutes(editEnd);

    // Validation
    if (isNaN(newStart) || isNaN(newEnd)) {
      setEditError("Введите корректное время");
      return;
    }
    if (newEnd <= newStart) {
      setEditError("Конец должен быть позже начала");
      return;
    }
    if (editingIndex > 0 && newStart < cycles[editingIndex - 1].end) {
      setEditError(`Начало не может быть раньше ${minutesToTime(cycles[editingIndex - 1].end)}`);
      return;
    }
    if (newEnd > localSettings.dayEnd) {
      setEditError(`Конец не может быть позже ${minutesToTime(localSettings.dayEnd)}`);
      return;
    }

    // Apply edit to cycle
    const updated = cycles.map((c, i) =>
      i === editingIndex ? { ...c, start: newStart, end: newEnd, pinned: true } : c
    );

    // If not last — fix next cycle start to match end
    if (editingIndex < updated.length - 1) {
      updated[editingIndex + 1] = { ...updated[editingIndex + 1], start: newEnd };
    }

    // Rebuild everything after this index
    const rebuilt = rebuildFromIndex(updated, editingIndex, localSettings);
    setCycles(rebuilt);
    setEditingIndex(null);
    setEditError("");
  };

  const resetCycles = () => {
    setCycles(buildCycles(localSettings));
    setEditingIndex(null);
  };

  const hasManualEdits = cycles.some((c) => c.pinned);

  const renderTimeline = () => {
    if (totalMinutes <= 0) return null;
    return cycles.map((cycle, i) => {
      const width = ((cycle.end - cycle.start) / totalMinutes) * 100;
      const left = ((cycle.start - localSettings.dayStart) / totalMinutes) * 100;
      return (
        <div
          key={i}
          className="absolute top-0 h-full rounded-full transition-all duration-300"
          style={{
            left: `${left}%`,
            width: `${Math.max(width, 0.5)}%`,
            background:
              cycle.type === "sleep"
                ? "linear-gradient(135deg, hsl(260 40% 72%), hsl(220 40% 78%))"
                : "linear-gradient(135deg, hsl(45 90% 72%), hsl(30 80% 78%))",
          }}
        />
      );
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Калькулятор</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Оптимальное расписание снов</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2 shadow-sm border border-border">
          <span className="text-2xl">🌙</span>
          <span className="font-bold text-lg" style={{ color: "hsl(260 40% 55%)" }}>
            {sleepCount}
          </span>
          <span className="text-xs text-muted-foreground">
            {sleepCount === 1 ? "сон" : sleepCount < 5 ? "сна" : "снов"}
          </span>
        </div>
      </div>

      {/* Timeline visual */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-border animate-slide-up">
        <div className="flex justify-between text-xs text-muted-foreground mb-3 font-medium">
          <span>{minutesToTime(localSettings.dayStart)}</span>
          <span className="text-center">Шкала дня</span>
          <span>{minutesToTime(localSettings.dayEnd)}</span>
        </div>
        <div className="relative h-10 bg-muted rounded-full overflow-hidden">
          {renderTimeline()}
        </div>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: "hsl(260 40% 72%)" }} />
            <span className="text-xs text-muted-foreground">Сон</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: "hsl(45 90% 72%)" }} />
            <span className="text-xs text-muted-foreground">Бодрствование</span>
          </div>
        </div>
      </div>

      {/* Day range sliders */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-border space-y-5">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Границы дня
        </h3>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-base">🌅</span>
              <span className="text-sm font-medium">Начало дня</span>
            </div>
            <span className="font-bold text-sm" style={{ color: "hsl(260 40% 55%)" }}>
              {minutesToTime(localSettings.dayStart)}
            </span>
          </div>
          <input
            type="range"
            min={300}
            max={720}
            step={15}
            value={localSettings.dayStart}
            onChange={(e) =>
              setLocalSettings((s) => ({
                ...s,
                dayStart: Math.min(Number(e.target.value), s.dayEnd - 60),
              }))
            }
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-base">🌙</span>
              <span className="text-sm font-medium">Конец дня</span>
            </div>
            <span className="font-bold text-sm" style={{ color: "hsl(260 40% 55%)" }}>
              {minutesToTime(localSettings.dayEnd)}
            </span>
          </div>
          <input
            type="range"
            min={720}
            max={1380}
            step={15}
            value={localSettings.dayEnd}
            onChange={(e) =>
              setLocalSettings((s) => ({
                ...s,
                dayEnd: Math.max(Number(e.target.value), s.dayStart + 60),
              }))
            }
            className="w-full"
          />
        </div>
      </div>

      {/* Sleep/Wake duration sliders */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-border space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "hsl(260 40% 93%)" }}>
              <span className="text-sm">💤</span>
            </div>
            <span className="text-sm font-semibold">Сон</span>
          </div>
          <div className="text-center">
            <span className="text-3xl font-bold" style={{ color: "hsl(260 40% 55%)" }}>
              {localSettings.sleepDuration}
            </span>
            <span className="text-xs text-muted-foreground ml-1">мин</span>
          </div>
          <input
            type="range"
            min={20}
            max={180}
            step={5}
            value={localSettings.sleepDuration}
            onChange={(e) =>
              setLocalSettings((s) => ({ ...s, sleepDuration: Number(e.target.value) }))
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>20 мин</span>
            <span>3 ч</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 shadow-sm border border-border space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "hsl(45 90% 90%)" }}>
              <span className="text-sm">☀️</span>
            </div>
            <span className="text-sm font-semibold">Бодрствование</span>
          </div>
          <div className="text-center">
            <span className="text-3xl font-bold" style={{ color: "hsl(35 80% 50%)" }}>
              {localSettings.wakeDuration}
            </span>
            <span className="text-xs text-muted-foreground ml-1">мин</span>
          </div>
          <input
            type="range"
            min={30}
            max={360}
            step={5}
            value={localSettings.wakeDuration}
            onChange={(e) =>
              setLocalSettings((s) => ({ ...s, wakeDuration: Number(e.target.value) }))
            }
            className="w-full wake-slider"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>30 мин</span>
            <span>6 ч</span>
          </div>
        </div>
      </div>

      {/* Cycles list with edit */}
      {cycles.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-border animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Расписание на день
            </h3>
            {hasManualEdits && (
              <button
                onClick={resetCycles}
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
                  className={`flex items-center justify-between py-2.5 px-3 rounded-2xl transition-all cursor-pointer group ${
                    editingIndex === i ? "ring-2" : "hover:brightness-95"
                  }`}
                  style={{
                    background:
                      cycle.type === "sleep" ? "hsl(260 40% 96%)" : "hsl(45 90% 95%)",
                    ringColor:
                      cycle.type === "sleep" ? "hsl(260 40% 65%)" : "hsl(45 90% 60%)",
                    outline: editingIndex === i
                      ? `2px solid ${cycle.type === "sleep" ? "hsl(260 40% 65%)" : "hsl(45 80% 55%)"}`
                      : "none",
                  }}
                  onClick={() => editingIndex === i ? closeEdit() : openEdit(i)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{cycle.type === "sleep" ? "💤" : "☀️"}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{cycle.label}</span>
                        {cycle.pinned && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: "hsl(260 40% 88%)", color: "hsl(260 40% 40%)" }}>
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
                          onChange={(e) => { setEditStart(e.target.value); setEditError(""); }}
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
                          onChange={(e) => { setEditEnd(e.target.value); setEditError(""); }}
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
                        onClick={applyEdit}
                        className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, hsl(260 40% 65%), hsl(220 40% 68%))" }}
                      >
                        Применить
                      </button>
                      <button
                        onClick={closeEdit}
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
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        className="w-full py-4 rounded-3xl font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-98 flex items-center justify-center gap-2 shadow-md"
        style={{
          background: saved
            ? "linear-gradient(135deg, hsl(140 50% 55%), hsl(160 50% 60%))"
            : "linear-gradient(135deg, hsl(260 40% 65%), hsl(220 40% 68%))",
        }}
      >
        {saved ? (
          <>
            <span>✓</span> Сохранено в историю
          </>
        ) : (
          <>
            <Icon name="BookmarkPlus" size={18} />
            Сохранить расписание
          </>
        )}
      </button>
    </div>
  );
}
