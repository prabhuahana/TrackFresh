/* script_new.js - backup copy of the app logic */

/*
====================================================================
HOW THE APP WORKS - EXAM PSEUDOCODE:
====================================================================
INITIALIZATION:
    DISPLAY "FreshTrack"
    CALL applyTheme() function

MAIN PROGRAM LOOP:
    WHILE user is on page DO
        IF user adds food THEN
            CALL addFood() function
            CALL saveFoods() function
        ENDIF
        IF user views inventory THEN
            CALL getFoods() function
            DISPLAY food list
        ENDIF
        IF user clicks theme toggle THEN
            CALL toggleTheme() function
        ENDIF
    ENDWHILE
====================================================================
*/

/* FreshTrack app logic */

function getFoods() {
  return JSON.parse(localStorage.getItem("foods")) || [];
}

function saveFoods(foods) {
  localStorage.setItem("foods", JSON.stringify(foods));
}

function normalizeStoredFoodData() {
  const foods = getFoods();
  let changed = false;

  foods.forEach(function (food) {
    const nextEmoji = foodEmoji(food.name);
    if (food.emoji !== nextEmoji) {
      food.emoji = nextEmoji;
      changed = true;
    }
    if (!food.category) {
      food.category = guessCategory(food.name);
      changed = true;
    }
    if (!food.purchaseDate) {
      food.purchaseDate = todayStr();
      changed = true;
    }
  });

  if (changed) saveFoods(foods);
}

function getShoppingList() {
  return JSON.parse(localStorage.getItem("shoppingList")) || [];
}

function saveShoppingList(list) {
  localStorage.setItem("shoppingList", JSON.stringify(list));
}

function getDefaultProfile() {
  return {
    name: "", email: "", passwordHash: "",
    diet: "none", preferences: [],
    region: "NSW",
    notifications: false, rottingAlerts: true,
    theme: "light",
    customAccent: "", customPeach: "",
    pinnedSections: ["expiring", "rotting", "pantry", "meals", "seasonal"],
    pinnedTiles: ["inventory", "shopping", "recipes", "reminders"],
    points: 0,
    lastWeeklyAdd: null,
    streak: 0
  };
}

function getProfile() {
  const stored = JSON.parse(localStorage.getItem("profile"));
  return Object.assign(getDefaultProfile(), stored || {});
}

function saveProfile(profile) {
  localStorage.setItem("profile", JSON.stringify(profile));
}

function hashPassword(pw) {
  let h = 0;
  for (let i = 0; i < pw.length; i++) h = ((h << 5) - h + pw.charCodeAt(i)) | 0;
  return String(h);
}

/* ── Theme & Colours ── */

function applyTheme() {
  const p = getProfile();
  document.documentElement.setAttribute("data-theme", p.theme || "light");
  if (p.customAccent) document.documentElement.style.setProperty("--accent", p.customAccent);
  if (p.customPeach) document.documentElement.style.setProperty("--peach", p.customPeach);
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = p.theme === "dark" ? "Light mode" : "Dark mode";
  document.querySelectorAll(".theme-toggle").forEach(function (b) {
    if (b.classList.contains("theme-toggle-float") || b.classList.contains("theme-toggle-topbar")) {
      b.textContent = p.theme === "dark" ? "Light" : "Dark";
    } else {
      b.textContent = p.theme === "dark" ? "Light mode" : "Dark mode";
    }
  });
}

function toggleTheme() {
  const p = getProfile();
  p.theme = p.theme === "dark" ? "light" : "dark";
  saveProfile(p);
  applyTheme();
}

function applyCustomColors() {
  const p = getProfile();
  if (p.customAccent) document.documentElement.style.setProperty("--accent", p.customAccent);
  if (p.customPeach) document.documentElement.style.setProperty("--peach", p.customPeach);
}

/* ── Points ── */

function addPoints(amount, reason) {
  const p = getProfile();
  p.points = (p.points || 0) + amount;
  saveProfile(p);
  updatePointsDisplay();
}

function updatePointsDisplay() {
  const el = document.getElementById("pointsDisplay");
  if (el) el.textContent = getProfile().points || 0;
  const el2 = document.getElementById("pointsTotal");
  if (el2) el2.textContent = getProfile().points || 0;
}

/* ── Date helpers ── */

function daysLeft(date) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(date); expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

function daysSince(date) {
  if (!date) return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  return Math.floor((today - d) / (1000 * 60 * 60 * 24));
}

function expiryClass(days) {
  if (days <= 0) return "expiry-rotten";
  if (days <= 1) return "expiry-urgent";
  if (days <= 3) return "expiry-soon";
  return "expiry-ok";
}

function expiryLabel(days) {
  if (days < 0) return "Expired " + Math.abs(days) + " day(s) ago";
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return "Expires in " + days + " days";
}

/* ── Reminder urgency tiers ── */

function reminderPriority(days) {
  if (days <= 0) return "critical"; /* expiring immediately (or already expired) */
  if (days <= 2) return "high";     /* expiring within 2 days */
  if (days <= 7) return "medium";   /* expiring within a week */
  return "low";                     /* more than a week away */
}

function reminderTierLabel(priority) {
  const labels = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
  return labels[priority] || "Low";
}

function reminderTierClass(priority) {
  const classes = { critical: "expiry-rotten", high: "expiry-urgent", medium: "expiry-soon", low: "expiry-ok" };
  return classes[priority] || "expiry-ok";
}

function todayStr() { return new Date().toISOString().split("T")[0]; }

/* ── Food emoji ── */

function foodEmoji(name) {
  const n = (name || "").toLowerCase().trim();
  if (!n) return "F";
  const parts = n.split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map(function (part) {
    return part.charAt(0).toUpperCase();
  });
  return initials.join("") || "F";
}

function guessCategory(name) {
  var n = name.toLowerCase();
  var i;
  var dairyWords = ["milk", "cheese", "yogurt", "butter", "cream"];
  var meatWords = ["chicken", "beef", "pork", "fish", "meat", "salmon"];
  var produceWords = ["apple", "banana", "spinach", "tomato", "avocado", "berry", "lettuce", "carrot", "broccoli", "pumpkin", "onion", "garlic", "vegetable", "fruit", "potato"];
  var grainWords = ["rice", "pasta", "bread", "oats", "flour"];
  var beverageWords = ["juice", "water", "coffee", "tea"];
  var frozenWords = ["frozen", "ice"];
  for (i = 0; i < dairyWords.length; i = i + 1) {
    if (n.indexOf(dairyWords[i]) !== -1) return "dairy";
  }
  for (i = 0; i < meatWords.length; i = i + 1) {
    if (n.indexOf(meatWords[i]) !== -1) return "meat";
  }
  for (i = 0; i < produceWords.length; i = i + 1) {
    if (n.indexOf(produceWords[i]) !== -1) return "produce";
  }
  for (i = 0; i < grainWords.length; i = i + 1) {
    if (n.indexOf(grainWords[i]) !== -1) return "grains";
  }
  for (i = 0; i < beverageWords.length; i = i + 1) {
    if (n.indexOf(beverageWords[i]) !== -1) return "beverages";
  }
  for (i = 0; i < frozenWords.length; i = i + 1) {
    if (n.indexOf(frozenWords[i]) !== -1) return "frozen";
  }
  return "pantry";
}

/* ── Rotting detection ── */

function isRotting(food) {
  const days = daysLeft(food.expiry);
  if (days < 0) return true;
  const cat = food.category || "other";
  const shelf = SHELF_LIFE[cat] || 7;
  const age = daysSince(food.purchaseDate);
  if (age > shelf && days <= 1) return true;
  if (days === 0 && age > shelf * 0.8) return true;
  return false;
}

