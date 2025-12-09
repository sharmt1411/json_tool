/**
 * JSON Master - All-in-One Tool
 * Script: Escape, Unescape, Fix, Format, View
 */

// =============================================
// DOM Elements
// =============================================
const inputEl = document.getElementById("json-input");
const outputEl = document.getElementById("json-output");
const inputStats = document.getElementById("input-stats");
const themeToggle = document.getElementById("theme-toggle");
const clearBtn = document.getElementById("clear-input");
const pasteBtn = document.getElementById("paste-input");
const copyBtn = document.getElementById("copy-output");
const swapBtn = document.getElementById("swap-btn");
const viewBtns = document.querySelectorAll(".view-btn");
const viewContainers = document.querySelectorAll(".view-container");
const toolBtns = document.querySelectorAll(".tool-btn[data-action]");

let jsonEditor = null;
let currentOutput = "";

// =============================================
// Initialize
// =============================================
document.addEventListener("DOMContentLoaded", () => {
  initJSONEditor();
  bindEvents();
  updateInputStats();
});

function initJSONEditor() {
  const container = document.getElementById("jsoneditor");
  const options = {
    mode: "view",
    modes: ["tree", "view", "code"],
    onError: (err) => showToast(err.message, "error"),
  };
  jsonEditor = new JSONEditor(container, options);
}

// =============================================
// Event Bindings
// =============================================
function bindEvents() {
  // Input stats
  inputEl.addEventListener("input", updateInputStats);

  // Theme toggle
  themeToggle.addEventListener("click", toggleTheme);

  // Clear / Paste
  clearBtn.addEventListener("click", () => {
    inputEl.value = "";
    updateInputStats();
  });

  pasteBtn.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      inputEl.value = text;
      updateInputStats();
      showToast("Pasted from clipboard", "success");
    } catch (err) {
      showToast("Failed to read clipboard", "error");
    }
  });

  // Copy output
  copyBtn.addEventListener("click", async () => {
    if (!currentOutput) {
      showToast("Nothing to copy", "warning");
      return;
    }
    try {
      await navigator.clipboard.writeText(currentOutput);
      showToast("Copied to clipboard!", "success");
    } catch (err) {
      showToast("Failed to copy", "error");
    }
  });

  // Swap button
  swapBtn.addEventListener("click", () => {
    if (!currentOutput) {
      showToast("No result to use", "warning");
      return;
    }
    inputEl.value = currentOutput;
    updateInputStats();
    showToast("Result moved to input", "success");
  });

  // View toggles
  viewBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      switchView(view);
    });
  });

  // Tool buttons
  toolBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      performAction(action);
    });
  });
}

// =============================================
// View Switching
// =============================================
function switchView(view) {
  viewBtns.forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.view === view)
  );
  viewContainers.forEach((container) => {
    container.classList.toggle("active", container.id === `view-${view}`);
  });

  // If switching to tree view, update the editor
  if (view === "tree" && currentOutput) {
    try {
      const parsed = JSON.parse(currentOutput);
      jsonEditor.set(parsed);
    } catch (e) {
      showToast("Cannot show tree: Invalid JSON", "error");
    }
  }
}

