export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Deck {
  id: string;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Card {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  due_at: string;
  created_at: string;
}

export interface ReviewLog {
  id: string;
  card_id: string;
  user_id: string;
  rating: number;
  interval_days: number;
  ease_factor: number;
  response_ms: number;
  reviewed_at: string;
}