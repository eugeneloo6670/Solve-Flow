const app = document.querySelector(".app");
const levelEl = document.querySelector("#level");
const scoreEl = document.querySelector("#score");
const problemEl = document.querySelector("#problem");
const answerEl = document.querySelector("#answer");
const messageEl = document.querySelector("#message");
const streakEl = document.querySelector("#streak");
const startButton = document.querySelector("#startButton");
const decreaseLevelButton = document.querySelector("#decreaseLevel");
const increaseLevelButton = document.querySelector("#increaseLevel");
const keypad = document.querySelector("#keypad");
let audioContext;
let raindropDataUrl;

const state = {
  active: false,
  answer: "",
  currentProblem: null,
  locked: false,
  level: 1,
  score: 0,
  questionCount: 0,
  streak: 0
};

function getLevel() {
  return state.level;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(items) {
  return items[randomInt(0, items.length - 1)];
}

function playRaindrop() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    playRaindropFallback();
    return;
  }

  try {
    audioContext ||= new AudioContextClass();

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    const startFrequency = randomInt(760, 980);
    const endFrequency = randomInt(430, 560);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(startFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + 0.09);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.14);
  } catch {
    playRaindropFallback();
  }
}

function playRaindropFallback() {
  if (typeof window.Audio !== "function") {
    return;
  }

  raindropDataUrl ||= createRaindropDataUrl();
  const audio = new Audio(raindropDataUrl);
  audio.volume = 0.28;
  audio.play().catch(() => {});
}

function createRaindropDataUrl() {
  const sampleRate = 8000;
  const duration = 0.12;
  const samples = Math.floor(sampleRate * duration);
  const dataSize = samples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < samples; i += 1) {
    const progress = i / samples;
    const envelope = Math.exp(-progress * 9);
    const frequency = 900 - progress * 420;
    const sample = Math.sin(2 * Math.PI * frequency * (i / sampleRate)) * envelope * 0.5;
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return `data:audio/wav;base64,${btoa(binary)}`;
}

