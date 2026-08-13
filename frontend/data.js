const FOOD_EMOJIS = {
  milk: "M", bread: "B", egg: "E", eggs: "E", chicken: "C", rice: "R",
  pasta: "P", tomato: "T", tomatoes: "T", spinach: "S", banana: "B",
  apple: "A", avocado: "A", cheese: "CH", yogurt: "Y", berries: "B",
  strawberry: "ST", lemon: "L", onion: "O", garlic: "G", potato: "P",
  carrot: "C", broccoli: "B", fish: "F", beef: "BF", pork: "P",
  butter: "BT", cream: "C", lettuce: "L", cucumber: "CU", pepper: "P",
  mushroom: "M", corn: "C", pumpkin: "P", lentils: "L", beans: "B",
  tofu: "T", honey: "H", chocolate: "C", coffee: "C", tea: "T",
  juice: "J", water: "W", flour: "F", sugar: "S", salt: "S",
  oil: "O", vegetables: "V", fruit: "F", meat: "M", default: "F"
};

const CATEGORIES = [
  "dairy", "meat", "produce", "grains", "pantry", "frozen", "beverages", "other"
];

const SHELF_LIFE = {
  dairy: 7, meat: 3, produce: 5, grains: 30, pantry: 90, frozen: 60, beverages: 14, other: 7
};

const RECIPES = [
  {
    name: "Spinach Dhal",
    emoji: "D",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=250&fit=crop",
    ingredients: ["spinach", "lentils", "onion"],
    time: "30 min",
    diet: ["vegan", "vegetarian", "none"],
    description: "A warming lentil curry — perfect for using up spinach before it wilts.",
    steps: "1. Cook lentils until soft.\n2. Sauté onion and garlic.\n3. Add spinach and spices.\n4. Simmer 10 minutes.",
    alternatives: {
      vegan: { swap: "Use coconut oil instead of ghee", name: "Vegan Spinach Dhal" },
      "gluten-free": { swap: "Serve with rice instead of naan", name: "GF Spinach Dhal" },
      keto: { swap: "Skip lentils, double spinach with cream", name: "Keto Spinach Curry" }
    }
  },
  {
    name: "Vegetable Fried Rice",
    emoji: "R",
    image: "https://images.unsplash.com/photo-1603133872878-684fc097d39d?w=400&h=250&fit=crop",
    ingredients: ["rice", "vegetables", "egg"],
    time: "20 min",
    diet: ["none", "vegetarian"],
    description: "Quick fried rice using leftover rice and any vegetables going soft.",
    steps: "1. Fry vegetables in oil.\n2. Add cold rice and soy sauce.\n3. Push aside, scramble egg.\n4. Mix and serve.",
    alternatives: {
      vegan: { swap: "Skip egg, add tofu cubes", name: "Vegan Fried Rice" },
      "gluten-free": { swap: "Use tamari instead of soy sauce", name: "GF Fried Rice" }
    }
  },
  {
    name: "Banana Smoothie Bowl",
    emoji: "B",
    image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=250&fit=crop",
    ingredients: ["banana", "yogurt", "berries"],
    time: "5 min",
    diet: ["vegetarian", "none"],
    description: "Use overripe bananas for a creamy breakfast bowl.",
    steps: "1. Blend banana and yogurt.\n2. Pour into bowl.\n3. Top with berries and granola.",
    alternatives: {
      vegan: { swap: "Use coconut yogurt", name: "Vegan Smoothie Bowl" },
      "no dairy": { swap: "Use oat milk and frozen banana", name: "Dairy-Free Smoothie Bowl" },
      keto: { swap: "Skip banana, use avocado and berries", name: "Keto Smoothie Bowl" }
    }
  },
  {
    name: "Chicken Stir-Fry",
    emoji: "S",
    image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=250&fit=crop",
    ingredients: ["chicken", "vegetables", "soy sauce"],
    time: "25 min",
    diet: ["none", "keto", "paleo"],
    description: "Throw in whatever vegetables need using up first.",
    steps: "1. Cook chicken strips.\n2. Add vegetables by expiry order.\n3. Season with soy sauce and garlic.",
    alternatives: {
      vegetarian: { swap: "Replace chicken with tofu or tempeh", name: "Tofu Stir-Fry" },
      vegan: { swap: "Use tofu and tamari", name: "Vegan Stir-Fry" },
      "gluten-free": { swap: "Use tamari and rice noodles", name: "GF Stir-Fry" }
    }
  },
  {
    name: "Tomato Pasta",
    emoji: "P",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=250&fit=crop",
    ingredients: ["tomato", "pasta", "garlic"],
    time: "20 min",
    diet: ["vegan", "vegetarian", "none"],
    description: "Simple pasta with soft tomatoes that are past their peak.",
    steps: "1. Cook pasta.\n2. Sauté garlic, add chopped tomatoes.\n3. Simmer into sauce.\n4. Toss with pasta.",
    alternatives: {
      "gluten-free": { swap: "Use GF pasta or zucchini noodles", name: "GF Tomato Pasta" },
      keto: { swap: "Use spiralised zucchini instead of pasta", name: "Keto Zoodle Marinara" }
    }
  },
  {
    name: "Avocado Toast",
    emoji: "A",
    image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&h=250&fit=crop",
    ingredients: ["avocado", "bread", "lemon"],
    time: "5 min",
    diet: ["vegan", "vegetarian", "none"],
    description: "Use avocados before they go brown — mash with lemon.",
    steps: "1. Toast bread.\n2. Mash avocado with lemon and salt.\n3. Spread and top as you like.",
    alternatives: {
      "gluten-free": { swap: "Use GF bread", name: "GF Avocado Toast" },
      keto: { swap: "Serve on cloud bread or lettuce cups", name: "Keto Avocado Bites" }
    }
  },
  {
    name: "Berry Overnight Oats",
    emoji: "B",
    image: "https://images.unsplash.com/photo-1517673400269-3969f6a6c231?w=400&h=250&fit=crop",
    ingredients: ["berries", "oats", "yogurt"],
    time: "5 min prep",
    diet: ["vegetarian", "none"],
    description: "Prep tonight, eat tomorrow — great for soft berries.",
    steps: "1. Mix oats and yogurt.\n2. Add berries.\n3. Refrigerate overnight.",
    alternatives: {
      vegan: { swap: "Use plant yogurt and maple syrup", name: "Vegan Overnight Oats" },
      "no dairy": { swap: "Use almond milk", name: "Dairy-Free Overnight Oats" }
    }
  },
  {
    name: "Pumpkin Soup",
    emoji: "P",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=250&fit=crop",
    ingredients: ["pumpkin", "onion", "cream"],
    time: "40 min",
    diet: ["vegetarian", "none"],
    description: "Creamy soup perfect for autumn pumpkin.",
    steps: "1. Roast pumpkin.\n2. Sauté onion.\n3. Blend with stock and cream.",
    alternatives: {
      vegan: { swap: "Use coconut cream", name: "Vegan Pumpkin Soup" },
      keto: { swap: "Extra cream, skip bread side", name: "Keto Pumpkin Soup" }
    }
  }
];

