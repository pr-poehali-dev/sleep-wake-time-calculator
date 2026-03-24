import { useState, useEffect } from "react";
import { SleepCycle, Settings, minutesToTime } from "@/components/sleep-utils";

interface DayTimelineProps {
  cycles: SleepCycle[];
  localSettings: Settings;
}

function getNowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export default function DayTimeline({ cycles, localSettings }: DayTimelineProps) {
  const totalMinutes = localSettings.dayEnd - localSettings.dayStart;
  const [nowMinutes, setNowMinutes] = useState(getNowMinutes);

  useEffect(() => {
    const interval = setInterval(() => setNowMinutes(getNowMinutes()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const nowLeft = ((nowMinutes - localSettings.dayStart) / totalMinutes) * 100;
  const nowVisible = nowMinutes >= localSettings.dayStart && nowMinutes <= localSettings.dayEnd;

  // Find current cycle for status label
  const currentCycle = cycles.find((c) => nowMinutes >= c.start && nowMinutes < c.end);

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-border animate-slide-up">
      <div className="flex justify-between text-xs text-muted-foreground mb-3 font-medium">
        <span>{minutesToTime(localSettings.dayStart)}</span>
        <span className="text-center">Шкала дня</span>
        <span>{minutesToTime(localSettings.dayEnd)}</span>
      </div>

      {/* Timeline bar */}
      <div className="relative h-10 bg-muted rounded-full overflow-visible">
        {/* Cycle segments */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
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

        {/* Now marker */}
        {nowVisible && (
          <div
            className="absolute top-1/2 -translate-y-1/2 z-10 flex flex-col items-center"
            style={{ left: `${nowLeft}%`, transform: "translate(-50%, -50%)" }}
          >
            {/* Vertical line */}
            <div
              className="w-0.5 rounded-full"
              style={{
                height: "48px",
                background: "hsl(0 0% 20%)",
                boxShadow: "0 0 0 1.5px white",
              }}
            />
            {/* Dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white"
              style={{ background: "hsl(0 0% 15%)" }}
            />
          </div>
        )}
      </div>

      {/* Now time label below the bar */}
      {nowVisible && (
        <div className="relative mt-1" style={{ height: "20px" }}>
          <div
            className="absolute -translate-x-1/2"
            style={{ left: `${nowLeft}%` }}
          >
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
              style={{ background: "hsl(0 0% 15%)", color: "white" }}
            >
              {minutesToTime(nowMinutes)}
            </span>
          </div>
        </div>
      )}

      {/* Legend + current status */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: "hsl(260 40% 72%)" }} />
            <span className="text-xs text-muted-foreground">Сон</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: "hsl(45 90% 72%)" }} />
            <span className="text-xs text-muted-foreground">Бодрствование</span>
          </div>
        </div>

        {currentCycle && (
          <div
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
            style={{
              background: currentCycle.type === "sleep" ? "hsl(260 40% 93%)" : "hsl(45 90% 90%)",
              color: currentCycle.type === "sleep" ? "hsl(260 40% 40%)" : "hsl(35 80% 35%)",
            }}
          >
            <span>{currentCycle.type === "sleep" ? "💤" : "☀️"}</span>
            <span>сейчас</span>
          </div>
        )}
      </div>
    </div>
  );
}
