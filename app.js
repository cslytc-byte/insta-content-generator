/**
 * InstaCopy AI — Mobile Instagram Text Content Generator
 * Client-side text extraction (OCR, PDF, Excel) + Groq API with automatic model fallback.
 */

// --- Constants & Config ---
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODELS_URL = "https://api.groq.com/openai/v1/models";

const DEFAULT_MODELS = [
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
  "gemma2-9b-it",
  "deepseek-r1-distill-llama-70b"
];

// Sanitize saved model if it contains decommissioned models
let initialModel = localStorage.getItem("instacopy_model") || "llama-3.1-8b-instant";
if (initialModel.includes("mixtral") || initialModel.includes("llama3-")) {
  initialModel = "llama-3.1-8b-instant";
  localStorage.setItem("instacopy_model", initialModel);
}

// --- Application State ---
const state = {
  apiKey: localStorage.getItem("instacopy_groq_key") || "",
  selectedModel: initialModel,
  autoFallback: localStorage.getItem("instacopy_fallback") !== "false",
  currentFile: null,
  extractedText: "",
  persona: JSON.parse(localStorage.getItem("instacopy_persona") || "{}")
};

// --- DOM Elements ---
const dom = {
  // Navigation
  navButtons: document.querySelectorAll(".bottom-nav .nav-item"),
  tabs: document.querySelectorAll(".tab-content"),
  keyIndicator: document.getElementById("key-indicator"),
  missingKeyBanner: document.getElementById("missing-key-banner"),

  // Generator inputs
  postTopic: document.getElementById("post-topic"),
  postTone: document.getElementById("post-tone"),
  toneChips: document.querySelectorAll(".quick-chips .chip"),
  personaTag: document.getElementById("persona-applied-tag"),
  generateBtn: document.getElementById("generate-btn"),
  errorMsg: document.getElementById("error-message"),

  // File dropzone
  fileInput: document.getElementById("file-input"),
  fileDropzone: document.getElementById("file-dropzone"),
  dropzoneContent: document.getElementById("dropzone-content"),
  fileBadge: document.getElementById("file-badge"),
  fileName: document.getElementById("file-name"),
  fileStatus: document.getElementById("file-status"),
  fileIcon: document.getElementById("file-icon"),
  removeFileBtn: document.getElementById("remove-file-btn"),
  imagePreviewContainer: document.getElementById("image-preview-container"),
  imagePreview: document.getElementById("image-preview"),

  // Extracted text box
  extractedBox: document.getElementById("extracted-box"),
  extractedToggle: document.getElementById("extracted-toggle"),
  extractedBody: document.getElementById("extracted-body"),
  extractedText: document.getElementById("extracted-text"),
  extractedCharCount: document.getElementById("extracted-char-count"),

  // Loading
  loadingCard: document.getElementById("loading-card"),
  loadingTitle: document.getElementById("loading-title"),
  loadingStatus: document.getElementById("loading-status"),
  progressBar: document.getElementById("progress-bar"),

  // Results
  resultsContainer: document.getElementById("results-container"),
  copyAllBtn: document.getElementById("copy-all-btn"),
  caption1: document.getElementById("caption-1-text"),
  caption2: document.getElementById("caption-2-text"),
  caption3: document.getElementById("caption-3-text"),
  hashtagsText: document.getElementById("hashtags-text"),
  seoText: document.getElementById("seo-text"),
  pinnedComment: document.getElementById("pinned-comment-text"),

  // Personalize Tab
  personaNiche: document.getElementById("persona-niche"),
  personaTone: document.getElementById("persona-tone"),
  personaAudience: document.getElementById("persona-audience"),
  personaRules: document.getElementById("persona-rules"),
  savePersonaBtn: document.getElementById("save-persona-btn"),
  clearPersonaBtn: document.getElementById("clear-persona-btn"),

  // Guide Assistant
  guideInput: document.getElementById("guide-input"),
  guideSendBtn: document.getElementById("guide-send-btn"),
  guideChips: document.querySelectorAll(".guide-chip"),
  guideResponseCard: document.getElementById("guide-response-card"),
  guideResponseText: document.getElementById("guide-response-text"),

  // Settings Tab
  apiKeyInput: document.getElementById("groq-api-key"),
  toggleKeyVisBtn: document.getElementById("toggle-key-visibility"),
  modelSelect: document.getElementById("groq-model-select"),
  autoFallbackToggle: document.getElementById("auto-fallback-toggle"),
  saveKeyBtn: document.getElementById("save-key-btn"),
  clearKeyBtn: document.getElementById("clear-key-btn"),
  keyTestResult: document.getElementById("key-test-result"),

  // Onboarding Modal
  keyModal: document.getElementById("key-modal"),
  modalApiKey: document.getElementById("modal-api-key"),
  modalSaveBtn: document.getElementById("modal-save-btn"),

  // Toast
  toast: document.getElementById("toast")
};

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupSettingsUI();
  setupPersonalizeUI();
  setupFileUploadHandlers();
  setupToneChips();
  setupCopyButtons();
  setupGuideAssistant();
  setupGeneratorEvents();
  setupOnboardingModal();
  updateKeyStatusDisplay();
});

