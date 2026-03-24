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

// Appends cycles from cursor to dayEnd, starting with nextType.
// If after a full-length wake there's remaining space — appends a short sleep to fill it.
function appendTail(
  result: SleepCycle[],
  cursor: number,
  nextType: "sleep" | "wake",
  sleepDuration: number,
  wakeDuration: number,
  dayEnd: number,
  sleepIndex: { v: number },
  wakeIndex: { v: number }
) {
  let cur = cursor;
  let type = nextType;

  while (cur < dayEnd) {
    const duration = type === "sleep" ? sleepDuration : wakeDuration;

    if (cur + duration > dayEnd) {
      if (type === "wake") {
        // Remainder is shorter than wakeDuration — fill it as a truncated wake
        result.push({ type: "wake", start: cur, end: dayEnd, label: `Бодрствование ${wakeIndex.v++}` });
      }
      // If type === "sleep" and it doesn't fit — stop; the wake before it was already added
      break;
    }

    const end = cur + duration;
    if (type === "sleep") {
      result.push({ type: "sleep", start: cur, end, label: `Сон ${sleepIndex.v++}` });
    } else {
      result.push({ type: "wake", start: cur, end, label: `Бодрствование ${wakeIndex.v++}` });
    }
    cur = end;
    type = type === "sleep" ? "wake" : "sleep";
  }

  // After loop: last added was a full-length wake (not pinned, not truncated),
  // and there's still time left → add a short sleep of any length
  const last = result[result.length - 1];
  if (
    last &&
    last.type === "wake" &&
    !last.pinned &&
    last.end < dayEnd &&
    (last.end - last.start) === wakeDuration
  ) {
    result.push({ type: "sleep", start: last.end, end: dayEnd, label: `Сон ${sleepIndex.v++}` });
  }
}

export function buildCycles(settings: Settings): SleepCycle[] {
  const { sleepDuration, wakeDuration, dayStart, dayEnd } = settings;
  const result: SleepCycle[] = [];
  const sleepIndex = { v: 1 };
  const wakeIndex = { v: 1 };
  let cursor = dayStart;

  const firstWakeEnd = cursor + wakeDuration;
  if (firstWakeEnd >= dayEnd) {
    result.push({ type: "wake", start: cursor, end: dayEnd, label: "Бодрствование" });
    return result;
  }
  result.push({ type: "wake", start: cursor, end: firstWakeEnd, label: `Бодрствование ${wakeIndex.v++}` });
  cursor = firstWakeEnd;

  appendTail(result, cursor, "sleep", sleepDuration, wakeDuration, dayEnd, sleepIndex, wakeIndex);

  return result;
}

// Rebuild cycles preserving pinned anchors, only recalculating gaps between them
export function rebuildWithPinned(currentCycles: SleepCycle[], settings: Settings): SleepCycle[] {
  const { sleepDuration, wakeDuration, dayStart, dayEnd } = settings;

  if (!currentCycles.some((c) => c.pinned)) {
    return buildCycles(settings);
  }

  const result: SleepCycle[] = [];
  const sleepIndex = { v: 1 };
  const wakeIndex = { v: 1 };

  const anchors = currentCycles.filter((c) => c.pinned && c.start >= dayStart && c.end <= dayEnd);
  let cursor = dayStart;

  for (let ai = 0; ai < anchors.length; ai++) {
    const anchor = anchors[ai];

    let nextType: "sleep" | "wake" = ai === 0
      ? "wake"
      : (anchors[ai - 1].type === "sleep" ? "wake" : "sleep");

    while (cursor + (nextType === "sleep" ? sleepDuration : wakeDuration) <= anchor.start) {
      const duration = nextType === "sleep" ? sleepDuration : wakeDuration;
      const end = cursor + duration;
      if (nextType === "sleep") {
        result.push({ type: "sleep", start: cursor, end, label: `Сон ${sleepIndex.v++}` });
      } else {
        result.push({ type: "wake", start: cursor, end, label: `Бодрствование ${wakeIndex.v++}` });
      }
      cursor = end;
      nextType = nextType === "sleep" ? "wake" : "sleep";
    }

    cursor = anchor.start;

    if (anchor.type === "sleep") {
      result.push({ ...anchor, label: `Сон ${sleepIndex.v++}` });
    } else {
      result.push({ ...anchor, label: `Бодрствование ${wakeIndex.v++}` });
    }
    cursor = anchor.end;
  }

  const nextType: "sleep" | "wake" = result.length > 0
    ? (result[result.length - 1].type === "sleep" ? "wake" : "sleep")
    : "wake";

  appendTail(result, cursor, nextType, sleepDuration, wakeDuration, dayEnd, sleepIndex, wakeIndex);

  return result;
}

export function rebuildFromIndex(cycles: SleepCycle[], fromIndex: number, settings: Settings): SleepCycle[] {
  const result = cycles.slice(0, fromIndex + 1);
  const cursor = result[result.length - 1].end;
  const { sleepDuration, wakeDuration, dayEnd } = settings;

  const lastType = result[result.length - 1].type;
  const nextType: "sleep" | "wake" = lastType === "sleep" ? "wake" : "sleep";

  const sleepIndex = { v: result.filter((c) => c.type === "sleep").length + 1 };
  const wakeIndex = { v: result.filter((c) => c.type === "wake").length + 1 };

  appendTail(result, cursor, nextType, sleepDuration, wakeDuration, dayEnd, sleepIndex, wakeIndex);

  return result;
}