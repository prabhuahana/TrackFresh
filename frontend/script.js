/* script.js - TrackFresh app logic: food storage, shopping lists, recipes, themes */

// --- Helper: grab saved foods from storage (or empty list if none saved yet) ---
function getFoods() {
  return JSON.parse(localStorage.getItem("foods")) || [];
}

// Save the foods array back to storage
function saveFoods(foods) {
  localStorage.setItem("foods", JSON.stringify(foods));
}

// Fix up old saved data so it has emoji, category, and purchase date
function normalizeStoredFoodData() {
  var foods = getFoods();
  var changed = false;
  var i;

  for (i = 0; i < foods.length; i++) {
    var food = foods[i];
    var nextEmoji = getFoodEmoji(food.name, food.category);
    
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
  }

  if (changed) {
    saveFoods(foods);
  }
}

// Grab shopping lists from storage (handles both old flat format and new multi-list format)
function getShoppingList() {
  var stored = localStorage.getItem("shoppingList");
  var parsed = JSON.parse(stored);
  
  // Old version used a flat array, so convert it to the new multi-list object format
  if (Array.isArray(parsed)) {
    var converted = getDefaultShoppingLists();
    converted["My List"] = parsed.map(function(item) {
      return { name: item.name, checked: item.checked || false };
    });
    saveShoppingList(converted);
    return converted;
  }
  
  if (parsed && typeof parsed === "object") {
    return parsed;
  }
  
  // Nothing saved yet, return the default two lists
  return getDefaultShoppingLists();
}

// Build the default two lists: "AI List" and the user's personal list
function getDefaultShoppingLists() {
  var profile = getProfile();
  var userName = profile.name || "";
  var userListName = userName ? userName + "'s List" : "My List";
  
  var defaults = {};
  defaults["AI List"] = [];
  defaults[userListName] = [];
  
  return defaults;
}

// Save the shopping lists object back to storage
function saveShoppingList(list) {
  localStorage.setItem("shoppingList", JSON.stringify(list));
}

// Figure out what to call the user's personal list (uses their profile name)
function getUserNameForList() {
  var profile = getProfile();
  var userName = profile.name || "";
  return userName ? userName + "'s List" : "My List";
}

// Check if user has consented to AI features in their profile
function isAiEnabled() {
  var profile = getProfile();
  return (profile.aiConsent !== false);
}

// Default profile settings for a new user
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
    streak: 0,
    aiConsent: true
  };
}

// Load the user's profile, merging saved data with defaults
function getProfile() {
  var defaultProfile = getDefaultProfile();
  var stored = localStorage.getItem("profile");
  var storedProfile = JSON.parse(stored);
  
  // Start with defaults, then overwrite with whatever the user has saved
  var profile = defaultProfile;
  if (storedProfile) {
    var key;
    for (key in storedProfile) {
      profile[key] = storedProfile[key];
    }
  }
  
  return profile;
}

// Save the profile object back to storage
function saveProfile(profile) {
  localStorage.setItem("profile", JSON.stringify(profile));
}

function hashPassword(pw) {
  let h = 0;
  for (let i = 0; i < pw.length; i++) h = ((h << 5) - h + pw.charCodeAt(i)) | 0;
  return String(h);
}

// --- Theme & Colours ---

// Apply the saved theme (light/dark) and any custom colours
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

// --- Points System ---

// Add points to the user's profile and update the display
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

// --- Date Helpers ---

// Calculate how many days until a food expires
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

// --- Reminder Urgency Tiers ---

// Determine how urgent a reminder is based on days until expiry
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

// --- Food Emoji ---

// Pick an emoji for a food based on its name
// Get the emoji for a food item using the FOOD_EMOJIS dictionary from data.js
function getFoodEmoji(name, category) {
  if (!name) return "🍴";
  
  var cleanName = name.trim().toLowerCase();

  // 1. Check the FOOD_EMOJIS dictionary from data.js first
  if (typeof FOOD_EMOJIS !== "undefined" && FOOD_EMOJIS[cleanName]) {
    return FOOD_EMOJIS[cleanName];
  }

  // 2. Direct name matching for common foods
  if (cleanName.indexOf("milk") !== -1) return "🥛";
  if (cleanName.indexOf("butter") !== -1) return "🧈";
  if (cleanName.indexOf("cheese") !== -1) return "🧀";
  if (cleanName.indexOf("pasta") !== -1 || cleanName.indexOf("spaghetti") !== -1) return "🍝";
  if (cleanName.indexOf("bread") !== -1) return "🍞";
  if (cleanName.indexOf("egg") !== -1) return "🥚";
  if (cleanName.indexOf("apple") !== -1) return "🍎";
  if (cleanName.indexOf("banana") !== -1) return "🍌";
  if (cleanName.indexOf("chicken") !== -1 || cleanName.indexOf("meat") !== -1) return "🍗";
  if (cleanName.indexOf("fish") !== -1 || cleanName.indexOf("salmon") !== -1) return "🐟";
  if (cleanName.indexOf("rice") !== -1) return "🍚";
  if (cleanName.indexOf("tomato") !== -1) return "🍅";
  if (cleanName.indexOf("carrot") !== -1) return "🥕";
  if (cleanName.indexOf("broccoli") !== -1) return "🥦";
  if (cleanName.indexOf("mushroom") !== -1) return "🍄";
  if (cleanName.indexOf("onion") !== -1) return "🧅";
  if (cleanName.indexOf("garlic") !== -1) return "🧄";
  if (cleanName.indexOf("potato") !== -1) return "🥔";
  if (cleanName.indexOf("corn") !== -1) return "🌽";
  if (cleanName.indexOf("pepper") !== -1) return "🌶️";
  if (cleanName.indexOf("lemon") !== -1) return "🍋";
  if (cleanName.indexOf("avocado") !== -1) return "🥑";
  if (cleanName.indexOf("berry") !== -1 || cleanName.indexOf("berries") !== -1) return "🍓";
  if (cleanName.indexOf("grape") !== -1) return "🍇";
  if (cleanName.indexOf("watermelon") !== -1) return "🍉";
  if (cleanName.indexOf("peach") !== -1) return "🍑";
  if (cleanName.indexOf("cherry") !== -1) return "🍒";
  if (cleanName.indexOf("pineapple") !== -1) return "🍍";
  if (cleanName.indexOf("mango") !== -1) return "🥭";
  if (cleanName.indexOf("cream") !== -1) return "🍶";
  if (cleanName.indexOf("yogurt") !== -1) return "🍶";
  if (cleanName.indexOf("honey") !== -1) return "🍯";
  if (cleanName.indexOf("chocolate") !== -1) return "🍫";
  if (cleanName.indexOf("coffee") !== -1) return "☕";
  if (cleanName.indexOf("tea") !== -1) return "🍵";
  if (cleanName.indexOf("juice") !== -1) return "🧃";
  if (cleanName.indexOf("water") !== -1) return "💧";
  if (cleanName.indexOf("flour") !== -1) return "🌾";
  if (cleanName.indexOf("sugar") !== -1) return "🍬";
  if (cleanName.indexOf("salt") !== -1) return "🧂";
  if (cleanName.indexOf("oil") !== -1) return "🛢️";
  if (cleanName.indexOf("vegetable") !== -1 || cleanName.indexOf("veggie") !== -1) return "🥬";
  if (cleanName.indexOf("fruit") !== -1) return "🍇";
  if (cleanName.indexOf("frozen") !== -1) return "🧊";
  if (cleanName.indexOf("drink") !== -1 || cleanName.indexOf("beverage") !== -1) return "🥤";
  if (cleanName.indexOf("beer") !== -1 || cleanName.indexOf("wine") !== -1) return "🍺";
  if (cleanName.indexOf("pizza") !== -1) return "🍕";
  if (cleanName.indexOf("burger") !== -1) return "🍔";
  if (cleanName.indexOf("fries") !== -1 || cleanName.indexOf("chip") !== -1) return "🍟";
  if (cleanName.indexOf("taco") !== -1) return "🌮";
  if (cleanName.indexOf("burrito") !== -1) return "🌯";
  if (cleanName.indexOf("sandwich") !== -1) return "🥪";
  if (cleanName.indexOf("salad") !== -1) return "🥗";
  if (cleanName.indexOf("popcorn") !== -1) return "🍿";
  if (cleanName.indexOf("cookie") !== -1 || cleanName.indexOf("biscuit") !== -1) return "🍪";
  if (cleanName.indexOf("cake") !== -1) return "🍰";
  if (cleanName.indexOf("pie") !== -1) return "🥧";
  if (cleanName.indexOf("donut") !== -1) return "🍩";
  if (cleanName.indexOf("candy") !== -1 || cleanName.indexOf("sweet") !== -1) return "🍭";
  if (cleanName.indexOf("ice cream") !== -1) return "🍦";
  if (cleanName.indexOf("canned") !== -1 || cleanName.indexOf("can") !== -1) return "🥫";
  if (cleanName.indexOf("cereal") !== -1) return "🥣";
  if (cleanName.indexOf("soup") !== -1 || cleanName.indexOf("stew") !== -1) return "🍲";
  if (cleanName.indexOf("noodle") !== -1) return "🍜";
  if (cleanName.indexOf("curry") !== -1) return "🍛";
  if (cleanName.indexOf("sushi") !== -1) return "🍣";
  if (cleanName.indexOf("tofu") !== -1) return "🫘";
  if (cleanName.indexOf("bean") !== -1 || cleanName.indexOf("beans") !== -1) return "🫘";
  if (cleanName.indexOf("lentil") !== -1) return "🫘";
  if (cleanName.indexOf("nut") !== -1 || cleanName.indexOf("nuts") !== -1) return "🥜";
  if (cleanName.indexOf("pumpkin") !== -1) return "🎃";
  if (cleanName.indexOf("lettuce") !== -1 || cleanName.indexOf("spinach") !== -1) return "🥬";
  if (cleanName.indexOf("cucumber") !== -1) return "🥒";
  if (cleanName.indexOf("orange") !== -1) return "🍊";
  if (cleanName.indexOf("lime") !== -1) return "🍋";
  if (cleanName.indexOf("pear") !== -1) return "🍐";
  if (cleanName.indexOf("coconut") !== -1) return "🥥";
  if (cleanName.indexOf("kiwi") !== -1) return "🥝";
  if (cleanName.indexOf("ginger") !== -1) return "🫚";

  // 3. Category matching as fallback
  if (category) {
    var cat = category.toLowerCase();
    if (cat.indexOf("dairy") !== -1) return "🥛";
    if (cat.indexOf("produce") !== -1 || cat.indexOf("veg") !== -1 || cat.indexOf("fruit") !== -1) return "🥦";
    if (cat.indexOf("bakery") !== -1 || cat.indexOf("grain") !== -1) return "🍞";
    if (cat.indexOf("meat") !== -1) return "🥩";
    if (cat.indexOf("frozen") !== -1) return "🧊";
    if (cat.indexOf("beverage") !== -1) return "🥤";
    if (cat.indexOf("pantry") !== -1) return "🥫";
  }

  // 4. Default fallback
  return "🍴";
}