// --- Tab Navigation ---
function switchTab(tabId) {
  dom.tabs.forEach(tab => {
    tab.classList.toggle("active", tab.id === `tab-${tabId}`);
  });
  dom.navButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setupNavigation() {
  dom.navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      switchTab(btn.dataset.tab);
    });
  });
}

// --- Onboarding Modal Logic ---
function setupOnboardingModal() {
  if (!state.apiKey.trim()) {
    dom.keyModal.style.display = "flex";
  }

  dom.modalSaveBtn.addEventListener("click", () => {
    const key = dom.modalApiKey.value.trim();
    if (!key) {
      alert("Please paste your Groq API key (starts with gsk_)");
      return;
    }
    state.apiKey = key;
    localStorage.setItem("instacopy_groq_key", key);
    dom.apiKeyInput.value = key;
    dom.keyModal.style.display = "none";
    updateKeyStatusDisplay();
    showToast("Key Saved Permanently! Ready to create.");
  });
}

// --- Key Management & Status ---
function updateKeyStatusDisplay() {
  const hasKey = !!state.apiKey.trim();
  if (hasKey) {
    dom.keyIndicator.className = "key-status-dot key-saved";
    dom.keyIndicator.title = "Groq API Key Active";
    dom.missingKeyBanner.style.display = "none";
  } else {
    dom.keyIndicator.className = "key-status-dot key-missing";
    dom.keyIndicator.title = "Groq API Key Required";
    dom.missingKeyBanner.style.display = "flex";
  }
}

function setupSettingsUI() {
  dom.apiKeyInput.value = state.apiKey;
  dom.modelSelect.value = state.selectedModel;
  dom.autoFallbackToggle.checked = state.autoFallback;

  dom.toggleKeyVisBtn.addEventListener("click", () => {
    const isPassword = dom.apiKeyInput.type === "password";
    dom.apiKeyInput.type = isPassword ? "text" : "password";
    dom.toggleKeyVisBtn.textContent = isPassword ? "🙈" : "👁️";
  });

  dom.saveKeyBtn.addEventListener("click", async () => {
    const key = dom.apiKeyInput.value.trim();
    if (!key) {
      showTestResult("Please enter a valid Groq API key.", false);
      return;
    }

    dom.saveKeyBtn.disabled = true;
    dom.saveKeyBtn.textContent = "Testing Key...";
    showTestResult("Verifying connection to Groq API...", null);

    try {
      const availableModels = await fetchAvailableGroqModels(key);
      state.apiKey = key;
      localStorage.setItem("instacopy_groq_key", key);

      state.selectedModel = dom.modelSelect.value;
      localStorage.setItem("instacopy_model", state.selectedModel);

      state.autoFallback = dom.autoFallbackToggle.checked;
      localStorage.setItem("instacopy_fallback", state.autoFallback);

      updateKeyStatusDisplay();

      let modelMsg = `Connected! Active model: ${state.selectedModel}.`;
      if (availableModels.length > 0) {
        updateModelDropdown(availableModels);
        modelMsg += ` (${availableModels.length} models accessible)`;
      }
      showTestResult(modelMsg, true);
      showToast("Groq Key Saved Permanently!");
    } catch (err) {
      showTestResult(`Verification failed: ${err.message}`, false);
    } finally {
      dom.saveKeyBtn.disabled = false;
      dom.saveKeyBtn.textContent = "Save Key & Test";
    }
  });

  dom.clearKeyBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear your stored Groq API key?")) {
      state.apiKey = "";
      localStorage.removeItem("instacopy_groq_key");
      dom.apiKeyInput.value = "";
      updateKeyStatusDisplay();
      showTestResult("API Key removed from this device.", null);
      showToast("Key cleared");
    }
  });

  dom.autoFallbackToggle.addEventListener("change", (e) => {
    state.autoFallback = e.target.checked;
    localStorage.setItem("instacopy_fallback", state.autoFallback);
  });

  dom.modelSelect.addEventListener("change", (e) => {
    state.selectedModel = e.target.value;
    localStorage.setItem("instacopy_model", state.selectedModel);
  });
}

