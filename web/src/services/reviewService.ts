import api from "@/lib/api";
import { ReviewLog } from "@/types";

export interface SubmitReviewParams {
  cardId: string;
  rating: number;
  responseMs: number;
}

export const reviewService = {
  submitReview: ({ cardId, rating, responseMs }: SubmitReviewParams): Promise<ReviewLog> =>
    api
      .post(`/cards/${cardId}/review`, {
        rating,
        response_ms: responseMs,
      })
      .then((r) => r.data),
};
