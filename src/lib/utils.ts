import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get marker category details (color, symbol)
export function getCategoryDetails(category: string) {
  switch (category) {
    case "Culture & Religion":
      return { symbol: "🏛️", bg: "bg-amber-500", border: "border-amber-600" }
    case "Food & Drink":
      return { symbol: "🍔", bg: "bg-red-500", border: "border-red-600" }
    case "Nature & Parks":
      return { symbol: "🌳", bg: "bg-green-500", border: "border-green-600" }
    case "Services & Facilities":
      return { symbol: "🔧", bg: "bg-teal-500", border: "border-teal-600" }
    default:
      return { symbol: "📍", bg: "bg-blue-500", border: "border-blue-600" }
  }
}
