import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewService, SubmitReviewParams } from "@/services/reviewService";

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SubmitReviewParams) => reviewService.submitReview(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["due-cards"] });
    },
  });
}
