/* ------------------------------------------------------------------ */
/*  Shared types for Category management                               */
/* ------------------------------------------------------------------ */

export type Subcategory = {
  id: string;
  subcategoryCode: string;
  name: string;
  activeListings: number;
  createdAt: string;
};

export type Category = {
  id: string;
  categoryCode: string;
  name: string;
  subcategories: Subcategory[];
  activeListings: number;
  createdAt: string;
};

/* ------------------------------------------------------------------ */
/*  ID generators (client-side only, replaced by DB ids later)         */
/* ------------------------------------------------------------------ */

let _catSeq = 8;
let _subSeq = 30;

export function nextCatId() {
  return `cat_${_catSeq++}`;
}
export function nextSubId() {
  return `sub_${_subSeq++}`;
}

/* ------------------------------------------------------------------ */
/*  Seed data (from requirements §8.5)                                 */
/* ------------------------------------------------------------------ */

export const SEED_CATEGORIES: Category[] = [
  {
    id: "cat_1",
    categoryCode: "CAT-001",
    name: "Art & Craft",
    activeListings: 12,
    createdAt: "2025-11-01T10:00:00.000Z",
    subcategories: [
      { id: "sub_1", subcategoryCode: "SUB-001", name: "Drawing & Sketching", activeListings: 5, createdAt: "2025-11-01T10:00:00.000Z" },
      { id: "sub_2", subcategoryCode: "SUB-002", name: "Painting", activeListings: 4, createdAt: "2025-11-01T10:00:00.000Z" },
      { id: "sub_3", subcategoryCode: "SUB-003", name: "Sculpture & Clay", activeListings: 2, createdAt: "2025-11-01T10:00:00.000Z" },
      { id: "sub_4", subcategoryCode: "SUB-004", name: "DIY & Mixed Media", activeListings: 1, createdAt: "2025-11-01T10:00:00.000Z" },
    ],
  },
  {
    id: "cat_2",
    categoryCode: "CAT-002",
    name: "Brain Boost",
    activeListings: 8,
    createdAt: "2025-11-02T10:00:00.000Z",
    subcategories: [
      { id: "sub_5", subcategoryCode: "SUB-005", name: "Chess", activeListings: 3, createdAt: "2025-11-02T10:00:00.000Z" },
      { id: "sub_6", subcategoryCode: "SUB-006", name: "Abacus", activeListings: 2, createdAt: "2025-11-02T10:00:00.000Z" },
      { id: "sub_7", subcategoryCode: "SUB-007", name: "Rubik's Cube", activeListings: 1, createdAt: "2025-11-02T10:00:00.000Z" },
      { id: "sub_8", subcategoryCode: "SUB-008", name: "Memory & Concentration", activeListings: 2, createdAt: "2025-11-02T10:00:00.000Z" },
    ],
  },
  {
    id: "cat_3",
    categoryCode: "CAT-003",
    name: "Cooking",
    activeListings: 9,
    createdAt: "2025-11-03T10:00:00.000Z",
    subcategories: [
      { id: "sub_9", subcategoryCode: "SUB-009", name: "Baking", activeListings: 3, createdAt: "2025-11-03T10:00:00.000Z" },
      { id: "sub_10", subcategoryCode: "SUB-010", name: "Indian Cuisine", activeListings: 3, createdAt: "2025-11-03T10:00:00.000Z" },
      { id: "sub_11", subcategoryCode: "SUB-011", name: "World Cuisine", activeListings: 2, createdAt: "2025-11-03T10:00:00.000Z" },
      { id: "sub_12", subcategoryCode: "SUB-012", name: "Nutrition & Healthy Eating", activeListings: 1, createdAt: "2025-11-03T10:00:00.000Z" },
    ],
  },
  {
    id: "cat_4",
    categoryCode: "CAT-004",
    name: "Performing Arts",
    activeListings: 15,
    createdAt: "2025-11-04T10:00:00.000Z",
    subcategories: [
      { id: "sub_13", subcategoryCode: "SUB-013", name: "Dance", activeListings: 6, createdAt: "2025-11-04T10:00:00.000Z" },
      { id: "sub_14", subcategoryCode: "SUB-014", name: "Music", activeListings: 5, createdAt: "2025-11-04T10:00:00.000Z" },
      { id: "sub_15", subcategoryCode: "SUB-015", name: "Theatre & Drama", activeListings: 3, createdAt: "2025-11-04T10:00:00.000Z" },
      { id: "sub_16", subcategoryCode: "SUB-016", name: "Spoken Word", activeListings: 1, createdAt: "2025-11-04T10:00:00.000Z" },
    ],
  },
  {
    id: "cat_5",
    categoryCode: "CAT-005",
    name: "Sports Lab",
    activeListings: 11,
    createdAt: "2025-11-05T10:00:00.000Z",
    subcategories: [
      { id: "sub_17", subcategoryCode: "SUB-017", name: "Cricket", activeListings: 3, createdAt: "2025-11-05T10:00:00.000Z" },
      { id: "sub_18", subcategoryCode: "SUB-018", name: "Football", activeListings: 2, createdAt: "2025-11-05T10:00:00.000Z" },
      { id: "sub_19", subcategoryCode: "SUB-019", name: "Swimming", activeListings: 2, createdAt: "2025-11-05T10:00:00.000Z" },
      { id: "sub_20", subcategoryCode: "SUB-020", name: "Martial Arts", activeListings: 2, createdAt: "2025-11-05T10:00:00.000Z" },
      { id: "sub_21", subcategoryCode: "SUB-021", name: "Yoga & Fitness", activeListings: 2, createdAt: "2025-11-05T10:00:00.000Z" },
    ],
  },
  {
    id: "cat_6",
    categoryCode: "CAT-006",
    name: "Personality Development",
    activeListings: 0,
    createdAt: "2025-11-06T10:00:00.000Z",
    subcategories: [
      { id: "sub_22", subcategoryCode: "SUB-022", name: "Public Speaking", activeListings: 0, createdAt: "2025-11-06T10:00:00.000Z" },
      { id: "sub_23", subcategoryCode: "SUB-023", name: "Leadership", activeListings: 0, createdAt: "2025-11-06T10:00:00.000Z" },
      { id: "sub_24", subcategoryCode: "SUB-024", name: "Social Skills", activeListings: 0, createdAt: "2025-11-06T10:00:00.000Z" },
      { id: "sub_25", subcategoryCode: "SUB-025", name: "Mindfulness", activeListings: 0, createdAt: "2025-11-06T10:00:00.000Z" },
    ],
  },
  {
    id: "cat_7",
    categoryCode: "CAT-007",
    name: "Tech & Coding",
    activeListings: 14,
    createdAt: "2025-11-07T10:00:00.000Z",
    subcategories: [
      { id: "sub_26", subcategoryCode: "SUB-026", name: "Scratch & Block Coding", activeListings: 4, createdAt: "2025-11-07T10:00:00.000Z" },
      { id: "sub_27", subcategoryCode: "SUB-027", name: "Python", activeListings: 5, createdAt: "2025-11-07T10:00:00.000Z" },
      { id: "sub_28", subcategoryCode: "SUB-028", name: "Robotics", activeListings: 3, createdAt: "2025-11-07T10:00:00.000Z" },
      { id: "sub_29", subcategoryCode: "SUB-029", name: "Game Development", activeListings: 2, createdAt: "2025-11-07T10:00:00.000Z" },
    ],
  },
];
