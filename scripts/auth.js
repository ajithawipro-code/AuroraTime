// =============== AUTH + COMMON HELPERS ================= //

// Google login from LOGIN PAGE (index.html)
function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();

  firebase
    .auth()
    .signInWithPopup(provider)
    .then(() => {
      // ✅ AFTER LOGIN -> go to ADD ACTIVITY page
      window.location.href = "pages/add-activity.html";
    })
    .catch((error) => {
      alert("Login failed: " + error.message);
    });
}

// Logout (used in add-activity & dashboard)
function logout() {
  firebase
    .auth()
    .signOut()
    .then(() => {
      // from /pages/* go back to index at root
      window.location.href = "../index.html";
    })
    .catch((error) => {
      alert("Logout failed: " + error.message);
    });
}

// Protect inner pages (add-activity.html, dashboard.html)
function checkAuth() {
  firebase.auth().onAuthStateChanged((user) => {
    const path = window.location.pathname;
    const isLoginPage =
      path.endsWith("index.html") ||
      path === "/" ||
      path === "/index.html";

    // If NOT logged in & we are in /pages/* -> kick back to login
    if (!user && path.includes("/pages/")) {
      window.location.href = "../index.html";
    }

    // (Optional) If already logged in & still on index, send to Add Activity
    if (user && isLoginPage) {
      window.location.href = "pages/add-activity.html";
    }
  });
}