function showTestResult(message, isSuccess) {
  dom.keyTestResult.style.display = "block";
  if (isSuccess === true) {
    dom.keyTestResult.className = "status-box status-success";
  } else if (isSuccess === false) {
    dom.keyTestResult.className = "status-box status-error";
  } else {
    dom.keyTestResult.className = "status-box";
  }
  dom.keyTestResult.textContent = message;
}

async function fetchAvailableGroqModels(key) {
  try {
    const res = await fetch(GROQ_MODELS_URL, {
      headers: {
        "Authorization": `Bearer ${key.trim()}`,
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && Array.isArray(data.data)) {
      const activeModels = data.data
        .filter(m => m.active !== false)
        .map(m => m.id)
        .filter(id => {
          const lower = id.toLowerCase();
          return !lower.includes("whisper") &&
                 !lower.includes("tts") &&
                 !lower.includes("guard") &&
                 !lower.includes("embed") &&
                 !lower.includes("mixtral-8x7b-32768");
        });

      // Priority sort: llama-3.1-8b-instant first, then llama-3.3-70b-versatile
      activeModels.sort((a, b) => {
        if (a === "llama-3.1-8b-instant") return -1;
        if (b === "llama-3.1-8b-instant") return 1;
        if (a === "llama-3.3-70b-versatile") return -1;
        if (b === "llama-3.3-70b-versatile") return 1;
        return a.localeCompare(b);
      });

      return activeModels.length > 0 ? activeModels : DEFAULT_MODELS;
    }
  } catch (e) {
    console.warn("Could not fetch dynamic models list:", e);
  }
  return DEFAULT_MODELS;
}

function updateModelDropdown(modelsList) {
  const currentVal = dom.modelSelect.value;
  dom.modelSelect.innerHTML = "";
  modelsList.forEach(id => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = id === "llama-3.1-8b-instant" ? `${id} (Universal Free Access)` : id;
    if (id === currentVal) opt.selected = true;
    dom.modelSelect.appendChild(opt);
  });
}

// --- Personalize & Guide Logic ---
function setupPersonalizeUI() {
  // Populate existing persona
  dom.personaNiche.value = state.persona.niche || "";
  dom.personaTone.value = state.persona.tone || "";
  dom.personaAudience.value = state.persona.audience || "";
  dom.personaRules.value = state.persona.rules || "";
  updatePersonaActiveIndicator();

  dom.savePersonaBtn.addEventListener("click", () => {
    state.persona = {
      niche: dom.personaNiche.value.trim(),
      tone: dom.personaTone.value.trim(),
      audience: dom.personaAudience.value.trim(),
      rules: dom.personaRules.value.trim()
    };
    localStorage.setItem("instacopy_persona", JSON.stringify(state.persona));
    updatePersonaActiveIndicator();
    showToast("Brand Persona Saved!");
  });

  dom.clearPersonaBtn.addEventListener("click", () => {
    if (confirm("Reset brand persona?")) {
      state.persona = {};
      localStorage.removeItem("instacopy_persona");
      dom.personaNiche.value = "";
      dom.personaTone.value = "";
      dom.personaAudience.value = "";
      dom.personaRules.value = "";
      updatePersonaActiveIndicator();
      showToast("Persona Reset");
    }
  });
}

function updatePersonaActiveIndicator() {
  const hasPersona = Boolean(
    state.persona.niche || state.persona.tone || state.persona.audience || state.persona.rules
  );
  dom.personaTag.style.display = hasPersona ? "inline-block" : "none";
}

function setupGuideAssistant() {
  dom.guideChips.forEach(chip => {
    chip.addEventListener("click", () => {
      dom.guideInput.value = chip.dataset.query;
      askGuideAssistant(chip.dataset.query);
    });
  });

  dom.guideSendBtn.addEventListener("click", () => {
    const q = dom.guideInput.value.trim();
    if (q) askGuideAssistant(q);
  });

  dom.guideInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = dom.guideInput.value.trim();
      if (q) askGuideAssistant(q);
    }
  });
}

