// scripts/add-activity.js

// Helpers for date formatting
function toISODate(date) {
  // YYYY-MM-DD for the hidden <input type="date">
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`; // DD-MM-YYYY
}

// Global state
let currentUser = null;
let currentDisplayDate = ""; // DD-MM-YYYY

const auth = firebase.auth();
const db = firebase.firestore();

const welcomeText = document.getElementById("welcomeText");
const dateDisplayBtn = document.getElementById("dateDisplay");
const dateDisplayText = document.getElementById("dateDisplayText");
const datePicker = document.getElementById("datePicker");

const nameInput = document.getElementById("activityName");
const categorySelect = document.getElementById("activityCategory");
const minutesInput = document.getElementById("activityMinutes");
const addBtn = document.getElementById("addActivityBtn");

const tbody = document.getElementById("activitiesBody");
const emptyState = document.getElementById("emptyState");

const progressLabel = document.getElementById("progressLabel");
const progressBarInner = document.getElementById("progressBarInner");
const progressRemaining = document.getElementById("progressRemaining");

const logoutBtn = document.getElementById("logoutBtn");
const goDashboardBtn = document.getElementById("goDashboardBtn");

// ---------- AUTH GUARD ----------

auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "../index.html";
    return;
  }
  currentUser = user;
  welcomeText.textContent = `Welcome, ${user.displayName || "Friend"}`;

  initDateAndLoad();
});

// ---------- DATE HANDLING ----------

function initDateAndLoad() {
  const today = new Date();
  const isoToday = toISODate(today);
  const displayToday = formatDisplayDate(today);

  currentDisplayDate = displayToday;
  datePicker.value = isoToday;
  dateDisplayText.textContent = displayToday;

  loadActivitiesForCurrentDate();
}

// show native picker when user clicks pill
dateDisplayBtn.addEventListener("click", () => {
  if (datePicker.showPicker) {
    datePicker.showPicker();
  } else {
    datePicker.click();
  }
});

datePicker.addEventListener("change", () => {
  if (!datePicker.value) return;
  const d = new Date(datePicker.value);
  const display = formatDisplayDate(d);
  currentDisplayDate = display;
  dateDisplayText.textContent = display;
  loadActivitiesForCurrentDate();
});

// ---------- FIRESTORE OPERATIONS ----------

async function loadActivitiesForCurrentDate() {
  if (!currentUser) return;

  tbody.innerHTML = "";
  emptyState.style.display = "none";

  try {
    const snapshot = await db
      .collection("users")
      .doc(currentUser.uid)
      .collection("activities")
      .where("date", "==", currentDisplayDate)
      .get();

    if (snapshot.empty) {
      emptyState.style.display = "block";
      updateProgress(0);
      return;
    }

    let totalMinutes = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      totalMinutes += Number(data.minutes) || 0;

      const tr = document.createElement("tr");
      tr.dataset.id = doc.id;

      const tdName = document.createElement("td");
      tdName.textContent = data.name;

      const tdCat = document.createElement("td");
      const pill = document.createElement("span");
      pill.textContent = data.category;
      pill.classList.add(
        "category-pill",
        getCategoryClass(data.category)
      );
      tdCat.appendChild(pill);

      const tdMin = document.createElement("td");
      tdMin.textContent = data.minutes;

      const tdActions = document.createElement("td");
      const editBtn = document.createElement("button");
      editBtn.className = "action-btn edit";
      editBtn.innerHTML = "✏";
      editBtn.addEventListener("click", () => startEdit(doc.id, data));

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "action-btn delete";
      deleteBtn.innerHTML = "🗑";
      deleteBtn.addEventListener("click", () => deleteActivity(doc.id));

      tdActions.append(editBtn, deleteBtn);

      tr.append(tdName, tdCat, tdMin, tdActions);
      tbody.appendChild(tr);
    });

    updateProgress(totalMinutes);
  } catch (err) {
    console.error("Error loading activities:", err);
    emptyState.textContent = "Failed to load activities.";
    emptyState.style.display = "block";
  }
}

function getCategoryClass(category) {
  switch (category) {
    case "Work":
      return "cat-work";
    case "Study":
      return "cat-study";
    case "Health":
      return "cat-health";
    case "Sleep":
      return "cat-sleep";
    case "Leisure":
      return "cat-leisure";
    default:
      return "cat-others";
  }
}

// ---------- ADD / EDIT / DELETE ----------

let editingId = null;

addBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const category = categorySelect.value;
  const minutes = Number(minutesInput.value);

  if (!name) {
    alert("Please enter an activity name.");
    return;
  }
  if (!minutes || minutes <= 0) {
    alert("Please enter a valid duration.");
    return;
  }
  if (!currentDisplayDate) {
    alert("Invalid date selected.");
    return;
  }

  try {
    const activitiesRef = db
      .collection("users")
      .doc(currentUser.uid)
      .collection("activities");

    if (editingId) {
      await activitiesRef.doc(editingId).update({
        name,
        category,
        minutes,
      });
      editingId = null;
      addBtn.textContent = "Add Activity";
    } else {
      await activitiesRef.add({
        name,
        category,
        minutes,
        date: currentDisplayDate, // DD-MM-YYYY
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Reset form
    nameInput.value = "";
    minutesInput.value = "";
    categorySelect.value = "Work";

    loadActivitiesForCurrentDate();
  } catch (err) {
    console.error("Error saving activity:", err);
    alert("Failed to save activity. Please try again.");
  }
});

function startEdit(id, data) {
  editingId = id;
  nameInput.value = data.name;
  categorySelect.value = data.category;
  minutesInput.value = data.minutes;
  addBtn.textContent = "Save Changes";
}

async function deleteActivity(id) {
  if (!confirm("Delete this activity?")) return;

  try {
    await db
      .collection("users")
      .doc(currentUser.uid)
      .collection("activities")
      .doc(id)
      .delete();

    loadActivitiesForCurrentDate();
  } catch (err) {
    console.error("Error deleting:", err);
    alert("Failed to delete activity.");
  }
}

// ---------- PROGRESS BAR ----------

function updateProgress(totalMinutes) {
  const max = 1440;
  const clamped = Math.min(totalMinutes, max);
  const pct = (clamped / max) * 100;

  progressBarInner.style.width = `${pct}%`;
  progressLabel.textContent = `${clamped} / ${max} min`;
  progressRemaining.textContent = `${max - clamped} minutes remaining`;
}

// ---------- NAV ----------

logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
  window.location.href = "../index.html";
});

goDashboardBtn.addEventListener("click", () => {
  window.location.href = "./dashboard.html";
});