const PRICE_DATA = [
  { item: "milk", coles: 2.50, woolies: 2.40, aldi: 2.20 },
  { item: "bread", coles: 3.00, woolies: 2.80, aldi: 2.50 },
  { item: "eggs", coles: 6.50, woolies: 6.00, aldi: 5.50 },
  { item: "chicken", coles: 9.00, woolies: 8.50, aldi: 7.80 },
  { item: "banana", coles: 3.50, woolies: 3.20, aldi: 2.90 },
  { item: "spinach", coles: 3.00, woolies: 2.80, aldi: 2.50 },
  { item: "tomato", coles: 4.50, woolies: 4.00, aldi: 3.50 },
  { item: "avocado", coles: 2.00, woolies: 1.80, aldi: 1.50 },
  { item: "rice", coles: 12.00, woolies: 11.50, aldi: 10.00 },
  { item: "pasta", coles: 2.00, woolies: 1.80, aldi: 1.50 },
  { item: "cheese", coles: 7.00, woolies: 6.50, aldi: 5.80 },
  { item: "yogurt", coles: 5.50, woolies: 5.00, aldi: 4.50 },
  { item: "apple", coles: 4.00, woolies: 3.80, aldi: 3.20 },
  { item: "potato", coles: 3.50, woolies: 3.00, aldi: 2.80 },
  { item: "onion", coles: 2.50, woolies: 2.30, aldi: 2.00 },
  { item: "butter", coles: 5.50, woolies: 5.00, aldi: 4.50 },
  { item: "berries", coles: 4.50, woolies: 4.00, aldi: 3.80 },
  { item: "pumpkin", coles: 3.00, woolies: 2.80, aldi: 2.50 }
];

const BROCHURES = {
  coles: {
    name: "Coles",
    color: "#e10000",
    deals: [
      { item: "Chicken breast 1kg", price: "$9.00", was: "$12.00", until: "Sun" },
      { item: "Coles cheese block 500g", price: "$6.00", was: "$8.00", until: "Tue" },
      { item: "Bananas per kg", price: "$2.90", was: "$3.50", until: "Wed" },
      { item: "Helga's bread", price: "2 for $5", was: "$3.50 ea", until: "Sun" },
      { item: "Fresh salmon 200g", price: "$8.00", was: "$11.00", until: "Sat" }
    ]
  },
  woolies: {
    name: "Woolworths",
    color: "#178841",
    deals: [
      { item: "Macro organic eggs 12pk", price: "$5.50", was: "$7.00", until: "Sun" },
      { item: "Macro milk 2L", price: "$2.40", was: "$3.10", until: "Tue" },
      { item: "Avocados 5 pack", price: "$4.00", was: "$6.00", until: "Wed" },
      { item: "Woolworths pasta 500g", price: "$1.20", was: "$1.80", until: "Sun" },
      { item: "RSPCA chicken thighs 1kg", price: "$7.50", was: "$10.00", until: "Sat" }
    ]
  },
  aldi: {
    name: "Aldi",
    color: "#00529b",
    deals: [
      { item: "Farmwood frozen meals", price: "$3.99", was: "$5.49", until: "Wed" },
      { item: "Inner Goodness almond milk", price: "$1.99", was: "$2.49", until: "Sun" },
      { item: "Fresh avocados each", price: "$1.29", was: "$1.79", until: "Tue" },
      { item: "Broccoli per kg", price: "$2.99", was: "$4.49", until: "Sat" },
      { item: "Baker's Life bread", price: "$1.69", was: "$2.19", until: "Sun" }
    ]
  }
};

const AU_REGIONS = [
  "NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"
];

const POINTS_RULES = {
  addFood: 5,
  useBeforeExpiry: 20,
  scanReceipt: 15,
  addRecipe: 10,
  weeklyStreak: 50,
  preventWaste: 25
};

const DASHBOARD_SECTIONS = [
  { id: "expiring", label: "Use First", icon: "⚠️" },
  { id: "rotting", label: "Rotting Alert", icon: "R" },
  { id: "pantry", label: "Your Pantry", icon: "P" },
  { id: "meals", label: "Meal Ideas", icon: "M" },
  { id: "rewards", label: "Rewards", icon: "W" },
  { id: "seasonal", label: "Seasonal Produce", icon: "S" }
];
