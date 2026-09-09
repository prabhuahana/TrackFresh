// data.js - all the constant data and lookup tables for TrackFresh

// food emoji codes - each item gets a short letter badge
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

// the different food types we sort things into
const CATEGORIES = [
  "dairy", "meat", "produce", "grains", "pantry", "frozen", "beverages", "other"
];

// how many days each food type stays good for
const SHELF_LIFE = {
  dairy: 7, meat: 3, produce: 5, grains: 30, pantry: 90, frozen: 60, beverages: 14, other: 7
};

// recipe ideas built into the app
const RECIPES = [
  {
    name: "Mac and Cheese",
    emoji: "M",
    image: "https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=400&h=250&fit=crop",
    ingredients: ["pasta", "cheese", "milk"],
    time: "25 min",
    diet: ["vegetarian", "none"],
    description: "A warm, easy dinner made with pasta, cheese, and milk.",
    steps: "1. Cook the pasta.\n2. Warm the milk and add cheese.\n3. Stir in the pasta.\n4. Season and serve.",
    alternatives: {
      vegan: { swap: "Use plant milk and vegan cheese", name: "Vegan Mac and Cheese" },
      "gluten-free": { swap: "Use gluten-free pasta", name: "GF Mac and Cheese" }
    }
  },
  {
    name: "Fresh Garden Salad",
    emoji: "S",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2egete?w=400&h=250&fit=crop",
    ingredients: ["lettuce", "tomato", "cucumber"],
    time: "10 min",
    diet: ["vegan", "vegetarian", "none"],
    description: "A crisp salad for using fresh vegetables from the fridge.",
    steps: "1. Wash the vegetables.\n2. Chop the lettuce, tomato, and cucumber.\n3. Mix in a bowl.\n4. Add dressing and serve.",
    alternatives: {
      "no dairy": { swap: "Use a dairy-free dressing", name: "Dairy-Free Garden Salad" }
    }
  }
];

// sample prices from different shops
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

// weekly deals from the supermarkets
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

  { id: "seasonal", label: "Seasonal Produce", icon: "S" }
];
