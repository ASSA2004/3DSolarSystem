const STORAGE_KEY = "solar-system-learning-progress";
const EMPTY_PROGRESS = { difficulty: "explorer", completedMissions: [], quizScores: [], discoveries: [] };

function read() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return value ? { ...EMPTY_PROGRESS, ...value } : { ...EMPTY_PROGRESS };
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

function write(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Private browsing and storage-disabled contexts still get an in-memory session.
  }
  return progress;
}

export function createProgressStore() {
  let progress = read();
  return {
    get() { return { ...progress, completedMissions: [...progress.completedMissions], discoveries: [...progress.discoveries] }; },
    setDifficulty(difficulty) { progress = write({ ...progress, difficulty }); return this.get(); },
    completeMission(id) { progress = write({ ...progress, completedMissions: [...new Set([...progress.completedMissions, id])] }); return this.get(); },
    recordQuiz(score, total) { progress = write({ ...progress, quizScores: [...progress.quizScores, { score, total, date: new Date().toISOString() }] }); return this.get(); },
    discover(id) { progress = write({ ...progress, discoveries: [...new Set([...progress.discoveries, id])] }); return this.get(); }
  };
}
