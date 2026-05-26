import { clsx } from 'clsx'

export function cn(...inputs) {
  // Simple merge — avoids needing tailwind-merge for Tailwind v4
  return clsx(inputs)
}