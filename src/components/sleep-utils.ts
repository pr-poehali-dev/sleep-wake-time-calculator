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

// Rebuild cycles preserving pinned anchors, only recalculating gaps between them
export function rebuildWithPinned(currentCycles: SleepCycle[], settings: Settings): SleepCycle[] {
  const { sleepDuration, wakeDuration, dayStart, dayEnd } = settings;

  // If no pinned cycles — full rebuild
  if (!currentCycles.some((c) => c.pinned)) {
    return buildCycles(settings);
  }

  const result: SleepCycle[] = [];
  let wakeIndex = 1;
  let sleepIndex = 1;

  // Collect pinned cycles that still fit within dayStart..dayEnd
  const anchors = currentCycles.filter((c) => c.pinned && c.start >= dayStart && c.end <= dayEnd);

  let cursor = dayStart;

  for (let ai = 0; ai < anchors.length; ai++) {
    const anchor = anchors[ai];

    // Fill gap before this anchor using default durations
    let nextType: "sleep" | "wake" = ai === 0
      ? "wake"
      : (anchors[ai - 1].type === "sleep" ? "wake" : "sleep");

    while (cursor + (nextType === "sleep" ? sleepDuration : wakeDuration) <= anchor.start) {
      const duration = nextType === "sleep" ? sleepDuration : wakeDuration;
      const end = cursor + duration;
      if (nextType === "sleep") {
        result.push({ type: "sleep", start: cursor, end, label: `Сон ${sleepIndex++}` });
      } else {
        result.push({ type: "wake", start: cursor, end, label: `Бодрствование ${wakeIndex++}` });
      }
      cursor = end;
      nextType = nextType === "sleep" ? "wake" : "sleep";
    }

    // If there's a gap before anchor that doesn't fit a full cycle, skip to anchor start
    cursor = anchor.start;

    // Push anchor with updated label index
    if (anchor.type === "sleep") {
      result.push({ ...anchor, label: `Сон ${sleepIndex++}` });
    } else {
      result.push({ ...anchor, label: `Бодрствование ${wakeIndex++}` });
    }
    cursor = anchor.end;
  }

  // Fill tail after last anchor
  let nextType: "sleep" | "wake" = result.length > 0
    ? (result[result.length - 1].type === "sleep" ? "wake" : "sleep")
    : "wake";

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