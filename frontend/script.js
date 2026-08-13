/* ═══════════════════════════════════════════
   FreshTrack — Full Application Logic
   ═══════════════════════════════════════════ */

/* ── Storage ── */

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
    if (food.emoji && /[\u{1F300}-\u{1FAFF}]/u.test(String(food.emoji))) {
      food.emoji = nextEmoji;
      changed = true;
    }
    if (!food.emoji || food.emoji !== nextEmoji) {
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
    notifications: false, rottingAlerts: true, scanConsent: false,
    twoFactor: false, twoFactorCode: "",
    theme: "light",
    customAccent: "", customPeach: "",
    pinnedSections: ["expiring", "rotting", "pantry", "meals", "rewards", "seasonal"],
    pinnedTiles: ["inventory", "shopping", "recipes", "scan", "stores", "reminders"],
    points: 0,
    pointsHistory: [],
    scanAccuracy: { total: 0, correct: 0 },
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
  if (!p.pointsHistory) p.pointsHistory = [];
  p.pointsHistory.unshift({ amount: amount, reason: reason, date: new Date().toISOString() });
  if (p.pointsHistory.length > 50) p.pointsHistory.length = 50;
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
  const n = name.toLowerCase();
  if (/milk|cheese|yogurt|butter|cream/.test(n)) return "dairy";
  if (/chicken|beef|pork|fish|meat|salmon/.test(n)) return "meat";
  if (/apple|banana|spinach|tomato|avocado|berry|lettuce|carrot|broccoli|pumpkin|onion|garlic|vegetable|fruit|potato/.test(n)) return "produce";
  if (/rice|pasta|bread|oats|flour/.test(n)) return "grains";
  if (/juice|water|coffee|tea/.test(n)) return "beverages";
  if (/frozen|ice/.test(n)) return "frozen";
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

function login() {
  const email = document.querySelector('input[type="email"]');
  const password = document.querySelector('input[type="password"]');
  const profile = getProfile();

  if (profile.passwordHash && password) {
    if (hashPassword(password.value) !== profile.passwordHash) {
      alert("Incorrect password.");
      return;
    }
  }

  if (profile.twoFactor) {
    const code = prompt("Enter your 2FA code (check Profile for your code):");
    if (code !== profile.twoFactorCode) {
      alert("Invalid 2FA code.");
      return;
    }
  }

  if (email && email.value) {
    profile.email = email.value;
    saveProfile(profile);
  }
  window.location.href = "dashboard.html";
}

function signup() {
  const inputs = document.querySelectorAll(".login-card input");
  const name = inputs[0] ? inputs[0].value.trim() : "";
  const email = inputs[1] ? inputs[1].value.trim() : "";
  const password = inputs[2] ? inputs[2].value : "";
  const confirm = inputs[3] ? inputs[3].value : "";

  if (!name || !email || !password) { alert("Please fill in all fields."); return; }
  if (password !== confirm) { alert("Passwords do not match."); return; }
  if (password.length < 4) { alert("Password must be at least 4 characters."); return; }

  const profile = getProfile();
  profile.name = name;
  profile.email = email;
  profile.passwordHash = hashPassword(password);
  saveProfile(profile);
  addPoints(POINTS_RULES.addFood, "Welcome bonus");
  window.location.href = "profile.html";
}

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
  if (newPw.value.length < 4) { alert("Password must be at least 4 characters."); return; }

  profile.passwordHash = hashPassword(newPw.value);
  saveProfile(profile);
  alert("Password updated.");
  current.value = ""; newPw.value = ""; confirm.value = "";
}

function generate2FACode() {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const profile = getProfile();
  profile.twoFactorCode = code;
  saveProfile(profile);
  const el = document.getElementById("twoFactorCodeDisplay");
  if (el) el.textContent = code;
  return code;
}

function toggle2FA() {
  const profile = getProfile();
  profile.twoFactor = document.getElementById("twoFactorCheck").checked;
  if (profile.twoFactor) generate2FACode();
  saveProfile(profile);
}

/* ── Nav ── */

