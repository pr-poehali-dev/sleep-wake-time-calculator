import { SleepCycle, Settings, minutesToTime } from "@/components/sleep-utils";

interface DayTimelineProps {
  cycles: SleepCycle[];
  localSettings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export default function DayTimeline({ cycles, localSettings, onSettingsChange }: DayTimelineProps) {
  const totalMinutes = localSettings.dayEnd - localSettings.dayStart;

  return (
    <>
      {/* Timeline visual */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-border animate-slide-up">
        <div className="flex justify-between text-xs text-muted-foreground mb-3 font-medium">
          <span>{minutesToTime(localSettings.dayStart)}</span>
          <span className="text-center">Шкала дня</span>
          <span>{minutesToTime(localSettings.dayEnd)}</span>
        </div>
        <div className="relative h-10 bg-muted rounded-full overflow-hidden">
          {totalMinutes > 0 && cycles.map((cycle, i) => {
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
          })}
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
              onSettingsChange({
                ...localSettings,
                dayStart: Math.min(Number(e.target.value), localSettings.dayEnd - 60),
              })
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
              onSettingsChange({
                ...localSettings,
                dayEnd: Math.max(Number(e.target.value), localSettings.dayStart + 60),
              })
            }
            className="w-full"
          />
        </div>
      </div>
    </>
  );
}
