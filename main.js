const API_ROOT = "https://ce.judge0.com";
const POLL_INTERVAL_MS = 900;
const MAX_POLL_MS = 25000;
const FALLBACK_LANGUAGE = {
  id: 50,
  name: "C (GCC 9.2.0)",
};
const THEME_STORAGE_KEY = "c-forge-theme";

const EXAMPLES = {
  starter: {
    code: `#include <stdio.h>

int main(void) {
    printf("Hello from C Capsule\\n");
    return 0;
}`,
    stdin: "",
  },
  input: {
    code: `#include <stdio.h>

int main(void) {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("Sum: %d\\n", a + b);
    return 0;
}`,
    stdin: "12 30",
  },
  arrays: {
    code: `#include <stdio.h>

int main(void) {
    int values[] = {4, 8, 15, 16, 23, 42};
    int sum = 0;

    for (int i = 0; i < 6; i++) {
        sum += values[i];
    }

    printf("Total: %d\\n", sum);
    return 0;
}`,
    stdin: "",
  },
  loops: {
    code: `#include <stdio.h>

int main(void) {
    for (int row = 1; row <= 5; row++) {
        for (int col = 1; col <= 5; col++) {
            printf("%2d ", row * col);
        }
        printf("\\n");
    }

    return 0;
}`,
    stdin: "",
  },
};

const elements = {
  root: document.documentElement,
  codeEditor: document.getElementById("codeEditor"),
  stdinInput: document.getElementById("stdinInput"),
  outputConsole: document.getElementById("outputConsole"),
  outputStatus: document.getElementById("outputStatus"),
  exitStatus: document.getElementById("exitStatus"),
  durationStatus: document.getElementById("durationStatus"),
  lineNumbers: document.getElementById("lineNumbers"),
  codeStats: document.getElementById("codeStats"),
  themeToggle: document.getElementById("themeToggle"),
  copyButton: document.getElementById("copyButton"),
  runButton: document.getElementById("runButton"),
  resetButton: document.getElementById("resetButton"),
  runtimeBadge: document.getElementById("runtimeBadge"),
  connectionBadge: document.getElementById("connectionBadge"),
  outputPanel: document.querySelector(".panel--output"),
  exampleButtons: document.querySelectorAll("[data-example]"),
  tipsToggle: document.getElementById("tipsToggle"),
  instructionsToggle: document.getElementById("instructionsToggle"),
  tipsPanel: document.getElementById("tipsPanel"),
  instructionsPanel: document.getElementById("instructionsPanel"),
};

let runtime = { ...FALLBACK_LANGUAGE };
let runtimeLoaded = false;
let isRunning = false;
let copyResetTimer = null;

function compareVersions(a, b) {
  const aParts = a.split(".").map(Number);
  const bParts = b.split(".").map(Number);
  const max = Math.max(aParts.length, bParts.length);

  for (let index = 0; index < max; index += 1) {
    const aPart = aParts[index] || 0;
    const bPart = bParts[index] || 0;

    if (aPart !== bPart) {
      return aPart - bPart;
    }
  }

  return 0;
}

function extractVersion(label) {
  const match = label.match(/(\d+(?:\.\d+)+)/);
  return match ? match[1] : "0";
}

function sleep(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

function getStoredTheme() {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

function saveTheme(theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    // Ignore storage failures and continue with the in-memory theme.
  }
}

function getPreferredTheme() {
  const storedTheme = getStoredTheme();
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  elements.root.dataset.theme = nextTheme;

  if (elements.themeToggle) {
    const darkModeEnabled = nextTheme === "dark";
    elements.themeToggle.textContent = darkModeEnabled ? "Light mode" : "Dark mode";
    elements.themeToggle.setAttribute("aria-pressed", String(darkModeEnabled));
  }

  saveTheme(nextTheme);
}

function toggleTheme() {
  const currentTheme = elements.root.dataset.theme === "dark" ? "dark" : "light";
  applyTheme(currentTheme === "dark" ? "light" : "dark");
}

function syncLineNumbers() {
  const lineCount = Math.max(elements.codeEditor.value.split("\n").length, 1);
  elements.lineNumbers.innerHTML = Array.from(
    { length: lineCount },
    (_, index) => `<span>${index + 1}</span>`
  ).join("");
}

function updateCodeStats() {
  const code = elements.codeEditor.value;
  const lines = Math.max(code.split("\n").length, 1);
  elements.codeStats.textContent = `${lines} lines · ${code.length} chars`;
}

function setExample(name) {
  const selected = EXAMPLES[name];
  if (!selected) {
    return;
  }

  elements.codeEditor.value = selected.code;
  elements.stdinInput.value = selected.stdin;
  syncLineNumbers();
  updateCodeStats();

  elements.exampleButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.example === name);
  });
}