function getRottingFoods() {
  return getFoods().filter(isRotting);
}

/* ── Auth ── */

const MIN_PASSWORD_LENGTH = 6;

function setFieldError(input, message) {
  if (!input) return;
  input.classList.add("input-invalid");
  input.setAttribute("aria-invalid", "true");
  let error = input.nextElementSibling;
  if (!error || !error.classList.contains("field-error")) {
    error = document.createElement("p");
    error.className = "field-error";
    input.parentNode.insertBefore(error, input.nextSibling);
  }
  error.textContent = message;
}

function clearFieldError(input) {
  if (!input) return;
  input.classList.remove("input-invalid");
  input.removeAttribute("aria-invalid");
  const error = input.nextElementSibling;
  if (error && error.classList.contains("field-error")) error.remove();
}


/*
================================================================================
VALIDATION FUNCTIONS
These functions check user input without using complex regex patterns.
================================================================================
*/

// FUNCTION: strvalidation
// PURPOSE: Validates string inputs for names, emails, and passwords
function strvalidation(value, type) {
    var letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    
    if (type === "email") {
        var hasAt = false;
        var hasDot = false;
        var atPos = -1;
        var dotPos = -1;
        var i;
        
        for (i = 0; i < value.length; i = i + 1) {
            if (value.charAt(i) === "@") { hasAt = true; atPos = i; }
            if (value.charAt(i) === ".") { hasDot = true; dotPos = i; }
        }
        
        if (hasAt === true && hasDot === true && atPos > 0 && dotPos > atPos + 1) {
            return true;
        } else {
            return false;
        }
    }
    
    if (type === "name" || type === "password") {
        var hasLetter = false;
        var hasNumber = false;
        var i;
        
        for (i = 0; i < value.length; i = i + 1) {
            var char = value.charAt(i);
            if (type === "name") {
                if (letters.indexOf(char) !== -1 || char === "-" || char === "'" || char === " ") {
                    hasLetter = true;
                }
            } else {
                if (letters.indexOf(char) !== -1) { hasLetter = true; }
            }
            if (char >= "0" && char <= "9") { hasNumber = true; }
        }
        
        if (type === "password") {
            if (value.length >= 6 && hasLetter === true && hasNumber === true) {
                return true;
            } else {
                return false;
            }
        } else {
            return hasLetter;
        }
    }
    
    return true;
}

// FUNCTION: numvalidation
// PURPOSE: Validates numeric inputs for age, PIN, phone, etc.
function numvalidation(value, minval, maxval) {
    var num = parseInt(value, 10);
    if (isNaN(num)) { return false; }
    if (num < minval || num > maxval) { return false; }
    return true;
}


function validPassword(value) {
  return strvalidation(value, "password");
}

function login() {
  const email = document.querySelector('input[type="email"]');
  const password = document.querySelector('input[type="password"]');
  const profile = getProfile();
  let ok = true;

  if (!email.value.trim()) {
    setFieldError(email, "Email is required.");
    ok = false;
  } else if (strvalidation(email.value.trim(), "email") === false) {
    setFieldError(email, "Enter a valid email, e.g. you@example.com.");
    ok = false;
  } else {
    clearFieldError(email);
  }

  if (!password.value) {
    setFieldError(password, "Password is required.");
    ok = false;
  } else {
    clearFieldError(password);
  }
  if (!ok) return;

  if (profile.passwordHash && hashPassword(password.value) !== profile.passwordHash) {
    setFieldError(password, "Incorrect password. Try again.");
    return;
  }

  profile.email = email.value.trim();
  saveProfile(profile);
  window.location.href = "dashboard.html";
}

function signup() {
  const inputs = document.querySelectorAll(".login-card input");
  const nameInput = inputs[0];
  const emailInput = inputs[1];
  const passwordInput = inputs[2];
  const confirmInput = inputs[3];
  const name = nameInput ? nameInput.value.trim() : "";
  const email = emailInput ? emailInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value : "";
  const confirm = confirmInput ? confirmInput.value : "";
  let ok = true;

  if (!name) { setFieldError(nameInput, "Please enter your name."); ok = false; }
  else clearFieldError(nameInput);

  if (!email) { setFieldError(emailInput, "Email is required."); ok = false; }
  else if (strvalidation(email, "email") === false) { setFieldError(emailInput, "Enter a valid email, e.g. you@example.com."); ok = false; }
  else clearFieldError(emailInput);

  if (!password) { setFieldError(passwordInput, "Password is required."); ok = false; }
  else if (!validPassword(password)) { setFieldError(passwordInput, "Password needs " + MIN_PASSWORD_LENGTH + "+ characters, with at least a letter and a number."); ok = false; }
  else clearFieldError(passwordInput);

  if (!confirm) { setFieldError(confirmInput, "Please confirm your password."); ok = false; }
  else if (confirm !== password) { setFieldError(confirmInput, "Passwords do not match."); ok = false; }
  else clearFieldError(confirmInput);

  if (!ok) return;

  const profile = getProfile();
  profile.name = name;
  profile.email = email;
  profile.passwordHash = hashPassword(password);
  saveProfile(profile);
  addPoints(POINTS_RULES.addFood, "Welcome bonus");
  window.location.href = "profile.html";
}