// Keep the old name as an alias so existing code still works
function foodEmoji(name) {
  return getFoodEmoji(name, "");
}

// Guess what category a food belongs to based on its name (e.g., "milk" -> "dairy")
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

// --- Rotting Detection ---

// Check if a food item is likely rotting based on its expiry and purchase date
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

// --- Input Validation ---

// Validate string inputs (names, emails, passwords)
// Returns true if valid, false if not
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

// Validate a number is within a range (e.g., quantity between 1 and 999)
// Returns true if valid, false if not
function numvalidation(value, minval, maxval) {
    var num = parseInt(value, 10);
    if (isNaN(num)) { return false; } // Not a number
    if (num < minval || num > maxval) { return false; } // Out of range
    return true;
}

// --- Authentication ---

var MIN_PASSWORD_LENGTH = 6;

// Show an error message next to an input field
function setFieldError(input, message) {
  if (!input) return;
  input.classList.add("input-invalid");
  input.setAttribute("aria-invalid", "true");
  var error = input.nextElementSibling;
  if (!error || !error.classList.contains("field-error")) {
    error = document.createElement("p");
    error.className = "field-error";
    input.parentNode.insertBefore(error, input.nextSibling);
  }
  error.textContent = message;
}

// Remove the error message from an input field
function clearFieldError(input) {
  if (!input) return;
  input.classList.remove("input-invalid");
  input.removeAttribute("aria-invalid");
  var error = input.nextElementSibling;
  if (error && error.classList.contains("field-error")) error.remove();
}

// Check if a password meets the requirements (using strvalidation)
function validPassword(value) {
  return strvalidation(value, "password");
}

// Handle user login: validate inputs and check password hash
function login() {
  var email = document.querySelector('input[type="email"]');
  var password = document.querySelector('input[type="password"]');
  var profile = getProfile();
  var ok = true;

  // Validate email field
  if (!email.value.trim()) {
    setFieldError(email, "Email is required.");
    ok = false;
  } else if (strvalidation(email.value.trim(), "email") === false) {
    setFieldError(email, "Enter a valid email, e.g. you@example.com.");
    ok = false;
  } else {
    clearFieldError(email);
  }

  // Validate password field
  if (!password.value) {
    setFieldError(password, "Password is required.");
    ok = false;
  } else {
    clearFieldError(password);
  }
  if (!ok) return;

  // Check if the entered password matches the saved hash
  if (profile.passwordHash && hashPassword(password.value) !== profile.passwordHash) {
    setFieldError(password, "Incorrect password. Try again.");
    return;
  }

  // Login successful - save email and go to dashboard
  profile.email = email.value.trim();
  saveProfile(profile);
  window.location.href = "dashboard.html";
}