function highlightNav() {
  const page = window.location.pathname.split("/").pop();
  document.querySelectorAll("nav a").forEach(function (link) {
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
  if (!document.getElementById("dashboardFood")) return;

  loadDashboardTiles();
  loadRottingSection();
  loadPantrySection();
  loadMealButtons();
  loadRewardsSection();
  loadSeasonalTip();
  updatePointsDisplay();
}

function loadDashboardTiles() {
  const grid = document.getElementById("tileGrid");
  if (!grid) return;

  const allTiles = [
    { id: "inventory", href: "inventory.html", icon: "I", label: "Inventory" },
    { id: "shopping", href: "shopping.html", icon: "S", label: "Shopping" },
    { id: "recipes", href: "recipes.html", icon: "R", label: "Recipes" },
    { id: "scan", href: "scan.html", icon: "P", label: "Scan Receipt" },
    { id: "stores", href: "stores.html", icon: "T", label: "Stores" },
    { id: "reminders", href: "reminders.html", icon: "N", label: "Reminders" },
    { id: "rewards", href: "rewards.html", icon: "W", label: "Rewards" },
    { id: "profile", href: "profile.html", icon: "U", label: "Profile" }
  ];

  const pinned = getProfile().pinnedTiles || [];
  const sorted = allTiles.slice().sort(function (a, b) {
    const indexA = pinned.indexOf(a.id); const indexB = pinned.indexOf(b.id);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  grid.innerHTML = "";
  sorted.forEach(function (t) {
    const a = document.createElement("a");
    a.href = t.href;
    a.className = "tile" + (pinned.includes(t.id) ? " pinned" : "");
    a.innerHTML = '<span class="tile-icon">' + t.icon + '</span><span class="tile-label">' + t.label + '</span>';
    grid.appendChild(a);
  });
}

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

function loadRewardsSection() {
  const el = document.getElementById("rewardsPreview");
  if (!el) return;
  const p = getProfile();
  el.innerHTML =
    '<div class="points-card">' +
      '<div class="points-big">' + (p.points || 0) + '</div>' +
      '<p>FreshPoints earned</p>' +
      '<a href="rewards.html" class="btn btn-small" style="margin-top:10px;">View rewards</a>' +
    '</div>';
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

  matches.forEach(function (m) {
    const r = m.recipe;
    const missing = r.ingredients.filter(function (ing) {
      const pantry = getFoods().map(function (f) { return f.name.toLowerCase(); });
      return !pantry.some(function (p) { return p.includes(ing) || ing.includes(p); });
    });

    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML =
      '<div class="recipe-card-header">' +
        '<img class="recipe-img" src="' + r.image + '" alt="' + r.name + '" onerror="this.style.display=\'none\'">' +
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
        '<button class="btn-small btn-peach" onclick="addPoints(' + POINTS_RULES.addRecipe + ',\'Cooked ' + r.name + '\');alert(\'Nice! +' + POINTS_RULES.addRecipe + ' points for cooking.\')">Mark as cooked</button>' +
      '</div>';
    container.appendChild(card);
  });
}

function addRecipeToShopping(recipeName) {
  const recipe = RECIPES.find(function (r) { return r.name === recipeName; });
  if (!recipe) return;
  const pantry = getFoods().map(function (f) { return f.name.toLowerCase(); });
  const list = getShoppingList();
  recipe.ingredients.forEach(function (ing) {
    const have = pantry.some(function (p) { return p.includes(ing) || ing.includes(p); });
    if (!have && !list.some(function (s) { return s.name.toLowerCase() === ing; })) {
      list.push({ name: ing.charAt(0).toUpperCase() + ing.slice(1), checked: false, fromFavourite: false });
    }
  });
  saveShoppingList(list);
  alert("Missing ingredients added to shopping list.");
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

function loadPriceCompare() {
  const container = document.getElementById("priceCompare");
  if (!container) return;
  const list = getShoppingList().filter(function (i) { return !i.checked; });
  container.innerHTML = "";
  if (list.length === 0) {
    container.innerHTML = '<p class="empty-state">Add items to see price comparisons.</p>';
    return;
  }

  list.forEach(function (item) {
    const price = findPrice(item.name);
    if (!price) return;
    const cheapest = Math.min(price.coles, price.woolies, price.aldi);
    const store = cheapest === price.aldi ? "Aldi" : cheapest === price.woolies ? "Woolies" : "Coles";
    const row = document.createElement("div");
    row.className = "price-row";
    row.innerHTML =
      '<strong>' + item.name + '</strong>' +
      '<div class="price-stores">' +
        '<span class="' + (price.coles === cheapest ? "cheapest" : "") + '">Coles $' + price.coles.toFixed(2) + '</span>' +
        '<span class="' + (price.woolies === cheapest ? "cheapest" : "") + '">Woolies $' + price.woolies.toFixed(2) + '</span>' +
        '<span class="' + (price.aldi === cheapest ? "cheapest" : "") + '">Aldi $' + price.aldi.toFixed(2) + '</span>' +
      '</div>' +
      '<span class="cheapest-tag">Best at ' + store + '</span>';
    container.appendChild(row);
  });
}

function findPrice(name) {
  const n = name.toLowerCase();
  return PRICE_DATA.find(function (p) { return n.includes(p.item) || p.item.includes(n); });
}

/* ── Stores & Brochures ── */

function loadStoresPage() {
  loadBrochures();
  loadPriceSearch();
}

function loadBrochures() {
  const container = document.getElementById("brochureGrid");
  if (!container) return;
  container.innerHTML = "";

  Object.keys(BROCHURES).forEach(function (key) {
    const store = BROCHURES[key];
    const card = document.createElement("div");
    card.className = "brochure-card";
    card.innerHTML = '<div class="brochure-header" style="background:' + store.color + '"><h4>' + store.name + ' Weekly Specials</h4></div><div class="brochure-deals"></div>';
    const deals = card.querySelector(".brochure-deals");
    store.deals.forEach(function (d) {
      deals.innerHTML +=
        '<div class="deal-item"><strong>' + d.item + '</strong>' +
        '<span class="deal-price">' + d.price + '</span>' +
        '<span class="deal-was">was ' + d.was + '</span>' +
        '<span class="deal-until">Until ' + d.until + '</span></div>';
    });
    container.appendChild(card);
  });
}

function loadPriceSearch() {
  const input = document.getElementById("priceSearch");
  const results = document.getElementById("priceResults");
  if (!input || !results) return;

  function search() {
    const q = input.value.toLowerCase().trim();
    results.innerHTML = "";
    if (!q) return;

    const matches = PRICE_DATA.filter(function (p) { return p.item.includes(q) || q.includes(p.item); });
    if (matches.length === 0) {
      results.innerHTML = '<p class="empty-state">No prices found for "' + q + '". Try milk, bread, chicken...</p>';
      return;
    }

    matches.forEach(function (p) {
      const cheapest = Math.min(p.coles, p.woolies, p.aldi);
      const store = cheapest === p.aldi ? "Aldi" : cheapest === p.woolies ? "Woolies" : "Coles";
      results.innerHTML +=
        '<div class="price-row">' +
          '<strong>' + p.item.charAt(0).toUpperCase() + p.item.slice(1) + '</strong>' +
          '<div class="price-stores">' +
            '<span class="' + (p.coles === cheapest ? "cheapest" : "") + '">Coles $' + p.coles.toFixed(2) + '</span>' +
            '<span class="' + (p.woolies === cheapest ? "cheapest" : "") + '">Woolies $' + p.woolies.toFixed(2) + '</span>' +
            '<span class="' + (p.aldi === cheapest ? "cheapest" : "") + '">Aldi $' + p.aldi.toFixed(2) + '</span>' +
          '</div>' +
          '<span class="cheapest-tag">Cheapest at ' + store + '</span>' +
        '</div>';
    });
  }

  input.oninput = search;
}

/* ── Receipt Scanning ── */

function parseReceiptText(text) {
  const lines = text.split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
  const items = [];
  const skipWords = ["total", "subtotal", "gst", "tax", "change", "cash", "card", "visa", "mastercard", "eftpos", "abn", "thank", "receipt"];

  lines.forEach(function (line) {
    const lower = line.toLowerCase();
    if (skipWords.some(function (w) { return lower.includes(w); })) return;

    const priceMatch = line.match(/\$?\s*(\d+\.\d{2})\s*$/);
    let price = null;
    let name = line;

    if (priceMatch) {
      price = parseFloat(priceMatch[1]);
      name = line.substring(0, priceMatch.index).trim();
    }

    name = name.replace(/\d+\s*x\s*/i, "").replace(/\*\s*/g, "").trim();
    if (name.length < 2) return;

    const words = name.split(/\s+/);
    if (words.length > 6) return;

    items.push({ name: name, price: price });
  });

  return items;
}

function scanReceipt() {
  const profile = getProfile();
  if (!profile.scanConsent) {
    alert("Please enable receipt scanning consent in Profile first.");
    return;
  }

  const text = document.getElementById("receiptText").value.trim();
  if (!text) { alert("Paste your receipt text first."); return; }

  const region = document.getElementById("scanRegion") ? document.getElementById("scanRegion").value : profile.region;
  const items = parseReceiptText(text);
  const preview = document.getElementById("scanPreview");
  const status = document.getElementById("scanStatus");

  if (items.length === 0) {
    if (status) status.innerHTML = '<p class="empty-state">Could not parse any items. Try one item per line, e.g. "Milk 2.50"</p>';
    return;
  }

  if (preview) {
    preview.innerHTML = "<h4>Parsed " + items.length + " items (region: " + region + "):</h4>";
    items.forEach(function (item, i) {
      const days = 7;
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + days);
      preview.innerHTML +=
        '<div class="scan-item">' +
          '<label><input type="checkbox" checked class="scan-check" data-idx="' + i + '"> ' +
          foodEmoji(item.name) + " <strong>" + item.name + "</strong>" +
          (item.price ? " — $" + item.price.toFixed(2) : "") +
          ' · Est. expiry: <input type="date" class="scan-expiry" data-idx="' + i + '" value="' + expiry.toISOString().split("T")[0] + '">' +
          '</label></div>';
    });
    preview.innerHTML += '<button class="btn" onclick="confirmScan()" style="margin-top:16px;">Add selected to inventory</button>';
    preview.dataset.items = JSON.stringify(items);
  }

  if (status) status.innerHTML = '<p class="scan-success">✓ Parsed successfully. No receipt data stored. Review items above.</p>';
}

function confirmScan() {
  const preview = document.getElementById("scanPreview");
  if (!preview || !preview.dataset.items) return;

  const items = JSON.parse(preview.dataset.items);
  const foods = getFoods();
  let added = 0;

  items.forEach(function (item, i) {
    const check = document.querySelector('.scan-check[data-idx="' + i + '"]');
    if (!check || !check.checked) return;

    const expiryEl = document.querySelector('.scan-expiry[data-idx="' + i + '"]');
    const expiry = expiryEl ? expiryEl.value : todayStr();
    const cat = guessCategory(item.name);

    foods.push({
      name: item.name, expiry: expiry, quantity: 1, unit: "pieces",
      favourite: false, category: cat, purchaseDate: todayStr(), emoji: foodEmoji(item.name)
    });
    added++;
  });

  saveFoods(foods);
  addPoints(POINTS_RULES.scanReceipt * added, "Scanned " + added + " items from receipt");

  const profile = getProfile();
  profile.scanAccuracy.total = (profile.scanAccuracy.total || 0) + added;
  profile.scanAccuracy.correct = (profile.scanAccuracy.correct || 0) + added;
  saveProfile(profile);

  document.getElementById("receiptText").value = "";
  preview.innerHTML = '<p class="empty-state">Receipt deleted. ' + added + ' items added to inventory. +' + (POINTS_RULES.scanReceipt * added) + ' points!</p>';
  preview.dataset.items = "";

  refreshFoodViews();
  updateScanAccuracy();
}

function confirmScanAccuracy(correct) {
  const profile = getProfile();
  if (correct) profile.scanAccuracy.correct = (profile.scanAccuracy.correct || 0) + 1;
  profile.scanAccuracy.total = (profile.scanAccuracy.total || 0) + 1;
  saveProfile(profile);
  updateScanAccuracy();
}

function updateScanAccuracy() {
  const el = document.getElementById("scanAccuracy");
  if (!el) return;
  const acc = getProfile().scanAccuracy || { total: 0, correct: 0 };
  if (acc.total === 0) { el.textContent = "No scans yet."; return; }
  const pct = Math.round((acc.correct / acc.total) * 100);
  el.textContent = "Scan accuracy: " + pct + "% (" + acc.correct + "/" + acc.total + " items correct)";
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
    const priority = days <= 0 ? "critical" : days <= 1 ? "high" : days <= 3 ? "medium" : "low";
    const div = document.createElement("div");
    div.className = "reminder-item " + priority;
    div.innerHTML =
      '<span class="food-emoji">' + (food.emoji || foodEmoji(food.name)) + '</span>' +
      '<div class="reminder-info"><strong>' + food.name + '</strong>' +
      '<p class="' + expiryClass(days) + '">' + expiryLabel(days) + '</p></div>' +
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

/* ── Rewards ── */

function loadRewardsPage() {
  const total = document.getElementById("pointsTotal");
  const history = document.getElementById("pointsHistory");
  const tiers = document.getElementById("rewardTiers");
  if (!total) return;

  const p = getProfile();
  total.textContent = p.points || 0;

  if (history) {
    history.innerHTML = "";
    if (!p.pointsHistory || p.pointsHistory.length === 0) {
      history.innerHTML = '<p class="empty-state">Start tracking food to earn points!</p>';
    } else {
      p.pointsHistory.forEach(function (h) {
        const div = document.createElement("div");
        div.className = "history-item";
        div.innerHTML = '<span class="history-amount">+' + h.amount + '</span> ' + h.reason +
          '<span class="history-date">' + new Date(h.date).toLocaleDateString() + '</span>';
        history.appendChild(div);
      });
    }
  }

  if (tiers) {
    const pts = p.points || 0;
    tiers.innerHTML =
      '<div class="tier' + (pts >= 50 ? " unlocked" : "") + '"><span class="tier-mark">S</span> Seedling — 50 pts</div>' +
      '<div class="tier' + (pts >= 150 ? " unlocked" : "") + '"><span class="tier-mark">P</span> Sprout — 150 pts</div>' +
      '<div class="tier' + (pts >= 300 ? " unlocked" : "") + '"><span class="tier-mark">G</span> Green Thumb — 300 pts</div>' +
      '<div class="tier' + (pts >= 500 ? " unlocked" : "") + '"><span class="tier-mark">W</span> Waste Warrior — 500 pts</div>';
  }
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
  setCheck("scanConsent", p.scanConsent);
  setCheck("twoFactorCheck", p.twoFactor);
  setVal("customAccent", p.customAccent);
  setVal("customPeach", p.customPeach);

  renderPrefChips(p.preferences || []);
  renderPinTiles(p.pinnedTiles || []);
  renderPinSections(p.pinnedSections || []);
  updateScanAccuracy();

  const codeEl = document.getElementById("twoFactorCodeDisplay");
  if (codeEl && p.twoFactor) codeEl.textContent = p.twoFactorCode || "Generate a code";
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
    { id: "recipes", label: "Recipes" }, { id: "scan", label: "Scan" },
    { id: "stores", label: "Stores" }, { id: "reminders", label: "Reminders" }
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
  p.scanConsent = document.getElementById("scanConsent").checked;
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
  loadRewardsPage();
  loadStoresPage();
  loadPriceCompare();
  showNotifBanner();
  checkReminders();
  updateScanAccuracy();
  updatePointsDisplay();

  const purchaseDate = document.getElementById("purchaseDate");
  if (purchaseDate) purchaseDate.value = todayStr();
});
