const STORAGE_KEY = "diner-survey-responses";
const CATEGORIES = [
  { key: "comida", label: "Comida" },
  { key: "servicio", label: "Servicio" },
  { key: "ambiente", label: "Ambiente" },
  { key: "limpieza", label: "Limpieza" },
];

function loadResponses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveResponses(responses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
}

// ---------- Star rating widgets ----------
const ratings = {};

function buildStarWidget(container) {
  const category = container.dataset.category;
  ratings[category] = 0;
  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "star-btn";
    btn.textContent = "★";
    btn.setAttribute("aria-label", `${i} estrella${i > 1 ? "s" : ""} para ${category}`);
    btn.dataset.value = i;
    btn.addEventListener("click", () => {
      ratings[category] = i;
      [...container.children].forEach((star, idx) => {
        star.classList.toggle("filled", idx < i);
      });
    });
    container.appendChild(btn);
  }
}

document.querySelectorAll(".stars").forEach(buildStarWidget);

// ---------- Tabs ----------
const tabSurvey = document.getElementById("tab-survey");
const tabDashboard = document.getElementById("tab-dashboard");
const viewSurvey = document.getElementById("view-survey");
const viewDashboard = document.getElementById("view-dashboard");

function activateTab(name) {
  const isSurvey = name === "survey";
  tabSurvey.classList.toggle("active", isSurvey);
  tabDashboard.classList.toggle("active", !isSurvey);
  tabSurvey.setAttribute("aria-selected", String(isSurvey));
  tabDashboard.setAttribute("aria-selected", String(!isSurvey));
  viewSurvey.classList.toggle("active", isSurvey);
  viewDashboard.classList.toggle("active", !isSurvey);
  viewSurvey.hidden = !isSurvey;
  viewDashboard.hidden = isSurvey;
  if (!isSurvey) renderDashboard();
}

tabSurvey.addEventListener("click", () => activateTab("survey"));
tabDashboard.addEventListener("click", () => activateTab("dashboard"));

// ---------- Form submit ----------
const form = document.getElementById("survey-form");
const formError = document.getElementById("form-error");
const thanks = document.getElementById("thanks");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const comedor = document.getElementById("comedor").value.trim();
  const allRated = CATEGORIES.every((c) => ratings[c.key] > 0);
  if (!comedor || !allRated) {
    formError.hidden = false;
    formError.textContent = !comedor
      ? "Por favor indica a qué comedor pertenece."
      : "Por favor califica las cuatro categorías antes de enviar.";
    return;
  }
  formError.hidden = true;

  const responses = loadResponses();
  const entry = {
    id: Date.now(),
    date: new Date().toISOString(),
    comedor,
    mesa: document.getElementById("mesa").value.trim(),
    comentario: document.getElementById("comentario").value.trim(),
    ratings: { ...ratings },
  };
  responses.push(entry);
  saveResponses(responses);
  populateComedorOptions();

  form.hidden = true;
  thanks.hidden = false;
});

document.getElementById("btn-again").addEventListener("click", () => {
  const keepComedor = document.getElementById("comedor").value;
  form.reset();
  document.getElementById("comedor").value = keepComedor;
  document.querySelectorAll(".stars").forEach((el) => {
    ratings[el.dataset.category] = 0;
    [...el.children].forEach((s) => s.classList.remove("filled"));
  });
  formError.hidden = true;
  thanks.hidden = true;
  form.hidden = false;
});

// ---------- Comedor list (autocomplete + dashboard filter) ----------
function uniqueComedores(responses) {
  return [...new Set(responses.map((r) => r.comedor).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "es")
  );
}

function populateComedorOptions() {
  const comedores = uniqueComedores(loadResponses());

  const datalist = document.getElementById("comedor-options");
  datalist.innerHTML = comedores.map((c) => `<option value="${escapeHtml(c)}"></option>`).join("");

  const filterSelect = document.getElementById("filter-comedor");
  const current = filterSelect.value;
  filterSelect.innerHTML =
    `<option value="">Todos los comedores</option>` +
    comedores.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  if (comedores.includes(current)) filterSelect.value = current;
}

populateComedorOptions();
document.getElementById("filter-comedor").addEventListener("change", renderDashboard);

