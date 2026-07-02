-- name: GetDecksByUser :many
SELECT * FROM decks
WHERE user_id = $1
ORDER BY created_at ASC;

-- name: GetDeckByID :one
SELECT * FROM decks
WHERE id = $1;

-- name: CreateDeck :one
INSERT INTO decks (id, user_id, name, description)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: DeleteDeck :exec
DELETE FROM decks WHERE id = $1;