async function askGuideAssistant(query) {
  if (!ensureApiKey()) return;

  dom.guideSendBtn.disabled = true;
  dom.guideSendBtn.textContent = "Thinking...";
  dom.guideResponseCard.style.display = "block";
  dom.guideResponseText.textContent = "Formulating actionable copy advice...";

  try {
    let personaContext = "";
    if (state.persona.niche) personaContext += `\nCreator Niche: ${state.persona.niche}`;
    if (state.persona.tone) personaContext += `\nTone: ${state.persona.tone}`;
    if (state.persona.audience) personaContext += `\nTarget Audience: ${state.persona.audience}`;

    const prompt = `You are a world-class Instagram social media strategist and copywriting expert.
Creator context:${personaContext || "General creator/business"}

User question / request:
"${query}"

Rules:
- Give punchy, highly actionable advice or formulas.
- Sound human and sharp, not generic or fluff-filled.
- No "In today's fast-paced world" or "Elevate your journey".
- Never use the em-dash "—". Use colons, commas, or standard hyphens instead.
- Keep it tight, practical, and ready to apply immediately on Instagram.`;

    const response = await callGroqWithFallback([
      { role: "system", content: "You are a top Instagram copywriting strategist." },
      { role: "user", content: prompt }
    ]);

    dom.guideResponseText.textContent = cleanEmDashes(response);
  } catch (err) {
    dom.guideResponseText.textContent = `Error: ${err.message}`;
  } finally {
    dom.guideSendBtn.disabled = false;
    dom.guideSendBtn.textContent = "Ask";
  }
}

// --- File Handling & Client-Side Extraction (Saves Groq Limits) ---
function setupFileUploadHandlers() {
  dom.fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) {
      await handleSelectedFile(file);
    }
  });

  // Drag and drop
  ["dragenter", "dragover"].forEach(eventName => {
    dom.fileDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dom.fileDropzone.classList.add("dragover");
    }, false);
  });

  ["dragleave", "drop"].forEach(eventName => {
    dom.fileDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dom.fileDropzone.classList.remove("dragover");
    }, false);
  });

  dom.fileDropzone.addEventListener("drop", async (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleSelectedFile(e.dataTransfer.files[0]);
    }
  });

  dom.removeFileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    resetFileInput();
  });

  dom.extractedToggle.addEventListener("click", () => {
    const isHidden = dom.extractedBody.style.display === "none";
    dom.extractedBody.style.display = isHidden ? "block" : "none";
    dom.extractedToggle.querySelector(".toggle-arrow").textContent = isHidden ? "▴" : "▾";
  });

  dom.extractedText.addEventListener("input", () => {
    state.extractedText = dom.extractedText.value;
    dom.extractedCharCount.textContent = state.extractedText.length;
  });
}

