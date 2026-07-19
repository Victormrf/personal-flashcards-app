export interface CategoryColors {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

export function categoryColor(category: string): CategoryColors {
  if (!category) {
    return {
      bg:     "hsl(220, 15%, 92%)",
      text:   "hsl(220, 15%, 35%)",
      border: "hsl(220, 15%, 80%)",
      dot:    "hsl(220, 15%, 60%)",
    };
  }

  // djb2 hash
  let hash = 5381;
  for (let i = 0; i < category.length; i++) {
    hash = ((hash << 5) + hash) + category.charCodeAt(i);
    hash = hash & hash;
  }

  const hue = Math.abs(hash) % 360;

  return {
    bg:     `hsl(${hue}, 65%, 93%)`,
    text:   `hsl(${hue}, 55%, 28%)`,
    border: `hsl(${hue}, 55%, 82%)`,
    dot:    `hsl(${hue}, 65%, 55%)`,
  };
}