/* clear a field's error as soon as the user starts fixing it */
(function wireAuthErrorClearing() {
  function wire() {
    document.querySelectorAll(".login-card input").forEach(function (input) {
      input.addEventListener("input", function () { clearFieldError(input); });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();

function changePassword() {
  const current = document.getElementById("currentPassword");
  const newPw = document.getElementById("newPassword");
  const confirm = document.getElementById("confirmPassword");
  if (!current || !newPw || !confirm) return;

  const profile = getProfile();
  if (profile.passwordHash && hashPassword(current.value) !== profile.passwordHash) {
    alert("Current password is incorrect."); return;
  }
  if (newPw.value !== confirm.value) { alert("New passwords do not match."); return; }
  if (!validPassword(newPw.value)) { alert("Password needs " + MIN_PASSWORD_LENGTH + "+ characters, with at least a letter and a number."); return; }

  profile.passwordHash = hashPassword(newPw.value);
  saveProfile(profile);
  alert("Password updated.");
  current.value = ""; newPw.value = ""; confirm.value = "";
}

/* ── Nav ── */

function highlightNav() {
  const page = window.location.pathname.split("/").pop();
  document.querySelectorAll("nav a, .profile-link").forEach(function (link) {
    if (link.getAttribute("href") === page) link.classList.add("active");
  });
}

/* ── Quantity check ── */

function checkQuantity(name, quantity, unit) {
  name = name.toLowerCase();
  if (unit === "kg" && quantity > 20) return "Are you sure you have " + quantity + "kg of " + name + "?";
  if (unit === "g" && quantity > 5000) return "Are you sure you have " + quantity + "g of " + name + "?";
  if (unit === "ml" && quantity > 5000) return "Are you sure you have " + quantity + "mL of " + name + "?";
  if (unit === "L" && quantity > 10) return "Are you sure you have " + quantity + "L of " + name + "?";
  if (unit === "pieces" && quantity > 100) return "Are you sure you have " + quantity + " pieces of " + name + "?";
  return null;
}

/* ── Food CRUD ── */

function addFood() {
  const name = document.getElementById("foodName").value.trim();
  const expiry = document.getElementById("expiryDate").value;
  const quantity = Number(document.getElementById("quantity").value);
  const unit = document.getElementById("unit").value;
  const favourite = document.getElementById("favouriteCheck") ? document.getElementById("favouriteCheck").checked : false;
  const category = document.getElementById("foodCategory") ? document.getElementById("foodCategory").value : guessCategory(name);
  const purchaseDate = document.getElementById("purchaseDate") ? document.getElementById("purchaseDate").value : todayStr();

  if (!name || !expiry || isNaN(quantity)) { alert("Please complete all fields"); return; }

  const warning = checkQuantity(name, quantity, unit);
  if (warning && !confirm(warning)) return;

  const foods = getFoods();
  foods.push({ name, expiry, quantity, unit, favourite, category, purchaseDate, emoji: foodEmoji(name) });
  saveFoods(foods);
  addPoints(POINTS_RULES.addFood, "Added " + name);

  document.getElementById("foodName").value = "";
  document.getElementById("expiryDate").value = "";
  document.getElementById("quantity").value = "";
  if (document.getElementById("favouriteCheck")) document.getElementById("favouriteCheck").checked = false;
  if (document.getElementById("purchaseDate")) document.getElementById("purchaseDate").value = todayStr();

  refreshFoodViews();
  checkReminders();
}

function removeFood(index) {
  const foods = getFoods();
  foods.splice(index, 1);
  saveFoods(foods);
  refreshFoodViews();
}

function toggleFavourite(index) {
  const foods = getFoods();
  foods[index].favourite = !foods[index].favourite;
  saveFoods(foods);
  displayFood();
  loadStaples();
}

function markUsed(index) {
  const foods = getFoods();
  const item = foods[index];
  if (!item) return;
  const days = daysLeft(item.expiry);
  if (days >= 0) addPoints(POINTS_RULES.useBeforeExpiry, "Used " + item.name + " before expiry");
  else addPoints(POINTS_RULES.preventWaste, "Removed expired " + item.name);
  foods.splice(index, 1);
  saveFoods(foods);
  refreshFoodViews();
}

function addToShoppingFromPantry(index) {
  const item = getFoods()[index];
  if (!item) return;
  const list = getShoppingList();
  if (!list.some(function (s) { return s.name.toLowerCase() === item.name.toLowerCase(); })) {
    list.push({ name: item.name, checked: false, fromFavourite: false });
    saveShoppingList(list);
  }
  alert(item.name + " added to shopping list.");
}

function refreshFoodViews() {
  displayFood();
  loadDashboard();
  loadMealButtons();
  loadRemindersPage();
  loadRottingSection();
}

/* ── Inventory display ── */

function displayFood() {
  const foodList = document.getElementById("foodList");
  if (!foodList) return;

  const foods = getFoods().slice().sort(function (a, b) { return daysLeft(a.expiry) - daysLeft(b.expiry); });
  foodList.innerHTML = "";

  if (foods.length === 0) {
    foodList.innerHTML = '<p class="empty-state">No items added yet.</p>';
    return;
  }

  foods.forEach(function (food) {
    const idx = getFoods().indexOf(food);
    const days = daysLeft(food.expiry);
    const rotten = isRotting(food);
    const div = document.createElement("div");
    div.className = "food" + (rotten ? " rotten" : days <= 3 ? " urgent" : "");

    div.innerHTML =
      '<div class="food-info">' +
        '<span class="food-emoji">' + (food.emoji || foodEmoji(food.name)) + '</span>' +
        '<div><h3>' + food.name +
          ' <button class="favourite-star' + (food.favourite ? " active" : "") +
          '" onclick="toggleFavourite(' + idx + ')" title="Favourite">' +
          (food.favourite ? "★" : "☆") + '</button></h3>' +
        '<p>Quantity: ' + food.quantity + food.unit + ' · ' + (food.category || "other") + '</p>' +
        '<p class="' + expiryClass(days) + '">' + expiryLabel(days) +
          (rotten ? ' · <strong>May be spoiling</strong>' : '') + '</p></div>' +
      '</div>' +
      '<div class="food-actions">' +
        '<button class="btn-small btn-outline" onclick="markUsed(' + idx + ')">Used it</button>' +
        '<button class="btn-small" onclick="addToShoppingFromPantry(' + idx + ')">+ Shop</button>' +
        '<button class="btn-small btn-danger" onclick="removeFood(' + idx + ')">Remove</button>' +
      '</div>';
    foodList.appendChild(div);
  });
}

/* ── Dashboard ── */

function loadDashboard() {
  if (document.getElementById("expiryList") || document.getElementById("fridgeCarousel")) {
    loadHomeExpiry();
    loadFridgeCarousel();
    updatePointsDisplay();
    return;
  }
  if (!document.getElementById("dashboardFood")) return;

  loadRottingSection();
  loadPantrySection();
  loadMealButtons();
  loadSeasonalTip();
  updatePointsDisplay();
}

/* ── Home screen (mobile mockup) renders ── */

function dashExpiryTier(days) {
  if (days <= 2) return "critical"; /* within 2 days */
  if (days <= 7) return "medium";   /* around a week */
  return "low";                     /* 3+ weeks / later */
}

function dashExpiryLabel(days) {
  if (days < 0) return Math.abs(days) + "d overdue";
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return days + " days";
}

function formatExpiryDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr || "";
  const day = d.getDate();
  const suffix = (day % 10 === 1 && day !== 11) ? "st"
    : (day % 10 === 2 && day !== 12) ? "nd"
    : (day % 10 === 3 && day !== 13) ? "rd" : "th";
  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  return day + suffix + " " + months[d.getMonth()] + " " + String(d.getFullYear()).slice(2);
}

function loadHomeExpiry() {
  const wrap = document.getElementById("expiryList");
  if (!wrap) return;
  const foods = getFoods().slice().sort(function (a, b) { return daysLeft(a.expiry) - daysLeft(b.expiry); });
  wrap.innerHTML = "";
  if (!foods.length) {
    wrap.innerHTML = '<p class="empty-state">No items tracked yet.</p>';
    return;
  }
  foods.slice(0, 5).forEach(function (food) {
    const days = daysLeft(food.expiry);
    const tier = dashExpiryTier(days);
    const row = document.createElement("div");
    row.className = "expiry-row";
    row.innerHTML =
      '<span class="expiry-dot exp-dot-' + tier + '" aria-hidden="true"></span>' +
      '<strong class="expiry-name">' + food.name + '</strong>' +
      '<span class="exp-pill exp-' + tier + '">' + dashExpiryLabel(days) + '</span>';
    wrap.appendChild(row);
  });
}

function loadFridgeCarousel() {
  const wrap = document.getElementById("fridgeCarousel");
  if (!wrap) return;
  const foods = getFoods();
  wrap.innerHTML = "";
  if (!foods.length) {
    wrap.innerHTML = '<p class="empty-state">Your fridge is empty.</p>';
    return;
  }
  foods.forEach(function (food) {
    const card = document.createElement("a");
    card.className = "fridge-card";
    card.href = "inventory.html";
    const qty = food.quantity || 1;
    card.innerHTML =
      '<div class="fridge-thumb"><span>' + (food.emoji || foodEmoji(food.name)) + '</span></div>' +
      '<p class="fridge-name">' + food.name + '</p>' +
      '<p class="fridge-sub">' + qty + ' | ' + formatExpiryDate(food.expiry) + '</p>';
    wrap.appendChild(card);
  });
}

function toggleUserMenu(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById("userMenu");
  if (menu) menu.classList.toggle("open");
}

function logoutUser() {
  window.location.href = "index.html";
}

/* close the avatar dropdown when tapping anywhere else */
document.addEventListener("click", function (event) {
  const menu = document.getElementById("userMenu");
  if (menu && menu.classList.contains("open") && !event.target.closest(".user-menu-wrap")) {
    menu.classList.remove("open");
  }
});

function loadRottingSection() {
  const el = document.getElementById("rottingFood");
  const badge = document.getElementById("rottingBadge");
  if (!el) return;

  const rotten = getRottingFoods();
  if (badge) badge.textContent = rotten.length;
  el.innerHTML = "";

  if (rotten.length === 0) {
    el.innerHTML = '<p class="empty-state">No signs of spoiling food. Looking good!</p>';
    return;
  }

  rotten.forEach(function (food) {
    const idx = getFoods().indexOf(food);
    const div = document.createElement("div");
    div.className = "food rotten";
    div.innerHTML =
      '<div class="food-info">' +
        '<span class="food-emoji">' + (food.emoji || foodEmoji(food.name)) + '</span>' +
        '<div><h3>' + food.name + '</h3>' +
        '<p class="expiry-rotten">' + expiryLabel(daysLeft(food.expiry)) + ' — check before eating</p></div>' +
      '</div>' +
      '<div class="food-actions">' +
        '<button class="btn-small btn-outline" onclick="markUsed(' + idx + ')">Discarded</button>' +
        '<a class="btn btn-small btn-peach" href="recipes.html">Use in recipe</a>' +
      '</div>';
    el.appendChild(div);
  });
}

function loadPantrySection() {
  const dashboardFood = document.getElementById("dashboardFood");
  const expiringFood = document.getElementById("expiringFood");
  const expiringBadge = document.getElementById("expiringBadge");
  if (!dashboardFood) return;

  const foods = getFoods().slice().sort(function (a, b) { return daysLeft(a.expiry) - daysLeft(b.expiry); });
  dashboardFood.innerHTML = "";
  if (expiringFood) expiringFood.innerHTML = "";

  if (foods.length === 0) {
    dashboardFood.innerHTML = '<p class="empty-state">Your pantry is empty. Add food in Inventory.</p>';
    if (expiringFood) expiringFood.innerHTML = '<p class="empty-state">No items expiring soon.</p>';
    if (expiringBadge) expiringBadge.textContent = "0";
    return;
  }

  const soon = foods.filter(function (f) { return daysLeft(f.expiry) <= 3 && daysLeft(f.expiry) >= 0; });
  if (expiringBadge) expiringBadge.textContent = soon.length;

  if (expiringFood) {
    if (soon.length === 0) {
      expiringFood.innerHTML = '<p class="empty-state">No items expiring soon. Nice work!</p>';
    } else {
      soon.forEach(function (food) {
        const idx = getFoods().indexOf(food);
        const days = daysLeft(food.expiry);
        const div = document.createElement("div");
        div.className = "food urgent";
        div.innerHTML =
          '<div class="food-info">' +
            '<span class="food-emoji">' + (food.emoji || foodEmoji(food.name)) + '</span>' +
            '<div><h3>' + food.name + '</h3>' +
            '<p class="' + expiryClass(days) + '">' + expiryLabel(days) + '</p>' +
            '<p>Quantity: ' + food.quantity + food.unit + '</p></div>' +
          '</div>' +
          '<div class="food-actions">' +
            '<button class="btn-small btn-outline" onclick="markUsed(' + idx + ')">Used it</button>' +
            '<button class="btn-small" onclick="addToShoppingFromPantry(' + idx + ')">+ Shop</button>' +
            '<a class="btn btn-small btn-peach" href="recipes.html">Find recipe</a>' +
          '</div>';
        expiringFood.appendChild(div);
      });
    }
  }

  foods.forEach(function (food) {
    const days = daysLeft(food.expiry);
    const div = document.createElement("div");
    div.className = "food";
    div.innerHTML =
      '<div class="food-info">' +
        '<span class="food-emoji">' + (food.emoji || foodEmoji(food.name)) + '</span>' +
        '<div><h3>' + food.name + '</h3>' +
        '<p>Quantity: ' + food.quantity + food.unit + '</p>' +
        '<p class="' + expiryClass(days) + '">' + expiryLabel(days) + '</p></div>' +
      '</div>';
    dashboardFood.appendChild(div);
  });
}

function loadSeasonalTip() {
  const el = document.getElementById("seasonText");
  if (!el) return;
  const tips = [
    "Summer: stone fruit, berries, zucchini, and tomatoes are in season.",
    "Summer: stone fruit, berries, zucchini, and tomatoes are in season.",
    "Autumn: apples, pears, pumpkin, and sweet potato are at their best.",
    "Autumn: apples, pears, pumpkin, and sweet potato are at their best.",
    "Autumn: apples, pears, pumpkin, and sweet potato are at their best.",
    "Winter: citrus, broccoli, cauliflower, and root vegetables shine.",
    "Winter: citrus, broccoli, cauliflower, and root vegetables shine.",
    "Winter: citrus, broccoli, cauliflower, and root vegetables shine.",
    "Spring: asparagus, peas, strawberries, and leafy greens are fresh.",
    "Spring: asparagus, peas, strawberries, and leafy greens are fresh.",
    "Spring: asparagus, peas, strawberries, and leafy greens are fresh.",
    "Summer: stone fruit, berries, zucchini, and tomatoes are in season."
  ];
  el.textContent = tips[new Date().getMonth()];
}

/* ── Recipes ── */

function getMatchingRecipes() {
  const foods = getFoods();
  const profile = getProfile();
  const pantry = foods.map(function (f) { return f.name.toLowerCase(); });
  const expiring = foods.filter(function (f) { return daysLeft(f.expiry) <= 3; }).map(function (f) { return f.name.toLowerCase(); });

  return RECIPES.map(function (recipe) {
    const matched = recipe.ingredients.filter(function (ing) {
      return pantry.some(function (p) { return p.includes(ing) || ing.includes(p); });
    });
    const expiringMatch = recipe.ingredients.some(function (ing) {
      return expiring.some(function (e) { return e.includes(ing) || ing.includes(e); });
    });
    const dietOk = recipe.diet.includes(profile.diet) || profile.diet === "none";
    const alt = getRecipeAlternative(recipe, profile);
    return {
      recipe: recipe, alt: alt,
      matchCount: matched.length,
      totalIngredients: recipe.ingredients.length,
      expiringMatch: expiringMatch,
      dietOk: dietOk,
      canMake: matched.length >= recipe.ingredients.length - 1 && dietOk
    };
  }).sort(function (a, b) {
    if (a.expiringMatch !== b.expiringMatch) return b.expiringMatch - a.expiringMatch;
    return b.matchCount - a.matchCount;
  });
}

function getRecipeAlternative(recipe, profile) {
  if (!recipe.alternatives) return null;
  const diet = profile.diet;
  if (recipe.alternatives[diet]) return recipe.alternatives[diet];
  for (let i = 0; i < profile.preferences.length; i++) {
    const pref = profile.preferences[i];
    if (recipe.alternatives[pref]) return recipe.alternatives[pref];
  }
  return null;
}

function loadMealButtons() {
  const container = document.getElementById("mealButtons");
  if (!container) return;
  const matches = getMatchingRecipes();
  container.innerHTML = "";

  if (getFoods().length === 0) {
    container.innerHTML = '<p class="empty-state">Add ingredients to get meal ideas.</p>';
    return;
  }

  matches.slice(0, 4).forEach(function (m) {
    const btn = document.createElement("button");
    btn.className = "meal-btn" + (m.canMake ? "" : " disabled");
    btn.textContent = (m.alt ? m.alt.name : m.recipe.name) + (m.expiringMatch ? " ⚡" : "");
    btn.onclick = function () { window.location.href = "recipes.html"; };
    container.appendChild(btn);
  });
}

function loadRecipesPage() {
  const container = document.getElementById("recipeList");
  if (!container) return;

  const matches = getMatchingRecipes();
  const profile = getProfile();
  container.innerHTML = "";

  if (profile.diet !== "none") {
    const note = document.createElement("p");
    note.textContent = "Filtered for " + profile.diet + " diet. Alternatives shown where available.";
    note.style.cssText = "color:var(--text-muted);font-size:14px;";
    container.appendChild(note);
  }

  matches.slice(0, 2).forEach(function (m) {
    const r = m.recipe;
    const missing = r.ingredients.filter(function (ing) {
      const pantry = getFoods().map(function (f) { return f.name.toLowerCase(); });
      return !pantry.some(function (p) { return p.includes(ing) || ing.includes(p); });
    });

    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML =
      '<div class="recipe-card-header">' +
        '<img class="recipe-img" src="' + r.image + '" alt="' + r.name + '" onerror="this.src=defaultImage">' +
        '<div><h4><span class="recipe-icon">' + (r.emoji || 'R') + '</span> ' + (m.alt ? m.alt.name : r.name) +
          (m.expiringMatch ? ' <span class="badge">Uses expiring items</span>' : "") +
          (!m.dietOk ? ' <span class="badge">Diet swap available</span>' : "") +
        '</h4>' +
        (m.alt ? '<p class="alt-note">↪ ' + m.alt.swap + '</p>' : '') +
        '<p>' + r.description + '</p>' +
        '<p>⏱ ' + r.time + ' · ' + m.matchCount + '/' + m.totalIngredients + ' ingredients</p></div>' +
      '</div>' +
      (missing.length > 0
        ? '<p>Missing: ' + missing.join(", ") + '</p>'
        : '<p style="color:var(--accent-dark);font-weight:600;">You have everything!</p>') +
      '<div class="recipe-tags">' + r.ingredients.map(function (i) { return '<span class="tag">' + i + '</span>'; }).join("") + '</div>' +
      '<details style="margin-top:12px;"><summary style="cursor:pointer;color:var(--accent-dark);">Instructions</summary>' +
        '<pre style="white-space:pre-wrap;font-family:inherit;color:var(--text-muted);font-size:14px;">' + r.steps + '</pre></details>' +
      '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button class="btn-small" onclick="addRecipeToShopping(\'' + r.name + '\')">Add missing to list</button>' +
        '<button class="btn-small btn-peach" onclick="markRecipeCooked(\'' + r.name.replace(/'/g, "\\'") + '\', this)">Mark as cooked</button>' +
      '</div>';
    container.appendChild(card);
  });
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) {
    throw new Error("The recipe service is not responding. Start the app with npm start and open http://localhost:3000.");
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error("The recipe service returned an invalid response. Please try again.");
  }
}

/* === Groq AI recipe suggester ===
   Uses the Groq API (no regional blocks) to generate recipe ideas from
   your on-hand inventory. Get a key at https://console.groq.com.
*/
const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

let _aiRunning = false;

async function generateAiRecipes() {
  const button = document.getElementById("aiRecipeButton");
  const status = document.getElementById("aiRecipeStatus");
  const container = document.getElementById("aiRecipeList");
  if (!button || !status || !container) return;
  if (_aiRunning) return;

  const inventory = getFoods().map(function (food) {
    return food.name + (food.quantity ? " (" + food.quantity + (food.unit ? " " + food.unit : "") + ")" : "");
  });
  if (inventory.length === 0) {
    status.textContent = "Add groceries in Inventory first.";
    return;
  }
  if (GROQ_API_KEY === "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") {
    status.textContent = "Paste your Groq API key into the script to unlock AI recipes.";
    return;
  }

  _aiRunning = true;
  button.disabled = true;
  button.textContent = "Searching for recipes...";
  status.textContent = "Finding recipes from your groceries...";
  container.innerHTML = "";

  const controller = new AbortController();
  const timeoutId = setTimeout(function() { controller.abort(); }, 30000);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + GROQ_API_KEY
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        max_tokens: 800,
        messages: [
          {
            role: "system",
            content: "You are a chef. Return ONLY a valid JSON object with a \"recipes\" key containing an array of 2 recipes. No markdown, no backticks. Each recipe: {\"name\":\"string\",\"description\":\"string\",\"time\":\"string\",\"ingredientsUsed\":[\"string\"]}."
          },
          {
            role: "user",
            content: "Here are my current ingredients: " + inventory.join(", ")
          }
        ],
      })
    });

    const rawText = await response.text();

    if (!response.ok) {
      let errorData = {};
      try { errorData = JSON.parse(rawText); } catch (_) { /* not JSON */ }
      console.error("Groq API Error Status:", response.status, errorData, rawText);
      const apiMessage = (errorData.error && errorData.error.message) || "";
      throw new Error(apiMessage || "Groq request failed (HTTP " + response.status + ").");
    }

    let data;
    try { data = JSON.parse(rawText); }
    catch (e) {
      console.error("Could not parse Groq JSON body:", rawText);
      throw new Error("Groq returned an unexpected reply. Please try again.");
    }

    const rawContent = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";
    console.log("Raw Groq content:", rawContent);
    let wrapper = {};
    try {
      wrapper = JSON.parse(rawContent);
    } catch (e) {
      if (typeof rawContent === "object" && rawContent !== null) { wrapper = rawContent; console.log("Content was already an object, using it directly."); } else { console.error("Could not parse Groq content:", rawContent); throw new Error("Groq returned an invalid response. Please try again."); }
    }

    let recipes = Array.isArray(wrapper) ? wrapper : (wrapper.recipes || []);
    if (!Array.isArray(recipes) || recipes.length === 0) {
      throw new Error("Groq did not return any recipes. Please try again.");
    }

    // Simple helper: pick a food photo based on the recipe name
    // Uses clear if/else so it's easy to read and add more categories
    function getRecipeImage(recipeName) {
      var title = recipeName.toLowerCase();

      if (title.includes("shake") || title.includes("smoothie") || title.includes("drink")) {
        return "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&auto=format&fit=crop&q=80";
      } else if (title.includes("pasta") || title.includes("spaghetti") || title.includes("mac")) {
        return "https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=400&auto=format&fit=crop&q=80";
      } else if (title.includes("salad")) {
        return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop&q=80";
      } else if (title.includes("soup") || title.includes("stew")) {
        return "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&auto=format&fit=crop&q=80";
      } else if (title.includes("burger") || title.includes("sandwich")) {
        return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80";
      } else if (title.includes("pizza")) {
        return "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80";
      } else if (title.includes("curry")) {
        return "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&auto=format&fit=crop&q=80";
      } else if (title.includes("taco") || title.includes("burrito")) {
        return "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&auto=format&fit=crop&q=80";
      } else if (title.includes("breakfast") || title.includes("pancake") || title.includes("eggs")) {
        return "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&auto=format&fit=crop&q=80";
      } else if (title.includes("dessert") || title.includes("cake") || title.includes("sweet")) {
        return "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&auto=format&fit=crop&q=80";
      } else {
        // Default food image if no keywords match
        return "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&auto=format&fit=crop&q=80";
      }
    }

    // Default image used if an Unsplash URL fails to load
    var defaultImage = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&auto=format&fit=crop&q=80";

    recipes.slice(0, 6).forEach(function (recipe, idx) {
      var card = document.createElement("article");
      card.className = "recipe-card ai-recipe-card";

      var cleanTitle = encodeURIComponent((recipe.name || "recipe").trim() + " recipe");
      var recipeLink = "https://www.google.com/search?q=" + cleanTitle;
      var savedKey = "ai_saved_" + idx;
      var isSaved = localStorage.getItem(savedKey) === "1";
      var imgUrl = getRecipeImage(recipe.name);

      card.innerHTML =
        '<div class="ai-card-inner">' +
          '<div class="ai-card-body">' +
            '<h4 class="ai-card-title"><a href="' + recipeLink + '" target="_blank" rel="noopener noreferrer">' + (recipe.name || "Untitled recipe") + '</a></h4>' +
            '<p class="ai-card-desc">' + (recipe.description || "") + '</p>' +
            '<div class="ai-card-meta">' +
              '<span class="ai-meta-tag">⌟ ' + (recipe.time || "—") + '</span>' +
              '<span class="ai-meta-tag">🥗 ' + (recipe.ingredientsUsed || recipe.ingredients || []).slice(0, 3).join(", ") + '</span>' +
            '</div>' +
            '<div class="ai-card-actions">' +
              '<a href="' + recipeLink + '" target="_blank" rel="noopener noreferrer" class="btn btn-small">View Recipe ↑</a>' +
              '<button class="ai-heart-btn' + (isSaved ? " saved" : "") + '" data-idx="' + idx + '" title="Save recipe">' +
                (isSaved ? "♥" : "♡") +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div class="ai-card-thumb-wrap">' +
            '<img class="ai-card-thumb" src="' + imgUrl + '" alt="' + (recipe.name || "recipe") + '" onerror="this.src=defaultImage" >' +
          '</div>' +
        '</div>' +
        '<span class="ai-recipe-badge">✨ AI</span>';

      card.querySelector(".ai-heart-btn").addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        var k = "ai_saved_" + this.dataset.idx;
        var now = localStorage.getItem(k) === "1";
        if (now) { localStorage.removeItem(k); this.textContent = "♡"; this.classList.remove("saved"); }
        else      { localStorage.setItem(k, "1");  this.textContent = "♥"; this.classList.add("saved"); }
      });

      container.appendChild(card);
    });

    status.textContent = "Found " + recipes.length + " recipe" + (recipes.length > 1 ? "s" : "") + " from your groceries.";
  } catch (error) {
    if (error.name === "AbortError") {
      status.textContent = "Request timed out after 30 seconds. Please try again.";
    } else if (error.name === "TypeError") {
      status.textContent = "Could not reach Groq (network or CORS blocked the request).";
    } else {
      status.textContent = error.message || "Something went wrong while finding recipes.";
    }
  } finally {
    clearTimeout(timeoutId);
    _aiRunning = false;
    button.disabled = false;
    button.textContent = "Get AI recipe ideas";
  }
}

