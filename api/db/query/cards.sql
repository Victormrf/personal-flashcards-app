-- name: GetCardByID :one
SELECT * FROM cards
WHERE id = $1;

-- name: GetDueCards :many
SELECT * FROM cards
WHERE deck_id IN (
    SELECT id FROM decks WHERE user_id = sqlc.arg('user_id')
)
AND (sqlc.narg('deck_id')::uuid IS NULL OR deck_id = sqlc.narg('deck_id'))
AND due_at <= sqlc.arg('due_at')
ORDER BY due_at ASC
LIMIT sqlc.arg('limit');

-- name: GetCardsByDeck :many
SELECT * FROM cards
WHERE deck_id = $1
ORDER BY created_at ASC;

-- name: CreateCard :one
INSERT INTO cards (id, deck_id, front, back, due_at)
VALUES ($1, $2, $3, $4, NOW())
RETURNING *;

-- name: CreateManyCards :exec
INSERT INTO cards (id, deck_id, front, back, due_at)
SELECT
  unnest($1::uuid[]),
  unnest($2::uuid[]),
  unnest($3::text[]),
  unnest($4::text[]),
  NOW();

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