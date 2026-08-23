-- name: CreateReviewLog :exec
INSERT INTO review_logs (id, card_id, user_id, rating, interval_days, ease_factor, response_ms)
VALUES ($1, $2, $3, $4, $5, $6, $7);

-- name: GetReviewLogsByUser :many
SELECT * FROM review_logs
WHERE user_id = $1
ORDER BY reviewed_at DESC
LIMIT $2;

-- name: GetWeeklySummary :one
SELECT
    COUNT(*)::int                                                    AS total_reviewed,
    COUNT(*) FILTER (WHERE rating >= 3)::int                        AS total_correct,
    COUNT(DISTINCT DATE(reviewed_at))::int                          AS days_studied,
    COUNT(DISTINCT card_id)::int                                     AS unique_cards
FROM review_logs
WHERE user_id    = $1
  AND reviewed_at >= NOW() - INTERVAL '7 days';

-- name: GetWeeklyStatsByDeck :many
SELECT
    d.name                                                           AS deck_name,
    COUNT(*)::int                                                    AS total_reviewed,
    COUNT(*) FILTER (WHERE rl.rating >= 3)::int                     AS total_correct
FROM review_logs rl
JOIN cards  c ON c.id  = rl.card_id
JOIN decks  d ON d.id  = c.deck_id
WHERE rl.user_id    = $1
  AND rl.reviewed_at >= NOW() - INTERVAL '7 days'
GROUP BY d.id, d.name
ORDER BY total_reviewed DESC; 

-- name: GetCurrentStreak :one
WITH daily_reviews AS (
    SELECT DISTINCT DATE(reviewed_at) AS review_date
    FROM review_logs
    WHERE user_id = $1
),
streak AS (
    SELECT review_date,
           review_date - (ROW_NUMBER() OVER (ORDER BY review_date))::int AS grp
    FROM daily_reviews
)
SELECT COUNT(*)::int AS streak
FROM streak
WHERE grp = (
    SELECT grp FROM streak
    WHERE review_date = CURRENT_DATE
       OR review_date = CURRENT_DATE - 1
    ORDER BY review_date DESC
    LIMIT 1
);