/* ── Seasonal + Favourites ── */
var SEASONAL_RECIPES = [
  {name:"Pumpkin Soup",description:"A warming autumn classic — silky smooth and full of flavour.",time:"35 min",ingredientsUsed:["pumpkin","onion","garlic","vegetable stock","cream"],url:"https://www.bbcgoodfood.com/recipes/pumpkin-soup"},
  {name:"Slow Cooker Beef Stew",description:"Hearty winter comfort food. Layer vegetables and beef, come home to dinner.",time:"6–8 hrs",ingredientsUsed:["beef chuck","carrots","potatoes","onion","beef stock"],url:"https://www.bbcgoodfood.com/recipes/slow-cooker-beef-stew"},
  {name:"Spring Vegetable Risotto",description:"Fresh asparagus and peas make this creamy risotto sing.",time:"40 min",ingredientsUsed:["arborio rice","peas","asparagus","white wine","parmesan"],url:"https://www.bbcgoodfood.com/recipes/risotto-primavera"},
  {name:"Summer Berry Pavlova",description:"Light, fluffy meringue topped with fresh cream and seasonal berries.",time:"1 hr 20 min",ingredientsUsed:["egg whites","caster sugar","double cream","strawberries","raspberries"],url:"https://www.bbcgoodfood.com/recipes/berry-pavlova"}
];

