-- name: CreateStudySession :one
INSERT INTO study_sessions (id, user_id, name)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetStudySessionsByUser :many
SELECT s.*,
       ARRAY_AGG(sd.deck_id) FILTER (WHERE sd.deck_id IS NOT NULL) AS deck_ids
FROM study_sessions s
LEFT JOIN session_decks sd ON sd.session_id = s.id
WHERE s.user_id = $1
GROUP BY s.id
ORDER BY s.created_at DESC;

-- name: GetStudySessionByID :one
SELECT s.*,
       ARRAY_AGG(sd.deck_id) FILTER (WHERE sd.deck_id IS NOT NULL) AS deck_ids
FROM study_sessions s
LEFT JOIN session_decks sd ON sd.session_id = s.id
WHERE s.id = $1
GROUP BY s.id;

-- name: AddDeckToSession :exec
INSERT INTO session_decks (session_id, deck_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: RemoveDeckFromSession :exec
DELETE FROM session_decks
WHERE session_id = $1 AND deck_id = $2;

-- name: DeleteStudySession :exec
DELETE FROM study_sessions WHERE id = $1;