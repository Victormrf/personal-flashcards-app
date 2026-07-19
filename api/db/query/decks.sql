-- name: GetDecksByUser :many
SELECT * FROM decks
WHERE user_id = $1
ORDER BY created_at ASC;

-- name: GetDeckByID :one
SELECT * FROM decks
WHERE id = $1;

-- name: CreateDeck :one
INSERT INTO decks (id, user_id, name, description, category)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: DeleteDeck :exec
DELETE FROM decks WHERE id = $1;

-- name: GetCategoriesByUser :many
SELECT DISTINCT category
FROM decks
WHERE user_id = $1
  AND category IS NOT NULL
  AND category != ''
ORDER BY category ASC;