function resetFileInput() {
  state.currentFile = null;
  state.extractedText = "";
  dom.fileInput.value = "";
  dom.dropzoneContent.style.display = "flex";
  dom.fileBadge.style.display = "none";
  dom.imagePreviewContainer.style.display = "none";
  dom.imagePreview.src = "";
  dom.extractedBox.style.display = "none";
  dom.extractedText.value = "";
  dom.extractedCharCount.textContent = "0";
}

async function handleSelectedFile(file) {
  state.currentFile = file;
  dom.dropzoneContent.style.display = "none";
  dom.fileBadge.style.display = "flex";
  dom.fileName.textContent = file.name;
  dom.fileStatus.textContent = "Extracting text locally...";

  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  // Set file icon
  if (fileType.startsWith("image/")) {
    dom.fileIcon.textContent = "🖼️";
    // Show image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      dom.imagePreview.src = e.target.result;
      dom.imagePreviewContainer.style.display = "flex";
    };
    reader.readAsDataURL(file);
  } else if (fileName.endsWith(".pdf")) {
    dom.fileIcon.textContent = "📑";
    dom.imagePreviewContainer.style.display = "none";
  } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")) {
    dom.fileIcon.textContent = "📊";
    dom.imagePreviewContainer.style.display = "none";
  } else {
    dom.fileIcon.textContent = "📄";
    dom.imagePreviewContainer.style.display = "none";
  }

  // Pre-extract text directly in browser
  try {
    let extracted = "";
    if (fileType.startsWith("image/")) {
      extracted = await extractTextFromImage(file);
    } else if (fileName.endsWith(".pdf")) {
      extracted = await extractTextFromPDF(file);
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")) {
      extracted = await extractTextFromExcel(file);
    } else {
      extracted = await file.text();
    }

    state.extractedText = extracted.trim();
    dom.fileStatus.textContent = `Extracted (${state.extractedText.length} chars)`;
    dom.fileStatus.style.color = "var(--accent-green)";

    // Show extracted drawer
    dom.extractedBox.style.display = "block";
    dom.extractedText.value = state.extractedText;
    dom.extractedCharCount.textContent = state.extractedText.length;
    showToast("Text extracted locally (zero Groq token waste)!");
  } catch (err) {
    console.error("Extraction error:", err);
    dom.fileStatus.textContent = "Could not extract text";
    dom.fileStatus.style.color = "var(--danger-color)";
    showToast("Could not auto-extract text from file");
  }
}

// 1. Tesseract OCR for Images
async function extractTextFromImage(file) {
  dom.fileStatus.textContent = "Running OCR scan...";
  if (typeof Tesseract === "undefined") {
    throw new Error("OCR engine not loaded");
  }
  const result = await Tesseract.recognize(file, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text") {
        const pct = Math.round((m.progress || 0) * 100);
        dom.fileStatus.textContent = `OCR Scanning: ${pct}%`;
      }
    }
  });
  return result.data.text || "";
}

// 2. PDF.js for PDF Documents
async function extractTextFromPDF(file) {
  dom.fileStatus.textContent = "Reading PDF pages...";
  if (typeof pdfjsLib === "undefined") {
    throw new Error("PDF parser not loaded");
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    fullText += `--- Page ${i} ---\n` + strings.join(" ") + "\n\n";
  }
  return fullText;
}

// 3. SheetJS for Excel & CSV
async function extractTextFromExcel(file) {
  dom.fileStatus.textContent = "Parsing spreadsheet...";
  if (typeof XLSX === "undefined") {
    throw new Error("Excel parser not loaded");
  }
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  let fullText = "";

  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    if (csv.trim()) {
      fullText += `--- Sheet: ${sheetName} ---\n${csv}\n\n`;
    }
  });
  return fullText;
}

// --- Tone Chips ---
function setupToneChips() {
  dom.toneChips.forEach(chip => {
    chip.addEventListener("click", () => {
      dom.toneChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      dom.postTone.value = chip.dataset.tone;
    });
  });
}

