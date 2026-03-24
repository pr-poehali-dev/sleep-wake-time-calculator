import Icon from "@/components/ui/icon";

interface SleepCycle {
  type: "sleep" | "wake";
  start: number;
  end: number;
  label: string;
}

interface HistoryEntry {
  id: string;
  date: string;
  cycles: SleepCycle[];
  babyName: string;
  sleepDuration: number;
  wakeDuration: number;
  dayStart: number;
  dayEnd: number;
}

interface HistoryPanelProps {
  history: HistoryEntry[];
  onDelete: (id: string) => void;
  onLoad: (entry: HistoryEntry) => void;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPanel({ history, onDelete, onLoad }: HistoryPanelProps) {
  if (history.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">История</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Сохранённые расписания</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
            style={{ background: "hsl(260 40% 95%)" }}
          >
            🌙
          </div>
          <div>
            <p className="font-semibold text-foreground">Пока пусто</p>
            <p className="text-sm text-muted-foreground mt-1">
              Сохрани расписание в калькуляторе — оно появится здесь
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">История</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Сохранённые расписания</p>
        </div>
        <div
          className="text-sm font-semibold px-3 py-1.5 rounded-full"
          style={{ background: "hsl(260 40% 93%)", color: "hsl(260 40% 45%)" }}
        >
          {history.length} {history.length === 1 ? "запись" : history.length < 5 ? "записи" : "записей"}
        </div>
      </div>

      <div className="space-y-3">
        {history.map((entry) => {
          const totalMinutes = entry.dayEnd - entry.dayStart;
          const sleepCycles = entry.cycles.filter((c) => c.type === "sleep");
          const totalSleep = sleepCycles.reduce((a, c) => a + (c.end - c.start), 0);

          return (
            <div
              key={entry.id}
              className="bg-white rounded-3xl p-4 shadow-sm border border-border space-y-3 animate-slide-up"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {entry.babyName || "Малыш"}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "hsl(260 40% 93%)", color: "hsl(260 40% 45%)" }}
                    >
                      {sleepCycles.length}{" "}
                      {sleepCycles.length === 1 ? "сон" : sleepCycles.length < 5 ? "сна" : "снов"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(entry.date)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onLoad(entry)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: "hsl(260 40% 93%)" }}
                    title="Загрузить"
                  >
                    <Icon name="RotateCcw" size={14} color="hsl(260 40% 45%)" />
                  </button>
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: "hsl(0 50% 95%)" }}
                    title="Удалить"
                  >
                    <Icon name="Trash2" size={14} color="hsl(0 50% 55%)" />
                  </button>
                </div>
              </div>

              {/* Mini timeline */}
              <div className="relative h-6 bg-muted rounded-full overflow-hidden">
                {entry.cycles.map((cycle, i) => {
                  const width = ((cycle.end - cycle.start) / totalMinutes) * 100;
                  const left = ((cycle.start - entry.dayStart) / totalMinutes) * 100;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 h-full rounded-full"
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
                })}
              </div>

              {/* Stats row */}
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <span>⏰</span>
                  <span className="text-muted-foreground">
                    {minutesToTime(entry.dayStart)} – {minutesToTime(entry.dayEnd)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span>💤</span>
                  <span style={{ color: "hsl(260 40% 55%)" }} className="font-medium">
                    {Math.floor(totalSleep / 60)}ч {totalSleep % 60}м сна
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