function setOutputState({ tone, status, body, summary, timing }) {
  elements.outputPanel.dataset.tone = tone;
  elements.outputStatus.textContent = status;
  elements.outputConsole.textContent = body;
  elements.exitStatus.textContent = summary || "Status not run yet";
  elements.durationStatus.textContent = timing || "Waiting for execution";
}

function composeConsole(result) {
  const sections = [];

  if (result.compile_output) {
    sections.push(result.compile_output);
  }

  if (result.stdout) {
    sections.push(result.stdout);
  }

  if (result.stderr) {
    sections.push(result.stdout ? `stderr:\n${result.stderr}` : result.stderr);
  }

  if (result.message) {
    sections.push(result.message);
  }

  return sections.filter(Boolean).join("\n\n") || "[Program finished with no output]";
}

function formatMetrics(result, durationMs) {
  const parts = [];

  if (result.time) {
    parts.push(`${result.time}s runtime`);
  }

  if (typeof result.memory === "number") {
    parts.push(`${result.memory} KB`);
  }

  parts.push(`${Math.round(durationMs)} ms round trip`);
  return parts.join(" · ");
}

function normaliseExecution(result, durationMs) {
  const status = result.status?.description || "Unknown status";
  const accepted = result.status?.id === 3;
  const hasCompilerNotes = Boolean(result.compile_output);

  return {
    tone: accepted ? (hasCompilerNotes ? "warning" : "success") : "error",
    status: accepted ? (hasCompilerNotes ? "Ran with warnings" : "Execution complete") : status,
    body: composeConsole(result),
    summary: `Status ${status}`,
    timing: formatMetrics(result, durationMs),
  };
}

function setCopyButtonLabel(label) {
  if (!elements.copyButton) {
    return;
  }

  elements.copyButton.textContent = label;

  if (copyResetTimer) {
    window.clearTimeout(copyResetTimer);
  }

  copyResetTimer = window.setTimeout(() => {
    elements.copyButton.textContent = "Copy code";
    copyResetTimer = null;
  }, 1600);
}

function updatePanelToggle(button, panel, isOpen) {
  if (!button || !panel) {
    return;
  }

  button.setAttribute("aria-expanded", String(isOpen));
  button.classList.toggle("is-active", isOpen);

  if (panel.__hideTimer) {
    window.clearTimeout(panel.__hideTimer);
    panel.__hideTimer = null;
  }

  if (isOpen) {
    panel.hidden = false;
    panel.classList.remove("is-closing");

    window.requestAnimationFrame(() => {
      panel.classList.add("is-open");
    });

    return;
  }

  panel.classList.remove("is-open");
  panel.classList.add("is-closing");
  panel.__hideTimer = window.setTimeout(() => {
    panel.hidden = true;
    panel.classList.remove("is-closing");
    panel.__hideTimer = null;
  }, 220);
}

function toggleInfoPanel(panelName) {
  const showTips = panelName === "tips" ? elements.tipsPanel.hidden : false;
  const showInstructions = panelName === "instructions" ? elements.instructionsPanel.hidden : false;

  updatePanelToggle(elements.tipsToggle, elements.tipsPanel, showTips);
  updatePanelToggle(elements.instructionsToggle, elements.instructionsPanel, showInstructions);
}

async function copyCode() {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(elements.codeEditor.value);
    } else {
      elements.codeEditor.focus();
      elements.codeEditor.select();
      document.execCommand("copy");
      elements.codeEditor.setSelectionRange(
        elements.codeEditor.value.length,
        elements.codeEditor.value.length
      );
    }

    setCopyButtonLabel("Copied");
  } catch (error) {
    setCopyButtonLabel("Copy failed");
  }
}

async function readApiError(response) {
  let detail = `Request failed with ${response.status}`;

  try {
    const payload = await response.json();
    if (payload.error) {
      detail = payload.error;
    } else if (payload.message) {
      detail = payload.message;
    }
  } catch (error) {
    const text = await response.text();
    if (text) {
      detail = text;
    }
  }

  if (response.status === 401 || response.status === 403) {
    return new Error(
      "This Judge0 host now requires authentication. Point the app at your own Judge0 instance or add API credentials."
    );
  }

  return new Error(detail);
}

