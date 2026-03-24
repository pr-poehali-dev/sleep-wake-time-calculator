import { useState, useEffect } from "react";
import SleepCalculator from "@/components/SleepCalculator";
import SettingsPanel from "@/components/SettingsPanel";
import HistoryPanel from "@/components/HistoryPanel";
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
  babyName: string;
  babyBirthDate: string;
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

const DEFAULT_SETTINGS: Settings = {
  sleepDuration: 90,
  wakeDuration: 120,
  dayStart: 420,
  dayEnd: 1320,
  babyName: "",
  babyBirthDate: "",
};

type Tab = "calc" | "settings" | "history";

const TABS: { id: Tab; label: string; icon: string; emoji: string }[] = [
  { id: "calc", label: "Калькулятор", icon: "Calculator", emoji: "🌙" },
  { id: "settings", label: "Настройки", icon: "Settings2", emoji: "⚙️" },
  { id: "history", label: "История", icon: "History", emoji: "📋" },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("calc");
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem("sleep-settings");
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const stored = localStorage.getItem("sleep-history");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("sleep-settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem("sleep-history", JSON.stringify(history));
  }, [history]);

  const handleSave = (cycles: SleepCycle[], calcSettings: Settings) => {
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      cycles,
      babyName: settings.babyName,
      sleepDuration: calcSettings.sleepDuration,
      wakeDuration: calcSettings.wakeDuration,
      dayStart: calcSettings.dayStart,
      dayEnd: calcSettings.dayEnd,
    };
    setHistory((prev) => [entry, ...prev].slice(0, 50));
  };

  const handleDeleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((e) => e.id !== id));
  };

  const handleLoadHistory = (entry: HistoryEntry) => {
    setSettings((s) => ({
      ...s,
      sleepDuration: entry.sleepDuration,
      wakeDuration: entry.wakeDuration,
      dayStart: entry.dayStart,
      dayEnd: entry.dayEnd,
    }));
    setActiveTab("calc");
  };

  return (
    <div className="min-h-screen page-bg font-golos">
      <div className="max-w-md mx-auto px-4 pb-28 pt-6">
        {/* Header */}
        <header className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {settings.babyName ? `Привет, ${settings.babyName}! 👋` : "Сонный трекер 🌙"}
              </h1>
              {settings.babyBirthDate && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {(() => {
                    const birth = new Date(settings.babyBirthDate);
                    const now = new Date();
                    const totalMonths =
                      (now.getFullYear() - birth.getFullYear()) * 12 +
                      (now.getMonth() - birth.getMonth());
                    if (totalMonths < 12) {
                      // Дата начала текущего неполного месяца
                      const monthStart = new Date(birth);
                      monthStart.setMonth(monthStart.getMonth() + totalMonths);
                      const days = Math.floor(
                        (now.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)
                      );
                      if (totalMonths === 0) {
                        return days === 0 ? "Сегодня родился!" : `${days} д.`;
                      }
                      return days > 0 ? `${totalMonths} мес. ${days} д.` : `${totalMonths} мес.`;
                    }
                    const y = Math.floor(totalMonths / 12);
                    const m = totalMonths % 12;
                    return m > 0 ? `${y} г. ${m} мес.` : `${y} г.`;
                  })()}
                </p>
              )}
            </div>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
              style={{ background: "white" }}
            >
              🍼
            </div>
          </div>
        </header>

        {/* Content */}
        <main>
          {activeTab === "calc" && (
            <SleepCalculator settings={settings} onSave={handleSave} />
          )}
          {activeTab === "settings" && (
            <SettingsPanel settings={settings} onChange={setSettings} />
          )}
          {activeTab === "history" && (
            <HistoryPanel
              history={history}
              onDelete={handleDeleteHistory}
              onLoad={handleLoadHistory}
            />
          )}
        </main>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-md mx-auto px-4 pb-4">
          <div
            className="flex rounded-3xl p-1.5 shadow-lg"
            style={{
              background: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(20px)",
              border: "1px solid hsl(35 25% 88%)",
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all duration-200"
                style={{
                  background:
                    activeTab === tab.id
                      ? "linear-gradient(135deg, hsl(260 40% 65%), hsl(220 40% 68%))"
                      : "transparent",
                }}
              >
                {activeTab === tab.id ? (
                  <span className="text-lg leading-none">{tab.emoji}</span>
                ) : (
                  <Icon
                    name={tab.icon as "Calculator" | "Settings2" | "History"}
                    size={20}
                    color="hsl(230 15% 55%)"
                  />
                )}
                <span
                  className="text-xs font-medium"
                  style={{
                    color: activeTab === tab.id ? "white" : "hsl(230 15% 55%)",
                  }}
                >
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}