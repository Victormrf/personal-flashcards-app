-- name: GetCardByID :one
SELECT * FROM cards
WHERE id = $1;

-- name: GetDueCards :many
SELECT * FROM cards
WHERE deck_id IN (
    SELECT id FROM decks WHERE user_id = $1
)
AND due_at <= $2
ORDER BY due_at ASC
LIMIT $3;

-- name: GetCardsByDeck :many
SELECT * FROM cards
WHERE deck_id = $1
ORDER BY created_at ASC;

-- name: CreateCard :one
INSERT INTO cards (id, deck_id, front, back, due_at)
VALUES ($1, $2, $3, $4, NOW())
RETURNING *;

-- name: UpdateCardScheduling :exec
UPDATE cards
SET
    interval_days = $2,
    repetitions   = $3,
    ease_factor   = $4,
    due_at        = $5
WHERE id = $1;

-- name: DeleteCard :exec
DELETE FROM cards WHERE id = $1;