// ---------- Dashboard ----------
function average(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function overallScore(entry) {
  const vals = CATEGORIES.map((c) => entry.ratings[c.key]);
  return average(vals);
}

function renderDashboard() {
  populateComedorOptions();
  const selectedComedor = document.getElementById("filter-comedor").value;
  const all = loadResponses();
  const responses = selectedComedor
    ? all.filter((r) => r.comedor === selectedComedor)
    : all;

  document.getElementById("stat-total").textContent = responses.length;

  const overallScores = responses.map(overallScore);
  const avg = average(overallScores);
  document.getElementById("stat-avg").textContent = responses.length
    ? `${avg.toFixed(1)}★`
    : "–";

  const satisfied = responses.filter((r) => overallScore(r) >= 4).length;
  document.getElementById("stat-satisfied").textContent = responses.length
    ? `${Math.round((satisfied / responses.length) * 100)}%`
    : "–";

  renderCategoryChart(responses);
  renderDistributionChart(responses);
  renderComments(responses);
}

function renderCategoryChart(responses) {
  const chart = document.getElementById("chart-categories");
  chart.innerHTML = "";
  CATEGORIES.forEach((cat) => {
    const vals = responses.map((r) => r.ratings[cat.key]).filter(Boolean);
    const avg = average(vals);
    const pct = (avg / 5) * 100;

    const row = document.createElement("div");
    row.className = "bar-row";
    row.title = vals.length
      ? `${cat.label}: ${avg.toFixed(2)} de 5 (${vals.length} respuestas)`
      : `${cat.label}: sin datos`;

    row.innerHTML = `
      <span class="bar-label">${cat.label}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${vals.length ? pct : 0}%"></span></span>
      <span class="bar-value">${vals.length ? avg.toFixed(1) : "–"}</span>
    `;
    chart.appendChild(row);
  });
}

function renderDistributionChart(responses) {
  const chart = document.getElementById("chart-distribution");
  chart.innerHTML = "";
  const scores = responses.map((r) => Math.round(overallScore(r)));
  const counts = [1, 2, 3, 4, 5].map((n) => scores.filter((s) => s === n).length);
  const max = Math.max(1, ...counts);

  [5, 4, 3, 2, 1].forEach((n) => {
    const count = counts[n - 1];
    const pct = (count / max) * 100;
    const row = document.createElement("div");
    row.className = "bar-row";
    row.title = `${n}★: ${count} respuesta${count === 1 ? "" : "s"}`;
    row.innerHTML = `
      <span class="bar-label">${n}★</span>
      <span class="bar-track"><span class="bar-fill" style="width:${count ? pct : 0}%"></span></span>
      <span class="bar-value">${count}</span>
    `;
    chart.appendChild(row);
  });
}

function renderComments(responses) {
  const list = document.getElementById("comments-list");
  const empty = document.getElementById("comments-empty");
  list.innerHTML = "";

  const withComments = responses
    .filter((r) => r.comentario)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  empty.hidden = withComments.length > 0;

  withComments.forEach((r) => {
    const li = document.createElement("li");
    li.className = "comment-item";
    const score = overallScore(r).toFixed(1);
    const dateStr = new Date(r.date).toLocaleDateString("es", {
      day: "2-digit",
      month: "short",
    });
    const location = [r.comedor, r.mesa].filter(Boolean).join(" · ") || "Sin ubicación";
    li.innerHTML = `
      <div class="comment-meta">
        <span>${escapeHtml(location)} · ${dateStr}</span>
        <span class="comment-stars">${score}★</span>
      </div>
      <p class="comment-text">${escapeHtml(r.comentario)}</p>
    `;
    list.appendChild(li);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Export / reset ----------
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => (toast.hidden = true), 2200);
}

document.getElementById("btn-export").addEventListener("click", () => {
  const selectedComedor = document.getElementById("filter-comedor").value;
  const all = loadResponses();
  const responses = selectedComedor ? all.filter((r) => r.comedor === selectedComedor) : all;
  if (!responses.length) {
    showToast("No hay datos para exportar");
    return;
  }
  const header = ["fecha", "comedor", "mesa", "comida", "servicio", "ambiente", "limpieza", "comentario"];
  const rows = responses.map((r) => [
    r.date,
    r.comedor || "",
    r.mesa,
    r.ratings.comida,
    r.ratings.servicio,
    r.ratings.ambiente,
    r.ratings.limpieza,
    (r.comentario || "").replace(/"/g, '""'),
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `encuesta-comensales-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("btn-reset").addEventListener("click", () => {
  if (!confirm("¿Seguro que quieres borrar todas las respuestas? Esta acción no se puede deshacer.")) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  renderDashboard();
  showToast("Datos borrados");
});