// --- Generator Events & Groq Call ---
function setupGeneratorEvents() {
  dom.generateBtn.addEventListener("click", async () => {
    await handleGenerate();
  });
}

function ensureApiKey() {
  if (!state.apiKey.trim()) {
    showError("Please enter your Groq API key first.");
    switchTab("settings");
    dom.apiKeyInput.focus();
    return false;
  }
  return true;
}

function showError(msg) {
  dom.errorMsg.style.display = "block";
  dom.errorMsg.textContent = msg;
}

function clearError() {
  dom.errorMsg.style.display = "none";
  dom.errorMsg.textContent = "";
}

async function handleGenerate() {
  clearError();
  if (!ensureApiKey()) return;

  const topicText = dom.postTopic.value.trim();
  const fileExtracted = dom.extractedText.value.trim() || state.extractedText.trim();

  // FLEXIBLE INPUT FIX: Either text, or file, or both!
  if (!topicText && !fileExtracted) {
    showError("Please enter a topic/text OR upload an image/file (either works!)");
    dom.postTopic.focus();
    return;
  }

  // Combine inputs cleanly
  let combinedInput = "";
  if (topicText && fileExtracted) {
    combinedInput = `User Topic/Context:\n${topicText}\n\nExtracted File Content:\n${fileExtracted}`;
  } else if (topicText) {
    combinedInput = topicText;
  } else {
    combinedInput = fileExtracted;
  }

  // Build Tone / Niche instructions
  let toneInstruction = dom.postTone.value.trim();
  if (!toneInstruction && state.persona.tone) {
    toneInstruction = state.persona.tone;
  }

  // UI loading state
  setLoading(true, "Preparing prompt...", 25);

  try {
    const prompt = buildCopywritingPrompt(combinedInput, toneInstruction);

    setLoading(true, `Contacting Groq (${state.selectedModel})...`, 60);

    const responseText = await callGroqWithFallback([
      {
        role: "system",
        content: `You are an elite, top-performing Instagram copywriter and social media strategist.
You write sharp, punchy, human-sounding Instagram content.
Rules:
- Strictly sound human, not like AI.
- No generic AI-sounding phrases ("In today's fast-paced world...", "Elevate your journey...", "Unleash your potential", excessive emoji strings).
- Strictly NEVER use this symbol: "—" (em-dash). Use colons, commas, or standard hyphens instead.
- Do not invent or fabricate facts, numbers, or stats not present in the input. Leave placeholders like [insert price] instead.
- Output MUST strictly be valid JSON following the schema requested.`
      },
      {
        role: "user",
        content: prompt
      }
    ]);

    setLoading(true, "Formatting your copy...", 90);

    const parsedOutput = parseGroqResponse(responseText);
    renderResults(parsedOutput);

    setLoading(false);
    dom.resultsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("🎉 Generated successfully!");
  } catch (err) {
    setLoading(false);
    console.error("Generation failed:", err);
    showError(`Generation error: ${err.message}`);
  }
}

function buildCopywritingPrompt(rawInput, tone) {
  let personaRules = "";
  if (state.persona.niche) personaRules += `\nCreator Niche: ${state.persona.niche}`;
  if (state.persona.audience) personaRules += `\nTarget Audience: ${state.persona.audience}`;
  if (state.persona.rules) personaRules += `\nSpecial Creator Rules: ${state.persona.rules}`;

  return `Here is the post material/extracted content:
"""
${rawInput}
"""

Tone/Niche preference: ${tone || "Make a smart, natural guess based on the content"}
${personaRules}

Create everything needed to publish on Instagram from this ONE input.
You must output a single JSON object with EXACTLY these 4 keys:

{
  "captions": [
    "Option 1: [Start with a strong, curiosity-driven or bold hook on the first line]. [Engaging, readable body with clean line breaks]. [Clear call to action]",
    "Option 2: [Start with a story, relatable angle, or counter-intuitive hook]. [Body]. [CTA]",
    "Option 3: [Start with a short, punchy, high-impact hook]. [Body]. [CTA]"
  ],
  "hashtags": "15 to 20 hashtags formatted with # symbols, separated by spaces. Must be a strategic mix of high-volume broad tags and specific niche tags.",
  "seo_words": "5 to 8 natural, keyword-rich search terms (comma-separated) optimized for the Instagram search algorithm.",
  "pinned_comment": "A short, engaging comment to post immediately after publishing to spark discussions or drive interactions."
}

CRITICAL RULES:
1. Every caption MUST start with a scroll-stopping hook on line 1.
2. Absolutely DO NOT use the em-dash "—" anywhere in the content.
3. Sound human, confident, and conversational. No robotic AI fluff or cliché phrases.
4. Do not make up facts or statistics not in the input.
5. Return ONLY the raw JSON object.`;
}

