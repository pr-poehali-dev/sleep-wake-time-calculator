import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

interface SleepCycle {
  type: "sleep" | "wake";
  start: number;
  end: number;
  label: string;
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

function buildCycles(settings: Settings): SleepCycle[] {
  const { sleepDuration, wakeDuration, dayStart, dayEnd } = settings;
  const totalMinutes = dayEnd - dayStart;
  const cycles: SleepCycle[] = [];

  let cursor = dayStart;
  let wakeIndex = 1;
  let sleepIndex = 1;

  // First wake period (before first nap)
  const firstWakeEnd = cursor + wakeDuration;
  if (firstWakeEnd >= dayEnd) {
    cycles.push({ type: "wake", start: cursor, end: dayEnd, label: `Бодрствование` });
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
      // Last wake
      if (cursor < dayEnd) {
        cycles.push({ type: "wake", start: cursor, end: dayEnd, label: `Бодрствование ${wakeIndex++}` });
      }
      break;
    }
  }

  return cycles;
}

export default function SleepCalculator({ settings, onSave }: SleepCalculatorProps) {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [cycles, setCycles] = useState<SleepCycle[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    setCycles(buildCycles(localSettings));
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
            width: `${width}%`,
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

      {/* Cycles list */}
      {cycles.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-border animate-slide-up">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
            Расписание на день
          </h3>
          <div className="space-y-2">
            {cycles.map((cycle, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 px-3 rounded-2xl transition-all"
                style={{
                  background:
                    cycle.type === "sleep"
                      ? "hsl(260 40% 96%)"
                      : "hsl(45 90% 95%)",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{cycle.type === "sleep" ? "💤" : "☀️"}</span>
                  <span className="text-sm font-medium">{cycle.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {minutesToTime(cycle.start)} – {minutesToTime(cycle.end)}
                  </span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: cycle.type === "sleep" ? "hsl(260 40% 88%)" : "hsl(45 90% 85%)",
                      color: cycle.type === "sleep" ? "hsl(260 40% 40%)" : "hsl(35 80% 35%)",
                    }}
                  >
                    {cycle.end - cycle.start} мин
                  </span>
                </div>
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
