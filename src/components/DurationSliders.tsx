import { Settings } from "@/components/sleep-utils";

interface DurationSlidersProps {
  localSettings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export default function DurationSliders({ localSettings, onSettingsChange }: DurationSlidersProps) {
  return (
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
            onSettingsChange({ ...localSettings, sleepDuration: Number(e.target.value) })
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
            onSettingsChange({ ...localSettings, wakeDuration: Number(e.target.value) })
          }
          className="w-full wake-slider"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>30 мин</span>
          <span>6 ч</span>
        </div>
      </div>
    </div>
  );
}