function renderSeasonalRecipes() {
  var c = document.getElementById("seasonalList");
  if (!c) return;
  c.innerHTML = "";
  SEASONAL_RECIPES.forEach(function(r, i) { c.appendChild(buildRecipeCard(r, i)); });
}

function getFavorites() {
  try { return JSON.parse(localStorage.getItem("favRecipes") || "[]"); }
  catch (e) { return []; }
}

function saveFavorites(list) { localStorage.setItem("favRecipes", JSON.stringify(list)); }

function toggleFavorite(recipe) {
  var favs = getFavorites();
  var idx = favs.findIndex(function(f) { return f.name === recipe.name; });
  if (idx !== -1) { favs.splice(idx, 1); }
  else { favs.push(recipe); }
  saveFavorites(favs);
  return idx === -1;
}

function buildRecipeCard(recipe, idx) {
  var card = document.createElement("article");
  card.className = "recipe-card ai-recipe-card";
  var cleanTitle = encodeURIComponent((recipe.name || "recipe").trim() + " recipe");
  var recipeLink = recipe.url || ("https://www.google.com/search?q=" + cleanTitle);
  var defaultImage = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&auto=format&fit=crop&q=80";
  var favs = getFavorites();
  var isSaved = favs.some(function(f) { return f.name === recipe.name; });
  card.innerHTML =
    '<div class="ai-card-inner"><div class="ai-card-body">' +
    '<h4 class="ai-card-title"><a href="' + recipeLink + '" target="_blank" rel="noopener noreferrer">' + (recipe.name || "Untitled recipe") + '</a></h4>' +
    '<p class="ai-card-desc">' + (recipe.description || "") + '</p>' +
    '<div class="ai-card-meta"><span class="ai-meta-tag">' + (recipe.time || "—") + '</span></div>' +
    '<div class="ai-card-actions">' +
    '<a href="' + recipeLink + '" target="_blank" rel="noopener noreferrer" class="btn btn-small">View Recipe</a>' +
    '<button class="ai-heart-btn' + (isSaved ? " saved" : "") + '" data-recipe="' + encodeURIComponent(JSON.stringify(recipe)) + '">' + (isSaved ? "\u2665" : "\u2661") + '</button>' +
    '</div></div>' +
    '<div class="ai-card-thumb-wrap"><img class="ai-card-thumb" src="' + (recipe.imageUrl || defaultImage) + '" alt="' + (recipe.name || "recipe") + '" onerror="this.src=defaultImage"></div></div>' +
    '<span class="ai-recipe-badge">' + (recipe.badge || "Seasonal") + '</span>';
  return card;
}

