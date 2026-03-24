import { SleepCycle, Settings, minutesToTime } from "@/components/sleep-utils";

interface DayTimelineProps {
  cycles: SleepCycle[];
  localSettings: Settings;
}

export default function DayTimeline({ cycles, localSettings }: DayTimelineProps) {
  const totalMinutes = localSettings.dayEnd - localSettings.dayStart;

  return (
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
  );
}
