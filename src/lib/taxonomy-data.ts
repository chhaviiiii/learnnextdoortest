export type DefaultTaxonomyItem = {
  name: string;
  icon: string;
  hue: string;
  subcategories: string[];
};

export const DEFAULT_TAXONOMY: DefaultTaxonomyItem[] = [
  {
    name: "Dance",
    icon: "💃",
    hue: "from-pink-100 to-pink-50",
    subcategories: ["Classical", "Bharatanatyam", "Kathak", "Hip-Hop", "Jazz", "Salsa", "Contemporary", "Bollywood"],
  },
  {
    name: "Music",
    icon: "🎸",
    hue: "from-violet-100 to-violet-50",
    subcategories: ["Guitar", "Piano", "Vocals", "Tabla", "Drums", "Violin", "Keyboard"],
  },
  {
    name: "Art",
    icon: "🎨",
    hue: "from-amber-100 to-amber-50",
    subcategories: ["Drawing", "Painting", "Pottery", "Calligraphy", "Origami", "Mixed Media"],
  },
  {
    name: "Coding",
    icon: "💻",
    hue: "from-sky-100 to-sky-50",
    subcategories: ["Scratch", "Python", "Web Development", "Robotics", "App Development", "AI Basics"],
  },
  {
    name: "Yoga",
    icon: "🧘",
    hue: "from-emerald-100 to-emerald-50",
    subcategories: ["Hatha Yoga", "Meditation", "Pilates", "Pranayama", "Prenatal Yoga"],
  },
  {
    name: "Cooking",
    icon: "🍳",
    hue: "from-orange-100 to-orange-50",
    subcategories: ["Baking", "Indian", "Italian", "Healthy Cooking", "Kids Cooking"],
  },
  {
    name: "Fitness",
    icon: "💪",
    hue: "from-rose-100 to-rose-50",
    subcategories: ["Strength", "HIIT", "Zumba", "Pilates", "Personal Training"],
  },
  {
    name: "Chess",
    icon: "♟️",
    hue: "from-slate-100 to-slate-50",
    subcategories: ["Beginner", "Intermediate", "Advanced", "Tournament Prep", "Kids Chess"],
  },
  {
    name: "Sports",
    icon: "⚽",
    hue: "from-lime-100 to-lime-50",
    subcategories: ["Football", "Cricket", "Badminton", "Skating", "Martial Arts", "Swimming"],
  },
  {
    name: "Academic Tutoring",
    icon: "📚",
    hue: "from-cyan-100 to-cyan-50",
    subcategories: ["Math", "Science", "English", "Accounts", "Economics", "Olympiad"],
  },
  {
    name: "Language",
    icon: "🗣️",
    hue: "from-fuchsia-100 to-fuchsia-50",
    subcategories: ["English", "Hindi", "French", "Spanish", "German", "Sanskrit"],
  },
  {
    name: "Theatre",
    icon: "🎭",
    hue: "from-purple-100 to-purple-50",
    subcategories: ["Acting", "Voice", "Improv", "Stagecraft", "Public Speaking"],
  },
  {
    name: "Other",
    icon: "✨",
    hue: "from-stone-100 to-stone-50",
    subcategories: ["General", "Kids", "Adults", "Weekend", "Beginner"],
  },
];
