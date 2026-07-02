package postgres

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	db "github.com/Victormrf/personal-flashcards-app/db"
	"github.com/Victormrf/personal-flashcards-app/internal/domain"
	"github.com/Victormrf/personal-flashcards-app/internal/repository"
)

type reviewRepository struct {
	q *db.Queries
}

func NewReviewRepository(q *db.Queries) repository.ReviewRepository {
	return &reviewRepository{q: q}
}

func (r *reviewRepository) Create(ctx context.Context, log domain.ReviewLog) error {
	return r.q.CreateReviewLog(ctx, db.CreateReviewLogParams{
		ID:           log.ID,
		CardID:       log.CardID,
		UserID:       log.UserID,
		Rating:       int32(log.Rating),
		IntervalDays: int32(log.IntervalDays),
		EaseFactor:   log.EaseFactor,
		ResponseMs: sql.NullInt32{
			Int32: int32(log.ResponseMs),
			Valid: log.ResponseMs != 0,
		},
	})
}

func (r *reviewRepository) FindByUser(ctx context.Context, userID uuid.UUID, limit int32) ([]domain.ReviewLog, error) {
	rows, err := r.q.GetReviewLogsByUser(ctx, db.GetReviewLogsByUserParams{
		UserID: userID,
		Limit:  limit,
	})
	if err != nil {
		return nil, err
	}
	logs := make([]domain.ReviewLog, len(rows))
	for i, row := range rows {
		logs[i] = domain.ReviewLog{
			ID:           row.ID,
			CardID:       row.CardID,
			UserID:       row.UserID,
			Rating:       int(row.Rating),
			IntervalDays: int(row.IntervalDays),
			EaseFactor:   row.EaseFactor,
			ResponseMs:   int(row.ResponseMs.Int32),
			ReviewedAt:   row.ReviewedAt,
		}
	}
	return logs, nil
}