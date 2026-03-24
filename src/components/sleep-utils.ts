export interface SleepCycle {
  type: "sleep" | "wake";
  start: number;
  end: number;
  label: string;
  pinned?: boolean;
}

export interface Settings {
  sleepDuration: number;
  wakeDuration: number;
  dayStart: number;
  dayEnd: number;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function buildCycles(settings: Settings): SleepCycle[] {
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

export function rebuildFromIndex(cycles: SleepCycle[], fromIndex: number, settings: Settings): SleepCycle[] {
  const result = cycles.slice(0, fromIndex + 1);
  let cursor = result[result.length - 1].end;
  const { sleepDuration, wakeDuration, dayEnd } = settings;

  const lastType = result[result.length - 1].type;
  let nextType: "sleep" | "wake" = lastType === "sleep" ? "wake" : "sleep";

  let wakeIndex = result.filter((c) => c.type === "wake").length + 1;
  let sleepIndex = result.filter((c) => c.type === "sleep").length + 1;

  while (cursor < dayEnd) {
    const duration = nextType === "sleep" ? sleepDuration : wakeDuration;
    if (cursor + duration > dayEnd) {
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