function signup() {
  var inputs = document.querySelectorAll(".login-card input");
  var nameInput = inputs[0];
  var emailInput = inputs[1];
  var passwordInput = inputs[2];
  var confirmInput = inputs[3];
  var name = nameInput ? nameInput.value.trim() : "";
  var email = emailInput ? emailInput.value.trim() : "";
  var password = passwordInput ? passwordInput.value : "";
  var confirm = confirmInput ? confirmInput.value : "";
  var ok = true;

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

  // Get AI consent from checkbox (if it exists on the page)
  var aiConsentChecked = document.getElementById("aiConsentCheck");
  var aiConsent = aiConsentChecked ? aiConsentChecked.checked : true;

  var profile = getProfile();
  profile.name = name;
  profile.email = email;
  profile.passwordHash = hashPassword(password);
  profile.aiConsent = aiConsent;
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

// --- Navigation ---

// Highlight the current page in the sidebar nav
function highlightNav() {
  const page = window.location.pathname.split("/").pop();
  const links = document.querySelectorAll("nav a, .profile-link");
  let i;
  
  for (i = 0; i < links.length; i++) {
    const link = links[i];
    const href = link.getAttribute("href");
    
    if (href === page) {
      link.classList.add("active");
    }
  }
}

// --- Quantity Check ---

// Warn the user if they're adding an unusual quantity of something
function checkQuantity(name, quantity, unit) {
  name = name.toLowerCase();
  if (unit === "kg" && quantity > 20) return "Are you sure you have " + quantity + "kg of " + name + "?";
  if (unit === "g" && quantity > 5000) return "Are you sure you have " + quantity + "g of " + name + "?";
  if (unit === "ml" && quantity > 5000) return "Are you sure you have " + quantity + "mL of " + name + "?";
  if (unit === "L" && quantity > 10) return "Are you sure you have " + quantity + "L of " + name + "?";
  if (unit === "pieces" && quantity > 100) return "Are you sure you have " + quantity + " pieces of " + name + "?";
  return null;
}

// --- Food CRUD (Create, Read, Update, Delete) ---

// Add a new food item to the fridge after validating the inputs
function addFood() {
  // Get raw input values
  var nameRaw = document.getElementById("foodName").value.trim();
  var expiry = document.getElementById("expiryDate").value;
  var qtyRaw = document.getElementById("quantity").value.trim();
  var unit = document.getElementById("unit").value;
  var favourite = document.getElementById("favouriteCheck") ? document.getElementById("favouriteCheck").checked : false;
  var category = document.getElementById("foodCategory") ? document.getElementById("foodCategory").value : guessCategory(nameRaw);
  var purchaseDate = document.getElementById("purchaseDate") ? document.getElementById("purchaseDate").value : todayStr();

  // 1. Validate food name using strvalidation (must be a valid name with letters)
  if (!nameRaw) {
    alert("Please enter a food name.");
    return;
  }
  if (strvalidation(nameRaw, "name") === false) {
    alert("Food name can only contain letters, spaces, hyphens, and apostrophes.");
    return;
  }
  // Check length (max 30 characters)
  if (nameRaw.length > 30) {
    alert("Food name is too long (max 30 characters).");
    return;
  }

  // 1b. Check for non-food items (block "laptop", "cat", etc.)
  var nonFoodList = [
    "laptop", "computer", "phone", "iphone", "ipad", "screen",
    "cat", "dog", "pet", "kitten", "puppy",
    "chair", "table", "desk", "couch",
    "shoe", "sock", "shirt", "pants", "clothes",
    "car", "bike", "book", "pen", "pencil", "charger"
  ];
  var enteredNameLower = nameRaw.toLowerCase();
  for (var nf = 0; nf < nonFoodList.length; nf++) {
    if (enteredNameLower.indexOf(nonFoodList[nf]) !== -1) {
      alert("'" + nameRaw + "' is not an edible grocery item! Please enter real food.");
      return;
    }
  }

  // 2. Validate expiry date is provided
  if (!expiry) {
    alert("Please select an expiry date.");
    return;
  }

  // 3. Validate quantity using numvalidation (must be between 1 and 999)
  if (!qtyRaw) {
    alert("Please enter a quantity.");
    return;
  }
  if (numvalidation(qtyRaw, 1, 999) === false) {
    alert("Quantity must be a whole number between 1 and 999.");
    return;
  }
  var quantity = parseInt(qtyRaw, 10);

  // 4. Check for unusual quantities and warn the user
  var warning = checkQuantity(nameRaw, quantity, unit);
  if (warning && !confirm(warning)) return;

  // All validations passed - add the food item
  var foods = getFoods();
  foods.push({ name: nameRaw, expiry: expiry, quantity: quantity, unit: unit, favourite: favourite, category: category, purchaseDate: purchaseDate, emoji: getFoodEmoji(nameRaw, category) });
  saveFoods(foods);
  addPoints(POINTS_RULES.addFood, "Added " + nameRaw);

  // Clear the form
  document.getElementById("foodName").value = "";
  document.getElementById("expiryDate").value = "";
  document.getElementById("quantity").value = "";
  if (document.getElementById("favouriteCheck")) document.getElementById("favouriteCheck").checked = false;
  if (document.getElementById("purchaseDate")) document.getElementById("purchaseDate").value = todayStr();

  refreshFoodViews();
  checkReminders();
}

// Remove a food item from the fridge
function removeFood(index) {
  var foods = getFoods();
  foods.splice(index, 1);
  saveFoods(foods);
  refreshFoodViews();
}

// Toggle whether a food is a weekly favourite (auto-added to shopping list)
function toggleFavourite(index) {
  var foods = getFoods();
  foods[index].favourite = !foods[index].favourite;
  saveFoods(foods);
  displayFood();
  loadStaples();
}

// Mark a food as used: remove it and award points
function markUsed(index) {
  var foods = getFoods();
  var item = foods[index];
  if (!item) return;
  var days = daysLeft(item.expiry);
  // Award more points if used before expiry, fewer if expired
  if (days >= 0) addPoints(POINTS_RULES.useBeforeExpiry, "Used " + item.name + " before expiry");
  else addPoints(POINTS_RULES.preventWaste, "Removed expired " + item.name);
  foods.splice(index, 1);
  saveFoods(foods);
  showUsedFeedback(item.name);
  refreshFoodViews();
}

// Show a quick popup message when an item is marked as used
function showUsedFeedback(itemName) {
  var feedback = document.createElement("div");
  feedback.className = "used-feedback";
  feedback.textContent = "Marked \"" + itemName + "\" as used!";
  document.body.appendChild(feedback);
  setTimeout(function() {
    feedback.classList.add("show");
  }, 10);
  setTimeout(function() {
    feedback.classList.remove("show");
    setTimeout(function() {
      if (feedback.parentNode) feedback.parentNode.removeChild(feedback);
    }, 300);
  }, 1500);
}

// Add an item from the fridge to the user's shopping list
function addToShoppingFromPantry(index) {
  var foods = getFoods();
  var item = foods[index];
  
  if (!item) {
    return;
  }
  
  // Add item to the user's personal shopping list
  addItemToUserList(item.name);
  
  alert(item.name + " added to shopping list.");
}

// Refresh all pages that show food data (dashboard, inventory, reminders, etc.)
function refreshFoodViews() {
  displayFood();
  loadDashboard();
  loadMealButtons();
  loadRemindersPage();
  loadRottingSection();
}

// --- Inventory Display ---

// Display all food items in the fridge, sorted by expiry date
function displayFood() {
  const foodList = document.getElementById("foodList");
  if (!foodList) {
    return;
  }

  const allFoods = getFoods();
  
  // Sort foods by expiry date
  const foods = allFoods.slice();
  foods.sort(function (a, b) {
    return daysLeft(a.expiry) - daysLeft(b.expiry);
  });
  
  foodList.innerHTML = "";

  if (foods.length === 0) {
    foodList.innerHTML = '<p class="empty-state">No items added yet.</p>';
    return;
  }

  let i;
  for (i = 0; i < foods.length; i++) {
    const food = foods[i];
    const idx = allFoods.indexOf(food);
    const days = daysLeft(food.expiry);
    const rotten = isRotting(food);
    
    const div = document.createElement("div");
    div.className = "food";
    
    if (rotten) {
      div.className = div.className + " rotten";
    } else if (days <= 3) {
      div.className = div.className + " urgent";
    }

    const emoji = getFoodEmoji(food.name, food.category);
    const category = food.category || "other";
    const expiryClassStr = expiryClass(days);
    const expiryLabelStr = expiryLabel(days);
    const rottenNote = rotten ? " · <strong>May be spoiling</strong>" : "";

    // Build the food item card HTML (no star button)
    div.innerHTML =
      '<div class="food-info">' +
        '<span class="food-emoji">' + emoji + '</span>' +
        '<div><h3>' + food.name + '</h3>' +
        '<p>Quantity: ' + food.quantity + food.unit + ' · ' + category + '</p>' +
        '<p class="' + expiryClassStr + '">' + expiryLabelStr + rottenNote + '</p></div>' +
      '</div>' +
      '<div class="food-actions">' +
        '<button class="btn-small btn-outline" onclick="markUsed(' + idx + ')">Used it</button>' +
        '<button class="btn-small" onclick="addToShoppingFromPantry(' + idx + ')">+ Shop</button>' +
        '<button class="btn-small btn-danger" onclick="removeFood(' + idx + ')">Remove</button>' +
      '</div>';
      
    foodList.appendChild(div);
  }
}

// --- Dashboard ---

// Load and display the dashboard with food summary and quick actions
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

// --- Home Screen Renders ---

// Get the CSS class for the expiry tier (used on dashboard cards)
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
      '<div class="fridge-thumb"><span>' + getFoodEmoji(food.name, food.category) + '</span></div>' +
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
        '<span class="food-emoji">' + getFoodEmoji(food.name, food.category) + '</span>' +
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
            '<span class="food-emoji">' + getFoodEmoji(food.name, food.category) + '</span>' +
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
        '<span class="food-emoji">' + getFoodEmoji(food.name, food.category) + '</span>' +
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

// --- Recipes ---

// Find recipes that match what's in the fridge
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
        '<img class="recipe-img" src="' + r.image + '" alt="' + r.name + '" onerror="this.style.display=&apos;none&apos;">' +
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

// === Groq AI Recipe Suggester ===
// Uses the Groq API to generate recipe ideas based on what's in the fridge
// Get a free key at https://console.groq.com
const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Flag to stop user from clicking the button twice while a request is running
let _aiRunning = false;

// Main function: asks Groq for recipe ideas based on fridge ingredients
async function generateAiRecipes() {
  // Grab the button, status text, and recipe container from the page
  var button = document.getElementById("aiRecipeButton");
  var status = document.getElementById("aiRecipeStatus");
  var container = document.getElementById("aiRecipeList");
  
  // If any of these elements are missing, stop here (wrong page)
  if (!button || !status || !container) return;
  
  // If a request is already running, ignore the click
  if (_aiRunning) return;

  // Build a list of ingredients from the fridge, including quantity if available
  // Example: "eggs (12 pieces), milk (2 L)"
  var inventory = getFoods().map(function (food) {
    return food.name + (food.quantity ? " (" + food.quantity + (food.unit ? " " + food.unit : "") + ")" : "");
  });
  
  // Guard clause: make sure there is food to cook with before sending a request
  if (inventory.length === 0) {
    status.textContent = "Add groceries in Inventory first.";
    return;
  }
  
  // Check if the user has replaced the placeholder API key with a real one
  if (GROQ_API_KEY === "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") {
    status.textContent = "Paste your Groq API key into the script to unlock AI recipes.";
    return;
  }

  // Lock the button so the user can't spam clicks while waiting
  _aiRunning = true;
  button.disabled = true;
  button.textContent = "Searching for recipes...";
  status.textContent = "Finding recipes from your groceries...";
  container.innerHTML = "";

  // Set up a timeout so the request doesn't hang forever (30 seconds max)
  var controller = new AbortController();
  var timeoutId = setTimeout(function() { controller.abort(); }, 30000);

  try {
    // Send the POST request to the Groq API
    var response = await fetch(GROQ_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        // Tell the server we're sending JSON data
        "Content-Type": "application/json",
        // Bearer token authentication with the API key
        "Authorization": "Bearer " + GROQ_API_KEY
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b", // Fast model on Groq
        max_tokens: 800, // Limit response size to avoid hitting free-tier quotas
        messages: [
          {
            // System message tells the AI how to behave and what format to return
            role: "system",
            content: "You are a chef. Return ONLY a valid JSON object with a \"recipes\" key containing an array of 2 recipes. No markdown, no backticks. Each recipe: {\"name\":\"string\",\"description\":\"string\",\"time\":\"string\",\"ingredientsUsed\":[\"string\"]}."
          },
          {
            // User message sends the actual ingredients from the fridge
            role: "user",
            content: "Here are my current ingredients: " + inventory.join(", ")
          }
        ],
      })
    });

    // Get the raw text response from the server
    var rawText = await response.text();

    // Check if the server returned an HTTP error code (e.g., 401, 429)
    if (!response.ok) {
      var errorData = {};
      try { errorData = JSON.parse(rawText); } catch (_) { /* not JSON */ }
      console.error("Groq API Error Status:", response.status, errorData, rawText);
      var apiMessage = (errorData.error && errorData.error.message) || "";
      throw new Error(apiMessage || "Groq request failed (HTTP " + response.status + ").");
    }

    // Parse the outer JSON wrapper from the API response
    var data;
    try { data = JSON.parse(rawText); }
    catch (e) {
      console.error("Could not parse Groq JSON body:", rawText);
      throw new Error("Groq returned an unexpected reply. Please try again.");
    }

    // Extract the actual text content from the AI's message
    var rawContent = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";
    console.log("Raw Groq content:", rawContent);
    
    // Try to parse the AI's response as JSON
    // The AI should return either an array directly or an object with a "recipes" key
    var wrapper = {};
    try {
      wrapper = JSON.parse(rawContent);
    } catch (e) {
      // If it's already an object (not a string), use it directly
      if (typeof rawContent === "object" && rawContent !== null) {
        wrapper = rawContent;
        console.log("Content was already an object, using it directly.");
      } else {
        console.error("Could not parse Groq content:", rawContent);
        throw new Error("Groq returned an invalid response. Please try again.");
      }
    }

    // Extract the recipes array from the wrapper (handle both formats)
    var recipes = Array.isArray(wrapper) ? wrapper : (wrapper.recipes || []);
    if (!Array.isArray(recipes) || recipes.length === 0) {
      throw new Error("Groq did not return any recipes. Please try again.");
    }

    // Helper function: pick a nice food photo from Unsplash based on the recipe name
    // Uses keyword matching so each recipe type gets a relevant image
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
        // Fallback image if no keywords match
        return "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&auto=format&fit=crop&q=80";
      }
    }

    // Fallback image in case an Unsplash URL fails to load
    var defaultImage = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&auto=format&fit=crop&q=80";

    // Loop through the recipes and build a card for each one (max 6)
    recipes.slice(0, 6).forEach(function (recipe, idx) {
      var card = document.createElement("article");
      card.className = "recipe-card ai-recipe-card";

      // Build a Google search link so the user can find the full recipe
      var cleanTitle = encodeURIComponent((recipe.name || "recipe").trim() + " recipe");
      var recipeLink = "https://www.google.com/search?q=" + cleanTitle;
      
      // Check if this recipe is already saved in favorites
      var savedKey = "ai_saved_" + idx;
      var isSaved = localStorage.getItem(savedKey) === "1";
      
      // Pick a relevant image for this recipe
      var imgUrl = getRecipeImage(recipe.name);

      // Package up the recipe data so it can be saved to favorites
      var recipeData = {
        name: recipe.name || "Untitled recipe",
        description: recipe.description || "",
        image: imgUrl,
        link: recipeLink,
        time: recipe.time || "",
        ingredientsUsed: recipe.ingredientsUsed || recipe.ingredients || []
      };
      
      // Check if this recipe is already in favorites
      var favs = getFavorites();
      var isFav = favs.some(function(f) {
        return f.name.toLowerCase() === recipeData.name.toLowerCase();
      });

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
              '<button class="btn-small btn-peach" onclick="markRecipeCooked(\'' + (recipe.name || "").replace(/'/g, "\\'") + '\', this)">Mark as cooked</button>' +
              '<button class="ai-heart-btn' + (isFav ? " saved" : "") + '" data-recipe="' + encodeURIComponent(JSON.stringify(recipeData)) + '" title="Save recipe">' +
                (isFav ? "♥" : "♡") +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div class="ai-card-thumb-wrap">' +
            '<img class="ai-card-thumb" src="' + imgUrl + '" alt="' + (recipe.name || "recipe") + '" onerror="this.src=defaultImage" >' +
          '</div>' +
        '</div>' +
        '<span class="ai-recipe-badge">✨ AI</span>';

      container.appendChild(card);
    });

    // Success! Show how many recipes were found
    status.textContent = "Found " + recipes.length + " recipe" + (recipes.length > 1 ? "s" : "") + " from your groceries.";
  } catch (error) {
    // Handle different types of errors with user-friendly messages
    if (error.name === "AbortError") {
      // This happens if the 30-second timeout kicked in
      status.textContent = "Request timed out after 30 seconds. Please try again.";
    } else if (error.name === "TypeError") {
      // Usually means no internet or CORS issue
      status.textContent = "Could not reach Groq (network or CORS blocked the request).";
    } else {
      // Show the error message from the API or a generic fallback
      status.textContent = error.message || "Something went wrong while finding recipes.";
    }
  } finally {
    // Always clean up, whether the request succeeded or failed
    clearTimeout(timeoutId); // Cancel the timeout so it doesn't fire later
    _aiRunning = false; // Unlock the button so the user can try again
    button.disabled = false; // Re-enable the button
    button.textContent = "Get AI recipe ideas"; // Reset the button text
  }
}