async function detectRuntime() {
  elements.connectionBadge.textContent = "Checking runtime";

  try {
    const response = await fetch(`${API_ROOT}/languages/`);

    if (!response.ok) {
      throw await readApiError(response);
    }

    const languages = await response.json();
    const match = languages
      .filter((language) => /^C \(/.test(language.name))
      .sort((left, right) =>
        compareVersions(extractVersion(right.name), extractVersion(left.name))
      )[0];

    runtime = match || { ...FALLBACK_LANGUAGE };
    runtimeLoaded = true;
    elements.connectionBadge.textContent = match ? "Runtime ready" : "Runtime fallback";
    elements.runtimeBadge.textContent = runtime.name;
  } catch (error) {
    runtime = { ...FALLBACK_LANGUAGE };
    runtimeLoaded = true;
    elements.connectionBadge.textContent = "Runtime fallback";
    elements.runtimeBadge.textContent = `${runtime.name} fallback`;
  }
}

async function createSubmission() {
  const response = await fetch(`${API_ROOT}/submissions/?base64_encoded=false&wait=false`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      language_id: runtime.id,
      source_code: elements.codeEditor.value,
      stdin: elements.stdinInput.value,
      cpu_time_limit: 2,
      wall_time_limit: 5,
    }),
  });

  if (!response.ok) {
    throw await readApiError(response);
  }

  const payload = await response.json();

  if (!payload.token) {
    throw new Error("Judge0 did not return a submission token.");
  }

  return payload.token;
}

async function pollSubmission(token) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < MAX_POLL_MS) {
    const response = await fetch(
      `${API_ROOT}/submissions/${token}?base64_encoded=false&fields=stdout,stderr,compile_output,message,status,time,memory`
    );

    if (!response.ok) {
      throw await readApiError(response);
    }

    const result = await response.json();
    const statusId = result.status?.id || 0;

    if (statusId > 2) {
      return result;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error("The Judge0 queue took too long to finish this run.");
}

async function runProgram() {
  if (isRunning) {
    return;
  }

  isRunning = true;
  elements.runButton.disabled = true;
  elements.runButton.textContent = "Running";
  setOutputState({
    tone: "running",
    status: "Submitting",
    body: "Sending your code to the online C runtime...",
    summary: `Status waiting for ${runtime.name}`,
    timing: "Waiting for result",
  });

  if (!runtimeLoaded) {
    await detectRuntime();
  }

  const startedAt = performance.now();

  try {
    const token = await createSubmission();
    const result = await pollSubmission(token);
    const execution = normaliseExecution(result, performance.now() - startedAt);
    setOutputState(execution);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Execution failed.";
    setOutputState({
      tone: "error",
      status: "Request failed",
      body: message,
      summary: "Status request failed",
      timing: `${Math.round(performance.now() - startedAt)} ms round trip`,
    });
  } finally {
    isRunning = false;
    elements.runButton.disabled = false;
    elements.runButton.textContent = "Run program";
  }
}

function handleEditorKeyDown(event) {
  if (event.key !== "Tab") {
    return;
  }

  event.preventDefault();

  const start = elements.codeEditor.selectionStart;
  const end = elements.codeEditor.selectionEnd;
  const value = elements.codeEditor.value;
  const insertion = "    ";

  elements.codeEditor.value =
    value.slice(0, start) + insertion + value.slice(end);
  elements.codeEditor.selectionStart = start + insertion.length;
  elements.codeEditor.selectionEnd = start + insertion.length;

  syncLineNumbers();
  updateCodeStats();
}

applyTheme(getPreferredTheme());

elements.codeEditor.addEventListener("input", () => {
  syncLineNumbers();
  updateCodeStats();
});

elements.codeEditor.addEventListener("scroll", () => {
  elements.lineNumbers.scrollTop = elements.codeEditor.scrollTop;
});

elements.codeEditor.addEventListener("keydown", handleEditorKeyDown);
elements.runButton.addEventListener("click", runProgram);
elements.resetButton.addEventListener("click", () => setExample("starter"));
if (elements.themeToggle) {
  elements.themeToggle.addEventListener("click", toggleTheme);
}
if (elements.copyButton) {
  elements.copyButton.addEventListener("click", () => {
    void copyCode();
  });
}
if (elements.tipsToggle) {
  elements.tipsToggle.addEventListener("click", () => {
    toggleInfoPanel("tips");
  });
}
if (elements.instructionsToggle) {
  elements.instructionsToggle.addEventListener("click", () => {
    toggleInfoPanel("instructions");
  });
}

elements.exampleButtons.forEach((button) => {
  button.addEventListener("click", () => setExample(button.dataset.example));
});

window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    runProgram();
  }
});

updatePanelToggle(elements.tipsToggle, elements.tipsPanel, false);
updatePanelToggle(elements.instructionsToggle, elements.instructionsPanel, false);
setExample("starter");
setOutputState({
  tone: "success",
  status: "Ready",
  body: "Run your program to see compiler output.",
  summary: "Status ready",
  timing: "Waiting for execution",
});
void detectRuntime();