function loadFavorites() {
  var c = document.getElementById("favoritesList");
  if (!c) return;
  c.innerHTML = "";
  var favs = getFavorites();
  if (favs.length === 0) { c.innerHTML = '<p class="empty-state">No favourites saved yet! Click the heart on any recipe to save it here.</p>'; return; }
  favs.forEach(function(r) { c.appendChild(buildRecipeCard(r, -1)); });
}

document.addEventListener("click", function(e) {
  var btn = e.target.closest(".ai-heart-btn");
  if (!btn) return;
  e.preventDefault();
  var recipeData = btn.getAttribute("data-recipe");
  if (!recipeData) return;
  var recipe;
  try { recipe = JSON.parse(decodeURIComponent(recipeData)); }
  catch (err) { return; }
  var saved = toggleFavorite(recipe);
  btn.textContent = saved ? "\u2665" : "\u2661";
  btn.classList.toggle("saved", saved);
});

function addRecipeToShopping(recipeName) {
  const recipe = RECIPES.find(function (r) { return r.name === recipeName; });
  if (!recipe) return;
  const pantry = getFoods().map(function (f) { return f.name.toLowerCase(); });
  const list = getShoppingList();
  recipe.ingredients.forEach(function (ing) {
    const have = pantry.some(function (p) { return p.includes(ing) || ing.includes(p); });
    /* always append missing ingredients, even if the same name is already on the list */
    if (!have) {
      list.push({ name: ing.charAt(0).toUpperCase() + ing.slice(1), checked: false, fromFavourite: false });
    }
  });
  saveShoppingList(list);
  alert("Missing ingredients added to shopping list.");
}