// --- Seasonal Recipes & Favourites ---

// List of seasonal recipes that are always shown (not AI-generated)
var SEASONAL_RECIPES = [
  {name:"Pumpkin Soup",description:"A warming autumn classic — silky smooth and full of flavour.",time:"35 min",ingredientsUsed:["pumpkin","onion","garlic","vegetable stock","cream"],url:"https://www.bbcgoodfood.com/recipes/pumpkin-soup"},
  {name:"Slow Cooker Beef Stew",description:"Hearty winter comfort food. Layer vegetables and beef, come home to dinner.",time:"6–8 hrs",ingredientsUsed:["beef chuck","carrots","potatoes","onion","beef stock"],url:"https://www.bbcgoodfood.com/recipes/slow-cooker-beef-stew"},
  {name:"Spring Vegetable Risotto",description:"Fresh asparagus and peas make this creamy risotto sing.",time:"40 min",ingredientsUsed:["arborio rice","peas","asparagus","white wine","parmesan"],url:"https://www.bbcgoodfood.com/recipes/risotto-primavera"},
  {name:"Summer Berry Pavlova",description:"Light, fluffy meringue topped with fresh cream and seasonal berries.",time:"1 hr 20 min",ingredientsUsed:["egg whites","caster sugar","double cream","strawberries","raspberries"],url:"https://www.bbcgoodfood.com/recipes/berry-pavlova"}
];

