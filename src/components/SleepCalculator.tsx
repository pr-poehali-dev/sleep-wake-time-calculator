import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { SleepCycle, Settings, minutesToTime, timeToMinutes, buildCycles, rebuildFromIndex, rebuildWithPinned } from "@/components/sleep-utils";
import DayTimeline from "@/components/DayTimeline";
import DurationSliders from "@/components/DurationSliders";
import CyclesList from "@/components/CyclesList";

interface SleepCalculatorProps {
  settings: Settings;
  onSave: (cycles: SleepCycle[], settings: Settings) => void;
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

  // When day boundaries change — full rebuild (pinned times may fall outside)
  useEffect(() => {
    setCycles(buildCycles(localSettings));
    setEditingIndex(null);
  }, [localSettings.dayStart, localSettings.dayEnd]);

  // When durations change — preserve pinned cycles, recalculate gaps
  useEffect(() => {
    setCycles((prev) => rebuildWithPinned(prev, localSettings));
  }, [localSettings.sleepDuration, localSettings.wakeDuration]);

  const sleepCount = cycles.filter((c) => c.type === "sleep").length;
  const totalSleep = cycles.filter((c) => c.type === "sleep").reduce((a, c) => a + (c.end - c.start), 0);
  const totalWake = cycles.filter((c) => c.type === "wake").reduce((a, c) => a + (c.end - c.start), 0);
  const hasManualEdits = cycles.some((c) => c.pinned);

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

    const updated = cycles.map((c, i) =>
      i === editingIndex ? { ...c, start: newStart, end: newEnd, pinned: true } : c
    );

    if (editingIndex < updated.length - 1) {
      updated[editingIndex + 1] = { ...updated[editingIndex + 1], start: newEnd };
    }

    const rebuilt = rebuildFromIndex(updated, editingIndex, localSettings);
    setCycles(rebuilt);
    setEditingIndex(null);
    setEditError("");
  };

  const resetCycles = () => {
    setCycles(buildCycles(localSettings));
    setEditingIndex(null);
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

      <DayTimeline
        cycles={cycles}
        localSettings={localSettings}
        onSettingsChange={setLocalSettings}
      />

      <DurationSliders
        localSettings={localSettings}
        onSettingsChange={setLocalSettings}
      />

      <CyclesList
        cycles={cycles}
        localSettings={localSettings}
        totalSleep={totalSleep}
        totalWake={totalWake}
        hasManualEdits={hasManualEdits}
        editingIndex={editingIndex}
        editStart={editStart}
        editEnd={editEnd}
        editError={editError}
        onOpenEdit={openEdit}
        onCloseEdit={closeEdit}
        onApplyEdit={applyEdit}
        onEditStartChange={(val) => { setEditStart(val); setEditError(""); }}
        onEditEndChange={(val) => { setEditEnd(val); setEditError(""); }}
        onReset={resetCycles}
      />

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