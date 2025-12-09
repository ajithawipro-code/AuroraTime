// GLOBALS
let dashDate = new Date();
let chart = null;

// DATE FORMATS
function formatDisplay(date) {
    return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
}

// INIT
function initDashboard() {
    auth.onAuthStateChanged((user) => {
        if (!user) return (window.location.href = "../index.html");
        loadUser(user);
        setDashDate(dashDate);
    });
}

// LOAD USER
function loadUser(user) {
    document.getElementById("userName").textContent = user.displayName || "User";
    document.getElementById("userPhoto").src = user.photoURL || "../assets/default-user.png";
}

// DATE NAVIGATION
function setDashDate(dateObj) {
    document.getElementById("dashDateText").textContent = formatDisplay(dateObj);
    loadDashboardData(formatDisplay(dateObj));
}

function previousDate() { dashDate.setDate(dashDate.getDate() - 1); setDashDate(dashDate); }
function nextDate() { dashDate.setDate(dashDate.getDate() + 1); setDashDate(dashDate); }

function openDashDatePicker() { document.getElementById("dashDatePicker").showPicker(); }
document.getElementById("dashDatePicker").addEventListener("change", function () {
    dashDate = new Date(this.value);
    setDashDate(dashDate);
});

// FIRESTORE LOAD
function loadDashboardData(dateStr) {
    const user = auth.currentUser;
    if (!user) return;

    db.collection("users")
        .doc(user.uid)
        .collection("activities")
        .where("date", "==", dateStr)
        .get()
        .then((snapshot) => calculateStats(snapshot))
        .catch((err) => {
            console.log("Dashboard load error:", err);
            calculateStats({ empty: true, size: 0, forEach: () => {} });
        });
}

// CALCULATE
function calculateStats(snapshot) {
    let total = 0;
    let categories = {};
    const totalTimeEl = document.getElementById("totalTime");
    const totalActivitiesEl = document.getElementById("totalActivities");
    const dayPercentEl = document.getElementById("dayPercent");
    const emptyMsg = document.getElementById("emptyChartMsg");

    if (snapshot.empty) {
        totalTimeEl.textContent = 0;
        totalActivitiesEl.textContent = 0;
        dayPercentEl.textContent = "0%";
        emptyMsg.style.display = "block";
        drawChart({});
        return;
    }

    emptyMsg.style.display = "none";

    snapshot.forEach((doc) => {
        const d = doc.data();
        const mins = Number(d.minutes) || 0;
        total += mins;
        categories[d.category] = (categories[d.category] || 0) + mins;
    });

    totalTimeEl.textContent = total;
    totalActivitiesEl.textContent = snapshot.size;
    dayPercentEl.textContent = Math.round((total / 1440) * 100) + "%";

    drawChart(categories);
}

// CHART
function drawChart(categoryStats) {
    const ctx = document.getElementById("activityChart").getContext("2d");
    if (chart) chart.destroy();
    const labels = Object.keys(categoryStats);
    if (labels.length === 0) return;

    chart = new Chart(ctx, {
        type: "pie",
        data: {
            labels,
            datasets: [
                {
                    data: Object.values(categoryStats),
                    backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#6b7280"],
                    borderColor: "white",
                    borderWidth: 2,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: "white", font: { size: 14 } } },
            },
        },
    });
}

// NAV ACTIONS
function goToAddPage() {
    window.location.href = "./add-activity.html";
}
function logout() {
    auth.signOut().then(() => (window.location.href = "../index.html"));
}

// ================= AI MOOD ANALYSIS =================
function analyzeMood() {
    const user = auth.currentUser;
    if (!user) return alert("Please login first.");

    const currentDate = document.getElementById("dashDateText").textContent;

    db.collection("users")
        .doc(user.uid)
        .collection("activities")
        .where("date", "==", currentDate)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                showMood("😴 No activity today!", "Try adding at least one productive task to make your day meaningful!");
                return;
            }

            let total = 0;
            let categories = {};

            snapshot.forEach(doc => {
                const d = doc.data();
                total += d.minutes;
                if (!categories[d.category]) categories[d.category] = 0;
                categories[d.category] += d.minutes;
            });

            generateMood(categories);
        })
        .catch(() => showMood("⚠️ Error", "Couldn't analyze your mood today."));
}

// 🎯 Generate mood based on category usage
function generateMood(categories) {
    const maxCategory = Object.keys(categories).reduce((a, b) =>
        categories[a] > categories[b] ? a : b
    );

    let mood = "";
    let tip = "";

    switch (maxCategory) {
        case "Work":
            mood = "💼 Focused & Driven";
            tip = "Remember to take breaks to avoid burnout.";
            break;
        case "Leisure":
            mood = "🎉 Relaxed & Easygoing";
            tip = "Balance fun with some productive tasks!";
            break;
        case "Study":
            mood = "📚 Curious & Learning";
            tip = "Keep it up! Consistency makes progress.";
            break;
        case "Health":
            mood = "💪 Healthy & Active";
            tip = "Nice! Don't forget hydration and good sleep.";
            break;
        case "Sleep":
            mood = "😴 Restful & Recharged";
            tip = "Great sleep! Now use that energy wisely.";
            break;
        default:
            mood = "🙂 Balanced Day";
            tip = "Good job! Try focusing a bit on goals tomorrow.";
    }

    showMood(mood, tip);
}

// 📌 Show result in the UI
function showMood(mood, tip) {
    document.getElementById("aiResult").style.display = "block";
    document.getElementById("aiMoodText").textContent = mood;
    document.getElementById("aiTipText").textContent = tip;
    document.getElementById("aiResult").scrollIntoView({ behavior: "smooth" });
}