// Render the seasonal recipes into the page
function renderSeasonalRecipes() {
  var c = document.getElementById("seasonalList");
  if (!c) return;
  c.innerHTML = "";
  SEASONAL_RECIPES.forEach(function(r, i) { c.appendChild(buildRecipeCard(r, i)); });
}

// Load the user's saved favorite recipes from storage
function getFavorites() {
  try { return JSON.parse(localStorage.getItem("favoriteRecipes") || "[]"); }
  catch (e) { return []; }
}

// Save the favorites list back to storage
function saveFavorites(list) { localStorage.setItem("favoriteRecipes", JSON.stringify(list)); }

// Toggle a recipe in/out of favorites (returns true if added, false if removed)
function toggleFavorite(recipe) {
  var favs = getFavorites();
  var idx = favs.findIndex(function(f) { return f.name.toLowerCase() === recipe.name.toLowerCase(); });
  if (idx !== -1) {
    // Already in favorites, so remove it
    favs.splice(idx, 1);
  } else {
    // Not in favorites, so add it
    favs.push(recipe);
  }
  saveFavorites(favs);
  return idx === -1; // true if added, false if removed
}

// Build a recipe card element for the page (used for seasonal recipes)
function buildRecipeCard(recipe, idx) {
  var card = document.createElement("article");
  card.className = "recipe-card ai-recipe-card";
  
  // Build a link to find the recipe (either saved URL or Google search)
  var cleanTitle = encodeURIComponent((recipe.name || "recipe").trim() + " recipe");
  var recipeLink = recipe.url || ("https://www.google.com/search?q=" + cleanTitle);
  var defaultImage = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&auto=format&fit=crop&q=80";
  
  // Check if this recipe is already in the user's favorites
  var favs = getFavorites();
  var isSaved = favs.some(function(f) { return f.name.toLowerCase() === recipe.name.toLowerCase(); });
  card.innerHTML =
    '<div class="ai-card-inner"><div class="ai-card-body">' +
    '<h4 class="ai-card-title"><a href="' + recipeLink + '" target="_blank" rel="noopener noreferrer">' + (recipe.name || "Untitled recipe") + '</a></h4>' +
    '<p class="ai-card-desc">' + (recipe.description || "") + '</p>' +
    '<div class="ai-card-meta"><span class="ai-meta-tag">' + (recipe.time || "—") + '</span></div>' +
    '<div class="ai-card-actions">' +
    '<a href="' + recipeLink + '" target="_blank" rel="noopener noreferrer" class="btn btn-small">View Recipe</a>' +
    '<button class="btn-small btn-peach" onclick="markRecipeCooked(\'' + (recipe.name || "").replace(/'/g, "\\'") + '\', this)">Mark as cooked</button>' +
    '<button class="ai-heart-btn' + (isSaved ? " saved" : "") + '" data-recipe="' + encodeURIComponent(JSON.stringify(recipe)) + '">' + (isSaved ? "\u2665" : "\u2661") + '</button>' +
    '</div></div>' +
    '<div class="ai-card-thumb-wrap"><img class="ai-card-thumb" src="' + (recipe.imageUrl || defaultImage) + '" alt="' + (recipe.name || "recipe") + '" onerror="this.src=defaultImage"></div></div>' +
    '<span class="ai-recipe-badge">' + (recipe.badge || "Seasonal") + '</span>';
  return card;
}

// Load and display the user's saved favorite recipes on the favorites page
function loadFavorites() {
  var c = document.getElementById("favoritesList");
  if (!c) return;
  c.innerHTML = "";
  var favs = getFavorites();
  if (favs.length === 0) {
    c.innerHTML = '<p class="empty-state">No favourites saved yet! Click the heart on any recipe to save it here.</p>';
    return;
  }
  // Build a card for each saved favorite
  favs.forEach(function(r) { c.appendChild(buildRecipeCard(r, -1)); });
}

// Handle clicks on the heart button to save/remove favorites
document.addEventListener("click", function(e) {
  var btn = e.target.closest(".ai-heart-btn");
  if (!btn) return;
  e.preventDefault();
  
  // Get the recipe data stored in the button's data attribute
  var recipeData = btn.getAttribute("data-recipe");
  if (!recipeData) return;
  
  var recipe;
  try { recipe = JSON.parse(decodeURIComponent(recipeData)); }
  catch (err) { return; }
  
  // Toggle the recipe in/out of favorites
  var saved = toggleFavorite(recipe);
  
  // Update the button appearance (filled heart = saved, empty heart = not saved)
  btn.textContent = saved ? "\u2665" : "\u2661";
  btn.classList.toggle("saved", saved);
});

// Add missing ingredients from a recipe to the user's shopping list
function addRecipeToShopping(recipeName) {
  var recipe = RECIPES.find(function (r) { return r.name === recipeName; });
  if (!recipe) return;
  
  // Get what's already in the fridge so we don't add duplicates
  var pantry = getFoods().map(function (f) { return f.name.toLowerCase(); });
  var userListName = getUserNameForList();
  var lists = getShoppingList();
  
  if (!lists[userListName]) {
    lists[userListName] = [];
  }
  
  // For each ingredient in the recipe, check if we already have it
  recipe.ingredients.forEach(function (ing) {
    var have = pantry.some(function (p) { return p.includes(ing) || ing.includes(p); });
    // Only add to shopping list if we don't already have it
    if (!have) {
      var itemName = ing.charAt(0).toUpperCase() + ing.slice(1);
      lists[userListName].push({ name: itemName, checked: false });
    }
  });
  saveShoppingList(lists);
  alert("Missing ingredients added to shopping list.");
}

function markRecipeCooked(recipeName, btn) {
  addPoints(POINTS_RULES.addRecipe, "Cooked " + recipeName);
  var card = btn && btn.closest ? btn.closest(".recipe-card") : null;
  if (!card) {
    alert("Nice! +" + POINTS_RULES.addRecipe + " points for cooking.");
    return;
  }
  card.remove();
  
  // Check all possible recipe containers
  var aiContainer = document.getElementById("aiRecipeList");
  var seasonalContainer = document.getElementById("seasonalList");
  
  // Show "cooked everything" message if a container is now empty
  if (aiContainer && !aiContainer.querySelector(".recipe-card")) {
    aiContainer.innerHTML = "<p class=\"empty-state\">You've cooked everything here — nice! 🎉</p>";
  }
  if (seasonalContainer && !seasonalContainer.querySelector(".recipe-card")) {
    seasonalContainer.innerHTML = "<p class=\"empty-state\">You've cooked everything here — nice! 🎉</p>";
  }
  
  alert("Nice! +" + POINTS_RULES.addRecipe + " points for cooking " + recipeName + "!");
}

// --- Shopping Lists ---

// Add a new item to a specific shopping list
function addItemToList(listName) {
  var input = document.getElementById(listName + "Input");
  if (!input) return;
  var name = input.value.trim();
  if (!name) return;
  
  var lists = getShoppingList();
  if (!lists[listName]) {
    lists[listName] = [];
  }
  lists[listName].push({ name: name, checked: false });
  saveShoppingList(lists);
  input.value = "";
  displayAllShoppingLists();
}

// Toggle item checked state in a specific list
function toggleShopItemInList(listName, itemIndex) {
  var lists = getShoppingList();
  if (!lists[listName] || !lists[listName][itemIndex]) return;
  lists[listName][itemIndex].checked = !lists[listName][itemIndex].checked;
  saveShoppingList(lists);
  displayAllShoppingLists();
}

// Remove item from a specific list
function removeShopItemFromList(listName, itemIndex) {
  var lists = getShoppingList();
  if (!lists[listName]) return;
  lists[listName].splice(itemIndex, 1);
  saveShoppingList(lists);
  displayAllShoppingLists();
}

// Clear all items from a specific list
function clearList(listName) {
  var lists = getShoppingList();
  if (!lists[listName]) return;
  lists[listName] = [];
  saveShoppingList(lists);
  displayAllShoppingLists();
}

// Add a new custom list
function addNewList() {
  var listName = prompt("Enter a name for your new list:");
  if (!listName || !listName.trim()) return;
  
  var lists = getShoppingList();
  if (lists[listName.trim()]) {
    alert("A list with that name already exists.");
    return;
  }
  
  lists[listName.trim()] = [];
  saveShoppingList(lists);
  displayAllShoppingLists();
}

// Add item to the user's personal list (used by + Shop button)
function addItemToUserList(itemName) {
  var lists = getShoppingList();
  var userListName = getUserNameForList();
  
  if (!lists[userListName]) {
    lists[userListName] = [];
  }
  
  // Check if item already exists in the list
  var exists = false;
  var i;
  for (i = 0; i < lists[userListName].length; i++) {
    if (lists[userListName][i].name.toLowerCase() === itemName.toLowerCase()) {
      exists = true;
      break;
    }
  }
  
  if (!exists) {
    lists[userListName].push({ name: itemName, checked: false });
    saveShoppingList(lists);
  }
}

// Add staple item to user's list
function addStapleToList(name) {
  addItemToUserList(name);
  displayAllShoppingLists();
}

function addAllStaples() {
  var favourites = getFoods().filter(function (f) { return f.favourite; });
  var i;
  for (i = 0; i < favourites.length; i++) {
    addItemToUserList(favourites[i].name);
  }
  addPoints(10, "Added weekly staples");
}

function autoWeeklyStaples() {
  var profile = getProfile();
  var today = todayStr();
  if (profile.lastWeeklyAdd === today) { alert("Weekly staples already added today."); return; }
  addAllStaples();
  profile.lastWeeklyAdd = today;
  saveProfile(profile);
  alert("Weekly staples added to your shopping list!");
}

// Display all shopping lists on the shopping page
function displayAllShoppingLists() {
  var container = document.getElementById("shoppingListsContainer");
  if (!container) return;
  
  var lists = getShoppingList();
  container.innerHTML = "";
  
  var listNames = Object.keys(lists);
  
  // Filter out "AI List" if user has not consented to AI features
  if (!isAiEnabled()) {
    listNames = listNames.filter(function(name) {
      return name !== "AI List";
    });
  }
  
  if (listNames.length === 0) {
    container.innerHTML = '<p class="empty-state">No shopping lists yet.</p>';
    return;
  }
  
  var listIndex;
  for (listIndex = 0; listIndex < listNames.length; listIndex++) {
    var listName = listNames[listIndex];
    var items = lists[listName];
    
    var section = document.createElement("section");
    section.className = "shopping-list-card";
    
    var header = document.createElement("div");
    header.className = "card-header";
    
    var title = document.createElement("h3");
    title.textContent = listName;
    
    var clearBtn = document.createElement("button");
    clearBtn.className = "btn-small btn-outline";
    clearBtn.textContent = "Clear";
    clearBtn.onclick = (function(name) {
      return function() { clearList(name); };
    })(listName);
    
    header.appendChild(title);
    header.appendChild(clearBtn);
    
    var itemsDiv = document.createElement("div");
    itemsDiv.className = "shopping-items";
    itemsDiv.id = listName.replace(/\s+/g, "") + "Items";
    
    var itemIndex;
    for (itemIndex = 0; itemIndex < items.length; itemIndex++) {
      var item = items[itemIndex];
      var div = document.createElement("div");
      div.className = "shopping-item" + (item.checked ? " checked" : "");
      
      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.checked;
      checkbox.id = listName.replace(/\s+/g, "") + "-item-" + itemIndex;
      checkbox.onchange = (function(lName, idx) {
        return function() { toggleShopItemInList(lName, idx); };
      })(listName, itemIndex);
      
      var label = document.createElement("label");
      label.setAttribute("for", checkbox.id);
      label.textContent = getFoodEmoji(item.name, "") + " " + item.name;
      
      var removeBtn = document.createElement("button");
      removeBtn.className = "btn-small btn-danger";
      removeBtn.style.marginLeft = "auto";
      removeBtn.textContent = "✕";
      removeBtn.onclick = (function(lName, idx) {
        return function() { removeShopItemFromList(lName, idx); };
      })(listName, itemIndex);
      
      div.appendChild(checkbox);
      div.appendChild(label);
      div.appendChild(removeBtn);
      itemsDiv.appendChild(div);
    }
    
    if (items.length === 0) {
      var emptyMsg = document.createElement("p");
      emptyMsg.className = "empty-state";
      emptyMsg.textContent = "No items yet.";
      itemsDiv.appendChild(emptyMsg);
    }
    
    var addRow = document.createElement("div");
    addRow.className = "add-item-row";
    
    var input = document.createElement("input");
    input.type = "text";
    input.id = listName.replace(/\s+/g, "") + "Input";
    input.placeholder = "Add item...";
    
    var addBtn = document.createElement("button");
    addBtn.className = "btn-small";
    addBtn.textContent = "+";
    addBtn.onclick = (function(name) {
      return function() { addItemToList(name); };
    })(listName);
    
    addRow.appendChild(input);
    addRow.appendChild(addBtn);
    
    section.appendChild(header);
    section.appendChild(itemsDiv);
    section.appendChild(addRow);
    
    container.appendChild(section);
  }
}

// Legacy function for backward compatibility
function displayShoppingList() {
  displayAllShoppingLists();
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
    chip.textContent = getFoodEmoji(food.name, food.category) + " " + food.name + " +";
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

// --- Reminders ---

// Load and display the reminders page with upcoming expiry dates
function loadRemindersPage() {
  var container = document.getElementById("remindersList");
  if (!container) return;

  var foods = getFoods().slice().sort(function (a, b) { return daysLeft(a.expiry) - daysLeft(b.expiry); });
  container.innerHTML = "";

  if (foods.length === 0) {
    container.innerHTML = '<p class="empty-state">No food tracked yet.</p>';
    return;
  }

  var originalFoods = getFoods();

  foods.forEach(function (food, i) {
    var days = daysLeft(food.expiry);
    var idx = originalFoods.indexOf(food);
    var priority = reminderPriority(days);
    var div = document.createElement("div");
    div.className = "reminder-item " + priority;
    div.setAttribute("data-food-name", food.name);
    div.innerHTML =
      '<span class="food-emoji">' + getFoodEmoji(food.name, food.category) + '</span>' +
      '<div class="reminder-info"><strong>' + food.name + '</strong>' +
      '<p class="' + reminderTierClass(priority) + '">' + expiryLabel(days) +
        ' <span class="tier-pill tier-' + priority + '">' + reminderTierLabel(priority) + '</span></p></div>' +
      '<div class="food-actions">' +
        '<button class="used-btn btn-small btn-outline" data-id="' + idx + '">Used It</button>' +
        '<a class="btn btn-small" href="recipes.html">Recipe</a>' +
      '</div>';
    container.appendChild(div);
  });

  // Add click handler for "Used It" buttons on reminders page
  container.addEventListener("click", function(e) {
    if (e.target && e.target.classList.contains("used-btn")) {
      var itemId = Number(e.target.getAttribute("data-id"));
      var foods = getFoods();
      var item = foods[itemId];
      if (item) {
        // Remove item from foods
        foods.splice(itemId, 1);
        saveFoods(foods);
        // Award points
        addPoints(POINTS_RULES.useBeforeExpiry, "Used " + item.name);
        // Re-render reminders
        loadRemindersPage();
      }
    }
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

// --- Profile ---

// List of food preference options the user can choose from
var PREF_OPTIONS = ["no nuts", "no dairy", "low sugar", "organic", "quick meals", "budget-friendly"];

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
  var p = getProfile();
  p.name = document.getElementById("profileName").value.trim();
  p.email = document.getElementById("profileEmail").value.trim();
  p.diet = document.getElementById("profileDiet").value;
  p.region = document.getElementById("profileRegion") ? document.getElementById("profileRegion").value : p.region;
  p.notifications = document.getElementById("notifCheck").checked;
  p.rottingAlerts = document.getElementById("rottingCheck") ? document.getElementById("rottingCheck").checked : true;
  p.customAccent = document.getElementById("customAccent") ? document.getElementById("customAccent").value : "";
  p.customPeach = document.getElementById("customPeach") ? document.getElementById("customPeach").value : "";

  // Save AI consent toggle (if it exists on the page)
  var aiToggle = document.getElementById("aiConsentToggle");
  if (aiToggle) {
    p.aiConsent = aiToggle.checked;
  }

  p.preferences = [];
  var prefChips = document.querySelectorAll("#prefChips .pref-chip.selected");
  var i;
  for (i = 0; i < prefChips.length; i++) {
    p.preferences.push(prefChips[i].textContent);
  }

  p.pinnedTiles = [];
  var pinTiles = document.querySelectorAll("#pinTiles .pref-chip.selected");
  for (i = 0; i < pinTiles.length; i++) {
    p.pinnedTiles.push(pinTiles[i].dataset.id);
  }

  p.pinnedSections = [];
  var pinSections = document.querySelectorAll("#pinSections .pref-chip.selected");
  for (i = 0; i < pinSections.length; i++) {
    p.pinnedSections.push(pinSections[i].dataset.id);
  }

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

// --- Initialization ---

// Run setup when the page finishes loading
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


// --- Shopping List Page (old system, kept for compatibility) ---

// Get a specific shopping list by name (old system)
function getShoppingListByName(name) {
  var stored = localStorage.getItem("shoppingList_" + name);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { return []; }
  }
  return [];
}

function saveShoppingListByName(name, list) {
  localStorage.setItem("shoppingList_" + name, JSON.stringify(list));
}

function displayShoppingListItems(listId) {
  console.log("displayShoppingListItems called with:", listId);
  var container = document.getElementById(listId);
  if (!container) return;
  var list = getShoppingListByName(listId);
  container.innerHTML = "";
  if (list.length === 0) {
    container.innerHTML = '<p class="empty-state">No items in this list.</p>';
    return;
  }
  list.forEach(function(item, index) {
    var row = document.createElement("div");
    row.className = "shopping-item-row";
    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "shopping-item-checkbox";
    checkbox.checked = item.checked || false;
    checkbox.addEventListener("change", function() { toggleShoppingListItem(listId, index); });
    var input = document.createElement("input");
    input.type = "text";
    input.className = "shopping-item-text";
    input.value = item.name || "";
    input.addEventListener("blur", function() { updateShoppingListItemName(listId, index, this.value); });
    var deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-small btn-danger";
    deleteBtn.textContent = "✕";
    deleteBtn.style.marginLeft = "auto";
    deleteBtn.style.flexShrink = "0";
    deleteBtn.addEventListener("click", function() { removeShoppingListItem(listId, index); });
    row.appendChild(checkbox);
    row.appendChild(input);
    row.appendChild(deleteBtn);
    container.appendChild(row);
  });
}

function toggleShoppingListItem(listId, index) {
  var list = getShoppingListByName(listId);
  if (list[index]) { list[index].checked = !list[index].checked; saveShoppingListByName(listId, list); displayShoppingListItems(listId); }
}

function updateShoppingListItemName(listId, index, newName) {
  var list = getShoppingListByName(listId);
  if (list[index] && newName.trim()) { list[index].name = newName.trim(); saveShoppingListByName(listId, list); } else if (!newName.trim()) { removeShoppingListItem(listId, index); }
}

function removeShoppingListItem(listId, index) {
  var list = getShoppingListByName(listId);
  list.splice(index, 1);
  saveShoppingListByName(listId, list);
  displayShoppingListItems(listId);
}

function addItemToList(listId) {
  console.log("addItemToList called with:", listId);
  var input = document.getElementById(listId + "Input");
  if (!input) return;
  var name = input.value.trim();
  if (!name) return;
  var list = getShoppingListByName(listId);
  var exists = list.some(function(item) { return item.name.toLowerCase() === name.toLowerCase(); });
  if (exists) { alert(name + " is already in the list."); return; }
  list.push({ name: name, checked: false });
  saveShoppingListByName(listId, list);
  input.value = "";
  displayShoppingListItems(listId);
}

function clearList(listId) {
  if (!confirm("Clear all items from this list?")) return;
  saveShoppingListByName(listId, []);
  displayShoppingListItems(listId);
}

function initShoppingPage() {
  console.log("initShoppingPage called");
  var lists = ["aiList", "customList", "otherList1", "otherList2"];
  lists.forEach(function(listId) {
    displayShoppingListItems(listId);
    var input = document.getElementById(listId + "Input");
    if (input) { input.addEventListener("keypress", function(e) { if (e.key === "Enter") addItemToList(listId); }); }
  });
}

if (document.querySelector(".shopping-lists-container")) {
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", initShoppingPage); } else { initShoppingPage(); }

// --- Seasonal Recipes & Favourites (old system, kept for compatibility) ---

// List of seasonal recipes that are always shown (old system)
var SEASONAL_RECIPES = [
  { name: "Classic Margherita Pizza", description: "Crispy thin crust, tomato sauce, fresh mozzarella and basil. A crowd favourite.", time: "30 min", ingredientsUsed: ["flour", "tomatoes", "cheese"] },
  { name: "Chicken Stir-Fry", description: "Quick chicken strips with mixed vegetables in a savoury soy-ginger sauce.", time: "20 min", ingredientsUsed: ["chicken", "vegetables", "soy sauce"] },
  { name: "Creamy Mushroom Risotto", description: "Arborio rice slowly cooked with wild mushrooms, parmesan and white wine.", time: "40 min", ingredientsUsed: ["rice", "mushrooms", "cheese"] },
  { name: "Thai Green Curry", description: "Fragrant green curry paste with coconut milk, vegetables and Thai basil.", time: "35 min", ingredientsUsed: ["coconut milk", "vegetables", "spices"] },
];

function getFavorites() {
  try { return JSON.parse(localStorage.getItem("favoriteRecipes") || "[]"); } catch (e) { return []; }
}

function saveFavorites(list) { localStorage.setItem("favoriteRecipes", JSON.stringify(list)); }

function toggleFavorite(recipe) {
  var favs = getFavorites();
  var idx = favs.findIndex(function (f) { return f.name === recipe.name; });
  if (idx > -1) { favs.splice(idx, 1); } else { favs.push(recipe); }
  saveFavorites(favs);
  return idx === -1;
}

function renderSeasonalRecipes() {
  var container = document.getElementById("seasonalList");
  if (!container) return;
  container.innerHTML = "";
  SEASONAL_RECIPES.forEach(function (r, i) {
    var card = document.createElement("article");
    card.className = "recipe-card seasonal-card";
    var img = getRecipeImage(r.name);
    var searchQ = encodeURIComponent((r.name || "recipe").trim() + " recipe");
    var link = "https://www.google.com/search?q=" + searchQ;
    card.innerHTML =
      '<div class="ai-card-inner">' +
        '<div class="ai-card-body">' +
          '<h4><a href="' + link + '" target="_blank" rel="noopener noreferrer">' + r.name + '</a></h4>' +
          '<p>' + r.description + '</p>' +
          '<p><small>' + (r.time || "") + ' &middot; ' + (r.ingredientsUsed || []).slice(0, 3).join(", ") + '</small></p>' +
          '<div style="margin-top:10px;display:flex;gap:8px;align-items:center;">' +
            '<a href="' + link + '" target="_blank" rel="noopener noreferrer" class="btn btn-small">View Recipe</a>' +
            '<button class="ai-heart-btn" id="sh' + i + '">&#9825;</button>' +
          '</div>' +
        '</div>' +
        '<div style="min-width:100px;"><img src="' + img + '" alt="' + r.name + '" style="width:100%;border-radius:12px;object-fit:cover;height:80px;" onerror="this.src=\&apos;\&apos; + getRecipeImage(\&apos;default\&apos;) + \&apos;\&apos;"></div>' +
      '</div>' +
      '<span class="ai-recipe-badge">Seasonal</span>';
    container.appendChild(card);
    var hb = document.getElementById("sh" + i);
    if (hb) {
      (function(idx, recipe) {
        hb.addEventListener("click", function () {
          var saved = toggleFavorite(recipe);
          hb.innerHTML = saved ? "&#9829;" : "&#9825;";
          hb.className = "ai-heart-btn" + (saved ? " saved" : "");
        });
      })(i, r);
    }
  });
}

function loadFavorites() {
  var container = document.getElementById("favoritesList");
  if (!container) return;
  var favs = getFavorites();
  container.innerHTML = "";
  if (favs.length === 0) {
    container.innerHTML = '<p class="empty-state">No favourites saved yet! Click the heart on any recipe to save it here.</p>';
    return;
  }
  favs.forEach(function (r, i) {
    var card = document.createElement("article");
    card.className = "recipe-card seasonal-card";
    var img = getRecipeImage(r.name);
    var searchQ = encodeURIComponent((r.name || "recipe").trim() + " recipe");
    var link = "https://www.google.com/search?q=" + searchQ;
    card.innerHTML =
      '<div class="ai-card-inner">' +
        '<div class="ai-card-body">' +
          '<h4><a href="' + link + '" target="_blank" rel="noopener noreferrer">' + r.name + '</a></h4>' +
          '<p>' + (r.description || "") + '</p>' +
          '<p><small>' + (r.time || "") + '</small></p>' +
          '<div style="margin-top:10px;display:flex;gap:8px;align-items:center;">' +
            '<a href="' + link + '" target="_blank" rel="noopener noreferrer" class="btn btn-small">View Recipe</a>' +
            '<button class="ai-heart-btn saved" id="fh' + i + '">&#9829;</button>' +
          '</div>' +
        '</div>' +
        '<div style="min-width:100px;"><img src="' + img + '" alt="' + r.name + '" style="width:100%;border-radius:12px;object-fit:cover;height:80px;" onerror="this.src=\&apos;\&apos; + getRecipeImage(\&apos;default\&apos;) + \&apos;\&apos;"></div>' +
      '</div>' +
      '<span class="ai-recipe-badge">Saved</span>';
    container.appendChild(card);
    var hb = document.getElementById("fh" + i);
    if (hb) {
      (function(idx) {
        hb.addEventListener("click", function () {
          var f2 = getFavorites();
          f2.splice(idx, 1);
          saveFavorites(f2);
          loadFavorites();
        });
      })(i);
    }
  });
}

}