// =============================================
// Actions
// =============================================
function performAction(action) {
  const input = inputEl.value.trim();

  if (!input) {
    showToast("Please enter some text first", "warning");
    return;
  }

  let result = "";

  try {
    switch (action) {
      case "format":
        result = formatJSON(input);
        break;
      case "minify":
        result = minifyJSON(input);
        break;
      case "fix":
        result = fixJSON(input);
        break;
      case "validate":
        validateJSON(input);
        return; // Just shows toast, no output change
      case "escape":
        result = escapeJSON(input);
        break;
      case "unescape":
        result = unescapeJSON(input);
        break;
      default:
        return;
    }

    setOutput(result);
    showToast(`${capitalize(action)} completed!`, "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

// =============================================
// JSON Operations
// =============================================

// Format / Beautify
function formatJSON(input) {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed, null, 2);
}

// Minify
function minifyJSON(input) {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed);
}

// Validate
function validateJSON(input) {
  try {
    JSON.parse(input);
    showToast("✓ Valid JSON!", "success");
  } catch (e) {
    showToast(`✗ Invalid: ${e.message}`, "error");
  }
}

// Escape - Convert JSON to escaped string
function escapeJSON(input) {
  // If it's valid JSON, stringify it (which escapes)
  // Otherwise just escape the raw string
  try {
    const parsed = JSON.parse(input);
    // Return escaped version (stringify again to get escaped string)
    return JSON.stringify(JSON.stringify(parsed));
  } catch {
    // Not valid JSON, escape as raw string
    return JSON.stringify(input);
  }
}

// Unescape - Convert escaped string back to JSON
function unescapeJSON(input) {
  // First try to parse it as a JSON string
  try {
    const unescaped = JSON.parse(input);
    // If result is a string, it was an escaped string
    if (typeof unescaped === "string") {
      // Try to format it if it's valid JSON
      try {
        return JSON.stringify(JSON.parse(unescaped), null, 2);
      } catch {
        return unescaped;
      }
    }
    // If it's already an object, just format it
    return JSON.stringify(unescaped, null, 2);
  } catch (e) {
    // Manual unescape
    const manualUnescaped = input
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");

    try {
      return JSON.stringify(JSON.parse(manualUnescaped), null, 2);
    } catch {
      return manualUnescaped;
    }
  }
}

// Fix JSON - Use jsonrepair library (same as codebeautify.org/json-fixer)
// Handles: missing quotes, brackets, commas, trailing commas, comments, etc.
function fixJSON(input) {
  // Try parsing first - if it works, just format it
  try {
    return JSON.stringify(JSON.parse(input), null, 2);
  } catch (e) {
    // Use jsonrepair library
  }

  try {
    // jsonrepair is loaded from CDN - check for both possible global names
    const repairFn = typeof JSONRepair !== 'undefined' ? JSONRepair.jsonrepair : 
                     typeof jsonrepair !== 'undefined' ? jsonrepair : null;
    if (!repairFn) {
      throw new Error("jsonrepair library not loaded");
    }
    const repaired = repairFn(input);
    // Parse and re-stringify to format nicely
    const parsed = JSON.parse(repaired);
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    throw new Error("Could not fix JSON: " + e.message);
  }
}

// =============================================
// Output Handling
// =============================================
function setOutput(text) {
  currentOutput = text;
  outputEl.textContent = text;

  // Re-highlight with Prism
  Prism.highlightElement(outputEl);

  // Also update tree view if active
  const treeViewActive = document
    .querySelector('.view-btn[data-view="tree"]')
    .classList.contains("active");
  if (treeViewActive) {
    try {
      jsonEditor.set(JSON.parse(text));
    } catch {
      // Not valid JSON, can't show in tree
    }
  }
}

// =============================================
// UI Helpers
// =============================================
function updateInputStats() {
  const len = inputEl.value.length;
  inputStats.textContent = `${len.toLocaleString()} chars`;
}

function toggleTheme() {
  const body = document.body;
  const isDark = body.classList.contains("dark-theme");

  body.classList.toggle("dark-theme", !isDark);
  body.classList.toggle("light-theme", isDark);

  // Update icon
  const icon = themeToggle.querySelector("i");
  icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// =============================================
// Toast Notifications
// =============================================
let toastTimeout = null;

function showToast(message, type = "info") {
  // Remove existing toast
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  // Create new toast
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  let icon = "fa-circle-info";
  if (type === "success") icon = "fa-circle-check";
  if (type === "error") icon = "fa-circle-xmark";
  if (type === "warning") icon = "fa-triangle-exclamation";

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  // Auto hide
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