// --- Groq API Call with Auto-Fallback ---
async function callGroqWithFallback(messages) {
  // Clear any legacy decommissioned models from state
  if (state.selectedModel.includes("mixtral") || state.selectedModel.includes("llama3-")) {
    state.selectedModel = "llama-3.1-8b-instant";
    localStorage.setItem("instacopy_model", state.selectedModel);
    if (dom.modelSelect) dom.modelSelect.value = state.selectedModel;
  }

  const modelsToTry = [state.selectedModel];

  if (state.autoFallback) {
    DEFAULT_MODELS.forEach(m => {
      if (!modelsToTry.includes(m)) modelsToTry.push(m);
    });
  }

  let lastError = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      if (i > 0) {
        setLoading(true, `Retrying with model ${model}...`, 75);
      }

      const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${state.apiKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 2048,
          response_format: { type: "json_object" }
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `HTTP ${res.status}`;
        const errMsgLower = errMsg.toLowerCase();

        // Check if it's a 400, 404, or model error
        const isModelError =
          res.status === 404 ||
          res.status === 400 ||
          errMsgLower.includes("does not exist") ||
          errMsgLower.includes("access to it") ||
          errMsgLower.includes("decommissioned") ||
          errMsgLower.includes("deprecated") ||
          errMsgLower.includes("model");

        if (isModelError && state.autoFallback) {
          console.warn(`Model ${model} failed with: ${errMsg}. Trying next model...`);
          lastError = new Error(`Model ${model} failed: ${errMsg}`);

          // If there are more models queued, try the next one
          if (i < modelsToTry.length - 1) {
            continue;
          }

          // If we reached the end of the queue, discover live active models from Groq
          try {
            const liveModels = await fetchAvailableGroqModels(state.apiKey);
            const untried = liveModels.filter(m => !modelsToTry.includes(m));
            if (untried.length > 0) {
              console.log(`Discovered ${untried.length} active models from Groq:`, untried);
              modelsToTry.push(...untried);
              continue;
            }
          } catch (e) {
            console.warn("Could not query extra models:", e);
          }
        }

        throw new Error(`Groq API error (${res.status}): ${errMsg}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty response received from Groq API.");

      // If we used a fallback model successfully, update the current model
      if (model !== state.selectedModel) {
        state.selectedModel = model;
        localStorage.setItem("instacopy_model", model);
        if (dom.modelSelect) dom.modelSelect.value = model;
        console.log(`Auto-switched active model to ${model}`);
      }

      return content;
    } catch (err) {
      lastError = err;
      if (state.autoFallback && i < modelsToTry.length - 1) {
        continue;
      }
      break;
    }
  }

  throw lastError || new Error("Failed to contact Groq API after trying fallback models.");
}

// --- Response Parser & Sanitizer ---
function cleanEmDashes(text) {
  if (!text) return "";
  // Strip em-dash and en-dash completely per strict user instruction
  return text.replace(/—/g, " - ").replace(/–/g, " - ");
}

function parseGroqResponse(responseText) {
  let cleaned = cleanEmDashes(responseText.trim());

  // Extract JSON if wrapped in markdown code blocks
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
  }

  try {
    const data = JSON.parse(cleaned);
    return {
      captions: Array.isArray(data.captions) ? data.captions : [data.caption || cleaned],
      hashtags: data.hashtags || "",
      seo_words: data.seo_words || "",
      pinned_comment: data.pinned_comment || ""
    };
  } catch (e) {
    console.warn("Could not parse strict JSON, formatting raw text:", e);
    return parsePlainTextFallback(cleaned);
  }
}

function parsePlainTextFallback(rawText) {
  // Fallback parser in case Groq returns labeled plain text
  return {
    captions: [
      rawText.split("Hashtags:")[0] || rawText,
      "Option 2 fallback",
      "Option 3 fallback"
    ],
    hashtags: "#instagram #contentcreator",
    seo_words: "instagram content, viral captions",
    pinned_comment: "Let me know your thoughts in the comments below!"
  };
}

// --- Results Rendering ---
function renderResults(data) {
  dom.caption1.textContent = cleanEmDashes(data.captions[0] || "No caption generated.");
  dom.caption2.textContent = cleanEmDashes(data.captions[1] || "No caption generated.");
  dom.caption3.textContent = cleanEmDashes(data.captions[2] || "No caption generated.");

  dom.hashtagsText.textContent = cleanEmDashes(data.hashtags || "");
  dom.seoText.textContent = cleanEmDashes(data.seo_words || "");
  dom.pinnedComment.textContent = cleanEmDashes(data.pinned_comment || "");

  dom.resultsContainer.style.display = "block";
}

// --- Copy & Clipboard Handlers ---
function setupCopyButtons() {
  document.querySelectorAll(".btn-copy-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.copyTarget;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        copyToClipboard(targetEl.textContent || targetEl.innerText);
        animateButtonCopied(btn);
      }
    });
  });

  dom.copyAllBtn.addEventListener("click", () => {
    const c1 = dom.caption1.textContent;
    const c2 = dom.caption2.textContent;
    const c3 = dom.caption3.textContent;
    const tags = dom.hashtagsText.textContent;
    const seo = dom.seoText.textContent;
    const pinned = dom.pinnedComment.textContent;

    const fullContent = `--- CAPTION OPTION 1 ---
${c1}

--- CAPTION OPTION 2 ---
${c2}

--- CAPTION OPTION 3 ---
${c3}

--- HASHTAGS ---
${tags}

--- SEO KEYWORDS ---
${seo}

--- PINNED COMMENT ---
${pinned}`;

    copyToClipboard(fullContent);
    animateButtonCopied(dom.copyAllBtn, "📋 Copied All!");
  });
}

function copyToClipboard(text) {
  if (!text) return;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast("Copied to clipboard!");
      triggerHaptic();
    }).catch(() => {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
    showToast("Copied to clipboard!");
    triggerHaptic();
  } catch (err) {
    console.error("Fallback copy failed:", err);
  }
  document.body.removeChild(textArea);
}

function animateButtonCopied(buttonEl, customText) {
  const originalHtml = buttonEl.innerHTML;
  buttonEl.textContent = customText || "✓ Copied!";
  buttonEl.style.background = "var(--accent-green)";
  buttonEl.style.color = "#ffffff";
  setTimeout(() => {
    buttonEl.innerHTML = originalHtml;
    buttonEl.style.background = "";
    buttonEl.style.color = "";
  }, 1800);
}

function triggerHaptic() {
  if (navigator.vibrate) {
    navigator.vibrate(30);
  }
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add("show");
  setTimeout(() => {
    dom.toast.classList.remove("show");
  }, 2200);
}

function setLoading(isLoading, statusText = "", progressPct = 0) {
  if (isLoading) {
    dom.loadingCard.style.display = "block";
    dom.loadingStatus.textContent = statusText;
    dom.progressBar.style.width = `${progressPct}%`;
    dom.generateBtn.disabled = true;
  } else {
    dom.loadingCard.style.display = "none";
    dom.generateBtn.disabled = false;
  }
}
