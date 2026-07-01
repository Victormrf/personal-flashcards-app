-- name: CreateReviewLog :exec
INSERT INTO review_logs (id, card_id, user_id, rating, interval_days, ease_factor, response_ms)
VALUES ($1, $2, $3, $4, $5, $6, $7);

-- name: GetReviewLogsByUser :many
SELECT * FROM review_logs
WHERE user_id = $1
ORDER BY reviewed_at DESC
LIMIT $2;