function markRecipeCooked(recipeName, btn) {
  addPoints(POINTS_RULES.addRecipe, "Cooked " + recipeName);
  const card = btn && btn.closest ? btn.closest(".recipe-card") : null;
  if (!card) {
    alert("Nice! +" + POINTS_RULES.addRecipe + " points for cooking.");
    return;
  }
  card.remove();
  const container = document.getElementById("recipeList");
  if (container && !container.querySelector(".recipe-card")) {
    const done = document.createElement("p");
    done.className = "empty-state";
    done.textContent = "You've cooked everything here — nice! 🎉";
    container.appendChild(done);
  }
}

/* ── Shopping ── */

function addShoppingItem() {
  const input = document.getElementById("shopItem");
  const name = input.value.trim();
  if (!name) return;
  const list = getShoppingList();
  list.push({ name: name, checked: false, fromFavourite: false });
  saveShoppingList(list);
  input.value = "";
  displayShoppingList();
  loadPriceCompare();
}

function toggleShopItem(index) {
  const list = getShoppingList();
  list[index].checked = !list[index].checked;
  saveShoppingList(list);
  displayShoppingList();
}

function removeShopItem(index) {
  const list = getShoppingList();
  list.splice(index, 1);
  saveShoppingList(list);
  displayShoppingList();
  loadPriceCompare();
}

function clearCheckedItems() {
  saveShoppingList(getShoppingList().filter(function (i) { return !i.checked; }));
  displayShoppingList();
}

function addStapleToList(name) {
  const list = getShoppingList();
  if (!list.some(function (s) { return s.name.toLowerCase() === name.toLowerCase(); })) {
    list.push({ name: name, checked: false, fromFavourite: true });
    saveShoppingList(list);
  }
  displayShoppingList();
}

function addAllStaples() {
  getFoods().filter(function (f) { return f.favourite; }).forEach(function (f) { addStapleToList(f.name); });
  addPoints(10, "Added weekly staples");
}

function autoWeeklyStaples() {
  const profile = getProfile();
  const today = todayStr();
  if (profile.lastWeeklyAdd === today) { alert("Weekly staples already added today."); return; }
  addAllStaples();
  profile.lastWeeklyAdd = today;
  saveProfile(profile);
  alert("Weekly staples added to your shopping list!");
}

function displayShoppingList() {
  const container = document.getElementById("shoppingList");
  if (!container) return;
  const list = getShoppingList();
  container.innerHTML = "";
  if (list.length === 0) {
    container.innerHTML = '<p class="empty-state">Your shopping list is empty.</p>';
    return;
  }
  list.forEach(function (item, index) {
    const div = document.createElement("div");
    div.className = "shopping-item" + (item.checked ? " checked" : "");
    div.innerHTML =
      '<input type="checkbox"' + (item.checked ? " checked" : "") + ' onchange="toggleShopItem(' + index + ')" id="shop-' + index + '">' +
      '<label for="shop-' + index + '">' + foodEmoji(item.name) + " " + item.name + (item.fromFavourite ? " ★" : "") + '</label>' +
      '<button class="btn-small btn-danger" style="margin-left:auto;" onclick="removeShopItem(' + index + ')">✕</button>';
    container.appendChild(div);
  });
}

function loadStaples() {
  const container = document.getElementById("staplesList");
  if (!container) return;
  const favourites = getFoods().filter(function (f) { return f.favourite; });
  container.innerHTML = "";
  if (favourites.length === 0) {
    container.innerHTML = '<p class="empty-state">Star items in Inventory to add weekly staples.</p>';
    return;
  }
  favourites.forEach(function (food) {
    const chip = document.createElement("button");
    chip.className = "staple-chip";
    chip.textContent = foodEmoji(food.name) + " " + food.name + " +";
    chip.onclick = function () { addStapleToList(food.name); };
    container.appendChild(chip);
  });
}

async function loadPriceCompare() {
  const container = document.getElementById("priceCompare");
  if (!container) return;
  const list = getShoppingList().filter(function (i) { return !i.checked; });
  container.innerHTML = "";
  if (list.length === 0) {
    container.innerHTML = '<p class="empty-state">Add items to see price comparisons.</p>';
    return;
  }

  try {
    const results = [];
    for (const item of list) {
      const response = await fetch("/api/prices?q=" + encodeURIComponent(item.name));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not compare prices.");
      results.push({ item: item, products: data.products || [] });
    }

    results.forEach(function (result) {
      const byStore = {};
      result.products.forEach(function (product) {
        const store = product.store.toLowerCase();
        const price = Number.parseFloat(String(product.price).replace(/[^\d.]/g, ""));
        if (Number.isFinite(price) && (!byStore[store] || price < byStore[store].price)) {
          byStore[store] = { product: product, price: price };
        }
      });
      const stores = Object.keys(byStore);
      const cheapest = stores.length ? Math.min.apply(null, stores.map(function (store) { return byStore[store].price; })) : null;
      const cheapestStore = stores.find(function (store) { return byStore[store].price === cheapest; });
      const row = document.createElement("div");
      row.className = "price-row";
      row.innerHTML = '<strong>' + result.item.name + '</strong><div class="price-stores">' +
        ["coles", "woolworths", "aldi"].map(function (store) {
          const match = byStore[store];
          const storeName = store === "woolworths" ? "Woolworths" : store[0].toUpperCase() + store.slice(1);
          if (!match) return '<span>' + storeName + ' live data unavailable</span>';
          return '<span class="' + (store === cheapestStore ? "cheapest" : "") + '">' + storeName + ' $' + match.price.toFixed(2) + '</span>';
        }).join("") + '</div>' +
        (cheapestStore ? '<span class="cheapest-tag">Best at ' + (cheapestStore === "woolworths" ? "Woolworths" : cheapestStore[0].toUpperCase() + cheapestStore.slice(1)) + '</span>' : '<span class="cheapest-tag">No live prices found</span>');
      container.appendChild(row);
    });
  } catch (error) {
    container.innerHTML = '<p class="empty-state">Live price comparison is unavailable right now. Please try again later.</p>';
  }
}

function findPrice(name) {
  const n = name.toLowerCase();
  return PRICE_DATA.find(function (p) { return n.includes(p.item) || p.item.includes(n); });
}

/* ── Reminders ── */