function writeString(view, offset, text) {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

function generateProblem() {
  const level = getLevel();
  const maxAdd = 10 + level * 10;
  const maxMultiply = Math.min(5 + level * 2, 20);
  const operations = level < 2 ? ["+", "-", "x"] : ["+", "-", "x", "/"];
  const operation = pick(operations);

  if (operation === "+") {
    const a = randomInt(1, maxAdd);
    const b = randomInt(1, maxAdd);
    return { text: `${a} + ${b}`, answer: a + b, operation };
  }

  if (operation === "-") {
    const a = randomInt(1, maxAdd);
    const b = randomInt(1, maxAdd);
    const high = Math.max(a, b);
    const low = Math.min(a, b);
    return { text: `${high} - ${low}`, answer: high - low, operation };
  }

  if (operation === "x") {
    const a = randomInt(2, maxMultiply);
    const b = randomInt(2, maxMultiply);
    return { text: `${a} x ${b}`, answer: a * b, operation };
  }

  const divisor = randomInt(2, maxMultiply);
  const quotient = randomInt(2, maxMultiply + level);
  return { text: `${divisor * quotient} / ${divisor}`, answer: quotient, operation };
}

function formatLevel(level) {
  return String(level).padStart(2, "0");
}

function render() {
  levelEl.textContent = formatLevel(getLevel());
  decreaseLevelButton.disabled = state.level <= 1;
  scoreEl.textContent = state.score;
  streakEl.textContent = state.streak;
  answerEl.textContent = state.answer || "0";
  streakEl.classList.toggle("hot", state.streak >= 10);
  problemEl.textContent = state.currentProblem ? state.currentProblem.text : "Press Start";
}

function getCorrectMessage() {
  return pick([
    "Nice and steady.",
    "That felt smooth.",
    "Good rhythm.",
    "You got it.",
    "Clean answer."
  ]);
}

function getAdviceMessage(problem) {
  if (problem.operation === "+") {
    return "Try adding in small chunks.";
  }

  if (problem.operation === "-") {
    return "Try counting the gap.";
  }

  if (problem.operation === "x") {
    return "Try breaking it into groups.";
  }

  return "Think of the matching multiplication.";
}

function setVisualState(name) {
  app.dataset.state = name;
  window.clearTimeout(setVisualState.timer);
  setVisualState.timer = window.setTimeout(() => {
    app.dataset.state = state.active ? "playing" : "ready";
  }, 430);
}

function nextProblem() {
  state.currentProblem = generateProblem();
  state.answer = "";
  state.locked = false;
  render();
}

function startGame() {
  state.active = true;
  state.answer = "";
  state.currentProblem = null;
  state.locked = false;
  state.score = 0;
  state.questionCount = 0;
  state.streak = 0;
  startButton.textContent = "Restart";
  messageEl.textContent = "Answer when ready.";
  app.dataset.state = "playing";
  nextProblem();
}

function submitAnswer() {
  if (!state.active || state.locked || !state.currentProblem || state.answer === "") {
    return;
  }

  state.locked = true;
  const submitted = Number(state.answer);
  const correct = submitted === state.currentProblem.answer;
  const previousLevel = getLevel();
  let advice = "";
  state.questionCount += 1;

  if (correct) {
    state.streak += 1;
    state.score += 10 + Math.floor(state.streak / 5) * 5;
    messageEl.textContent = state.streak > 0 && state.streak % 10 === 0
      ? `Streak ${state.streak}. Keep it easy.`
      : getCorrectMessage();
    setVisualState("correct");
  } else {
    advice = getAdviceMessage(state.currentProblem);
    messageEl.textContent = `${state.currentProblem.text} = ${state.currentProblem.answer}`;
    state.streak = 0;
    setVisualState("wrong");
  }

  if (state.questionCount % 20 === 0) {
    state.level += 1;
  }

  const leveledUp = getLevel() > previousLevel;
  render();

  window.setTimeout(() => {
    if (leveledUp) {
      messageEl.textContent = `Level ${formatLevel(getLevel())}`;
      setVisualState("level-up");
    }
    nextProblem();
    if (!leveledUp && !correct) {
      messageEl.textContent = advice;
    }
  }, correct ? 170 : 520);
}

function changeLevel(direction) {
  const nextLevel = Math.max(1, state.level + direction);
  if (nextLevel === state.level) {
    return;
  }

  state.level = nextLevel;
  messageEl.textContent = `Level ${formatLevel(state.level)}`;

  if (state.active) {
    nextProblem();
  } else {
    render();
  }
}

function judgeTypedAnswer() {
  if (!state.active || state.locked || !state.currentProblem || state.answer === "") {
    return;
  }

  const correctAnswer = String(state.currentProblem.answer);
  const isExact = state.answer === correctAnswer;
  const canStillMatch = correctAnswer.startsWith(state.answer);

  if (isExact || !canStillMatch || state.answer.length >= correctAnswer.length) {
    submitAnswer();
  }
}

function appendInput(value) {
  if (!state.active) {
    startGame();
  }

  if (state.locked) {
    return;
  }

  if (/^\d$/.test(value) && state.answer.length < 6) {
    state.answer += value;
  }

  render();
  judgeTypedAnswer();
}

function handleInput(key) {
  const normalized = key.toLowerCase();

  if (normalized === "enter") {
    submitAnswer();
    return;
  }

  if (normalized === "backspace") {
    state.answer = state.answer.slice(0, -1);
    render();
    return;
  }

  if (normalized === "escape") {
    startGame();
    return;
  }

  appendInput(normalized);
}

startButton.addEventListener("click", startGame);
decreaseLevelButton.addEventListener("click", () => changeLevel(-1));
increaseLevelButton.addEventListener("click", () => changeLevel(1));

document.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button")) {
    playRaindrop();
  }
});

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-key]");
  if (!button) {
    return;
  }
  handleInput(button.dataset.key);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === "Backspace" || event.key === "Escape" || /^\d$/.test(event.key)) {
    event.preventDefault();
    playRaindrop();
    handleInput(event.key);
  }
});

render();
