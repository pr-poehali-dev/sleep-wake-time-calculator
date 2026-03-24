import { minutesToTime } from "@/components/sleep-utils";

interface Settings {
  sleepDuration: number;
  wakeDuration: number;
  dayStart: number;
  dayEnd: number;
  babyName: string;
  babyBirthDate: string;
}

interface SettingsPanelProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

const agePresets = [
  { label: "0–1 мес", sleepDuration: 80, wakeDuration: 50, dayStart: 420, dayEnd: 1320 },
  { label: "2–3 мес", sleepDuration: 60, wakeDuration: 75, dayStart: 420, dayEnd: 1320 },
  { label: "4–6 мес", sleepDuration: 70, wakeDuration: 120, dayStart: 420, dayEnd: 1320 },
  { label: "7–9 мес", sleepDuration: 60, wakeDuration: 180, dayStart: 420, dayEnd: 1320 },
  { label: "10–12 мес", sleepDuration: 60, wakeDuration: 195, dayStart: 420, dayEnd: 1320 },
  { label: "13–15 мес", sleepDuration: 60, wakeDuration: 270, dayStart: 420, dayEnd: 1320 },
  { label: "16 мес – 3 г", sleepDuration: 90, wakeDuration: 330, dayStart: 420, dayEnd: 1320 },
];

// Диапазоны возраста (в месяцах) для каждого пресета [minMonths, maxMonths]
const ageRanges: [number, number][] = [
  [0, 1],
  [2, 3],
  [4, 6],
  [7, 9],
  [10, 12],
  [13, 15],
  [16, 999],
];

function getAgeMonths(birthDate: string): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  return (
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())
  );
}

function getPresetIndexByAge(months: number): number {
  return ageRanges.findIndex(([min, max]) => months >= min && months <= max);
}

export default function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const ageMonths = getAgeMonths(settings.babyBirthDate);
  const suggestedPresetIndex = ageMonths !== null ? getPresetIndexByAge(ageMonths) : -1;

  const applyPreset = (preset: (typeof agePresets)[0]) => {
    onChange({
      ...settings,
      sleepDuration: preset.sleepDuration,
      wakeDuration: preset.wakeDuration,
      dayStart: preset.dayStart,
      dayEnd: preset.dayEnd,
    });
  };

  const handleBirthDateChange = (value: string) => {
    const months = getAgeMonths(value);
    const idx = months !== null ? getPresetIndexByAge(months) : -1;
    if (idx >= 0) {
      const preset = agePresets[idx];
      onChange({
        ...settings,
        babyBirthDate: value,
        sleepDuration: preset.sleepDuration,
        wakeDuration: preset.wakeDuration,
        dayStart: preset.dayStart,
        dayEnd: preset.dayEnd,
      });
    } else {
      onChange({ ...settings, babyBirthDate: value });
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Настройки</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Данные о малыше и пресеты</p>
      </div>

      {/* Baby info */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-border space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          О малыше
        </h3>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Имя ребёнка</label>
          <input
            type="text"
            placeholder="Например, Миша"
            value={settings.babyName}
            onChange={(e) => onChange({ ...settings, babyName: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl border border-border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Дата рождения</label>
          <input
            type="date"
            value={settings.babyBirthDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => handleBirthDateChange(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          {ageMonths !== null && (
            <p className="text-xs text-muted-foreground pt-1">
              {ageMonths < 1
                ? "Меньше месяца"
                : ageMonths < 12
                ? `${ageMonths} мес.`
                : `${Math.floor(ageMonths / 12)} г. ${ageMonths % 12 > 0 ? `${ageMonths % 12} мес.` : ""}`}
              {suggestedPresetIndex >= 0 && (
                <span className="ml-1" style={{ color: "hsl(260 40% 55%)" }}>
                  · пресет «{agePresets[suggestedPresetIndex].label}» применён
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Age presets */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-border space-y-4">
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Пресеты по возрасту
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Нажми на возраст — нормы сна подставятся автоматически
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {agePresets.map((preset, idx) => {
            const isActive =
              settings.sleepDuration === preset.sleepDuration &&
              settings.wakeDuration === preset.wakeDuration;
            const isSuggested = idx === suggestedPresetIndex;
            return (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className="py-3 px-4 rounded-2xl text-sm font-medium border transition-all duration-200 hover:shadow-md active:scale-95 text-left"
              style={{
                background: isActive
                    ? "linear-gradient(135deg, hsl(260 40% 65%), hsl(220 40% 68%))"
                    : isSuggested
                    ? "hsl(260 40% 93%)"
                    : "hsl(260 40% 97%)",
                color: isActive ? "white" : "hsl(260 30% 40%)",
                borderColor: isActive
                    ? "transparent"
                    : isSuggested
                    ? "hsl(260 40% 70%)"
                    : "hsl(260 30% 88%)",
              }}
            >
              <div className="font-semibold">{preset.label}</div>
              <div className="text-xs opacity-70 mt-0.5">
                сон {preset.sleepDuration}м · бодр. {preset.wakeDuration}м
              </div>
            </button>
            );
          })}
        </div>
      </div>

      {/* Day boundaries */}
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
              {minutesToTime(settings.dayStart)}
            </span>
          </div>
          <input
            type="range"
            min={300}
            max={720}
            step={15}
            value={settings.dayStart}
            onChange={(e) =>
              onChange({
                ...settings,
                dayStart: Math.min(Number(e.target.value), settings.dayEnd - 60),
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
              {minutesToTime(settings.dayEnd)}
            </span>
          </div>
          <input
            type="range"
            min={720}
            max={1380}
            step={15}
            value={settings.dayEnd}
            onChange={(e) =>
              onChange({
                ...settings,
                dayEnd: Math.max(Number(e.target.value), settings.dayStart + 60),
              })
            }
            className="w-full"
          />
        </div>
      </div>

      {/* Info card */}
      <div
        className="rounded-3xl p-5 space-y-3"
        style={{ background: "hsl(340 50% 96%)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">💡</span>
          <h3 className="font-semibold text-sm" style={{ color: "hsl(340 50% 40%)" }}>
            Как это работает
          </h3>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "hsl(340 30% 45%)" }}>
          Калькулятор подбирает максимальное количество снов, которые помещаются в день. После каждого сна обязательно идёт период бодрствования. Первый цикл всегда начинается с бодрствования.
        </p>
      </div>
    </div>
  );
}