function loadRemindersPage() {
  const container = document.getElementById("remindersList");
  if (!container) return;

  const foods = getFoods().slice().sort(function (a, b) { return daysLeft(a.expiry) - daysLeft(b.expiry); });
  container.innerHTML = "";

  if (foods.length === 0) {
    container.innerHTML = '<p class="empty-state">No food tracked yet.</p>';
    return;
  }

  foods.forEach(function (food) {
    const days = daysLeft(food.expiry);
    const idx = getFoods().indexOf(food);
    const priority = reminderPriority(days);
    const div = document.createElement("div");
    div.className = "reminder-item " + priority;
    div.innerHTML =
      '<span class="food-emoji">' + (food.emoji || foodEmoji(food.name)) + '</span>' +
      '<div class="reminder-info"><strong>' + food.name + '</strong>' +
      '<p class="' + reminderTierClass(priority) + '">' + expiryLabel(days) +
        ' <span class="tier-pill tier-' + priority + '">' + reminderTierLabel(priority) + '</span></p></div>' +
      '<div class="food-actions">' +
        (priority !== "low" ? '<button class="btn-small btn-outline" onclick="markUsed(' + idx + ')">Used it</button>' : '') +
        '<a class="btn btn-small" href="recipes.html">Recipe</a>' +
      '</div>';
    container.appendChild(div);
  });
}

function requestNotificationPermission() {
  if (!("Notification" in window)) return Promise.resolve("unsupported");
  if (Notification.permission === "granted") return Promise.resolve("granted");
  if (Notification.permission === "denied") return Promise.resolve("denied");
  return Notification.requestPermission();
}

function checkReminders() {
  const profile = getProfile();
  if (!profile.notifications) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const today = new Date().toDateString();
  if (localStorage.getItem("lastNotifCheck") === today) return;

  const alerts = [];

  getFoods().forEach(function (f) {
    const d = daysLeft(f.expiry);
    if (d >= 0 && d <= 2) alerts.push(f.name + " expires " + (d === 0 ? "today" : "in " + d + " day(s)"));
  });

  if (profile.rottingAlerts) {
    getRottingFoods().forEach(function (f) {
      if (!alerts.some(function (a) { return a.includes(f.name); }))
        alerts.push(f.name + " may be spoiling — check it");
    });
  }

  if (alerts.length > 0) {
    new Notification("FreshTrack — Food reminders", {
      body: alerts.slice(0, 3).join(". ") + (alerts.length > 3 ? "..." : "")
    });
    localStorage.setItem("lastNotifCheck", today);
  }
}

function showNotifBanner() {
  const banner = document.getElementById("notifBanner");
  if (!banner) return;
  if (getProfile().notifications) { banner.style.display = "none"; return; }
  if ("Notification" in window && Notification.permission !== "granted") banner.style.display = "flex";
}

function enableNotifications() {
  requestNotificationPermission().then(function (result) {
    if (result === "granted") {
      const p = getProfile();
      p.notifications = true;
      saveProfile(p);
      const banner = document.getElementById("notifBanner");
      if (banner) banner.style.display = "none";
      checkReminders();
    }
  });
}

/* ── Profile ── */

const PREF_OPTIONS = ["no nuts", "no dairy", "low sugar", "organic", "quick meals", "budget-friendly"];

function loadProfile() {
  const p = getProfile();
  setVal("profileName", p.name);
  setVal("profileEmail", p.email);
  setVal("profileDiet", p.diet);
  setVal("profileRegion", p.region);
  setCheck("notifCheck", p.notifications);
  setCheck("rottingCheck", p.rottingAlerts);
  setVal("customAccent", p.customAccent);
  setVal("customPeach", p.customPeach);

  renderPrefChips(p.preferences || []);
  renderPinTiles(p.pinnedTiles || []);
  renderPinSections(p.pinnedSections || []);
}

function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val || ""; }
function setCheck(id, val) { const el = document.getElementById(id); if (el) el.checked = !!val; }

function renderPrefChips(selected) {
  const container = document.getElementById("prefChips");
  if (!container) return;
  container.innerHTML = "";
  PREF_OPTIONS.forEach(function (pref) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "pref-chip" + (selected.includes(pref) ? " selected" : "");
    chip.textContent = pref;
    chip.onclick = function () { chip.classList.toggle("selected"); };
    container.appendChild(chip);
  });
}

function renderPinTiles(pinned) {
  const container = document.getElementById("pinTiles");
  if (!container) return;
  const tiles = [
    { id: "inventory", label: "Inventory" }, { id: "shopping", label: "Shopping" },
    { id: "recipes", label: "Recipes" }, { id: "reminders", label: "Reminders" }
  ];
  container.innerHTML = "";
  tiles.forEach(function (t) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "pref-chip" + (pinned.includes(t.id) ? " selected" : "");
    chip.textContent = t.label;
    chip.dataset.id = t.id;
    chip.onclick = function () { chip.classList.toggle("selected"); };
    container.appendChild(chip);
  });
}

function renderPinSections(pinned) {
  const container = document.getElementById("pinSections");
  if (!container) return;
  container.innerHTML = "";
  DASHBOARD_SECTIONS.forEach(function (s) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "pref-chip" + (pinned.includes(s.id) ? " selected" : "");
    chip.textContent = s.icon + " " + s.label;
    chip.dataset.id = s.id;
    chip.onclick = function () { chip.classList.toggle("selected"); };
    container.appendChild(chip);
  });
}

function saveProfileForm() {
  const p = getProfile();
  p.name = document.getElementById("profileName").value.trim();
  p.email = document.getElementById("profileEmail").value.trim();
  p.diet = document.getElementById("profileDiet").value;
  p.region = document.getElementById("profileRegion") ? document.getElementById("profileRegion").value : p.region;
  p.notifications = document.getElementById("notifCheck").checked;
  p.rottingAlerts = document.getElementById("rottingCheck") ? document.getElementById("rottingCheck").checked : true;
  p.customAccent = document.getElementById("customAccent") ? document.getElementById("customAccent").value : "";
  p.customPeach = document.getElementById("customPeach") ? document.getElementById("customPeach").value : "";

  p.preferences = [];
  document.querySelectorAll("#prefChips .pref-chip.selected").forEach(function (c) { p.preferences.push(c.textContent); });

  p.pinnedTiles = [];
  document.querySelectorAll("#pinTiles .pref-chip.selected").forEach(function (c) { p.pinnedTiles.push(c.dataset.id); });

  p.pinnedSections = [];
  document.querySelectorAll("#pinSections .pref-chip.selected").forEach(function (c) { p.pinnedSections.push(c.dataset.id); });

  saveProfile(p);
  applyCustomColors();
  if (p.notifications) requestNotificationPermission();
  alert("Profile saved!");
}

function exportData() {
  const data = {
    foods: getFoods(), shoppingList: getShoppingList(),
    profile: getProfile(), exported: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "freshtrack-backup.json";
  a.click();
}

function importData() {
  const input = document.getElementById("importFile");
  if (!input || !input.files[0]) { alert("Choose a file first."); return; }
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.foods) saveFoods(data.foods);
      if (data.shoppingList) saveShoppingList(data.shoppingList);
      if (data.profile) saveProfile(Object.assign(getDefaultProfile(), data.profile));
      alert("Data imported! Refreshing...");
      window.location.reload();
    } catch (err) { alert("Invalid backup file."); }
  };
  reader.readAsText(input.files[0]);
}

function deleteAllData() {
  if (!confirm("Delete ALL your FreshTrack data? This cannot be undone.")) return;
  localStorage.clear();
  alert("All data deleted.");
  window.location.href = "index.html";
}

/* ── Init ── */

document.addEventListener("DOMContentLoaded", function () {
  normalizeStoredFoodData();
  applyTheme();
  applyCustomColors();
  highlightNav();
  displayFood();
  loadDashboard();
  loadMealButtons();
  loadRecipesPage();
  displayShoppingList();
  loadStaples();
  loadProfile();
  loadRemindersPage();
  loadPriceCompare();
  showNotifBanner();
  checkReminders();
  updatePointsDisplay();

  const purchaseDate = document.getElementById("purchaseDate");
  if (purchaseDate) purchaseDate.value = todayStr();
});

