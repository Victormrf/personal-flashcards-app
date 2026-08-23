package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	db "github.com/Victormrf/personal-flashcards-app/db"
	"github.com/Victormrf/personal-flashcards-app/internal/email"
)

type SummaryService struct {
	queries *db.Queries
	mailer  *email.Client
	toEmail string
	userID  uuid.UUID
}

func NewSummaryService(
	queries *db.Queries,
	mailer *email.Client,
	toEmail string,
	userID uuid.UUID,
) *SummaryService {
	return &SummaryService{
		queries: queries,
		mailer:  mailer,
		toEmail: toEmail,
		userID:  userID,
	}
}

func (s *SummaryService) Send(ctx context.Context) error {
	// Fetch weekly stats
	stats, err := s.queries.GetWeeklySummary(ctx, s.userID)
	if err != nil {
		return fmt.Errorf("fetch weekly summary: %w", err)
	}

	// Fetch per-deck breakdown
	deckStats, err := s.queries.GetWeeklyStatsByDeck(ctx, s.userID)
	if err != nil {
		return fmt.Errorf("fetch deck stats: %w", err)
	}

	// Fetch current streak
	streak, err := s.queries.GetCurrentStreak(ctx, s.userID)
	if err != nil {
		return fmt.Errorf("fetch streak: %w", err)
	}

	// Skip sending if nothing was reviewed this week
	if stats.TotalReviewed == 0 {
		log.Println("weekly summary: no reviews this week, skipping email")
		return nil
	}

	retentionRate := 0
	if stats.TotalReviewed > 0 {
		retentionRate = int(float64(stats.TotalCorrect) / float64(stats.TotalReviewed) * 100)
	}

	html := buildSummaryHTML(summaryData{
		TotalReviewed: int(stats.TotalReviewed),
		RetentionRate: retentionRate,
		DaysStudied:   int(stats.DaysStudied),
		UniqueCards:   int(stats.UniqueCards),
		Streak:        int(streak),
		DeckStats:     deckStats,
	})

	subject := fmt.Sprintf("Your week in review — %d cards, %d%% retention",
		stats.TotalReviewed, retentionRate)

	return s.mailer.Send(s.toEmail, subject, html)
}

type summaryData struct {
	TotalReviewed int
	RetentionRate int
	DaysStudied   int
	UniqueCards   int
	Streak        int
	DeckStats     []db.GetWeeklyStatsByDeckRow
}

func buildSummaryHTML(d summaryData) string {
	streakText := ""
	if d.Streak > 0 {
		streakText = fmt.Sprintf(`
		<tr>
			<td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
				<span style="color:#64748b;font-size:13px;">Current streak</span>
			</td>
			<td style="padding:12px 0;border-bottom:1px solid #f1f5f9;text-align:right;">
				<strong style="color:#f59e0b;">🔥 %d days</strong>
			</td>
		</tr>`, d.Streak)
	}

	deckRows := ""
	for _, deck := range d.DeckStats {
		retention := 0
		if deck.TotalReviewed > 0 {
			retention = int(float64(deck.TotalCorrect) / float64(deck.TotalReviewed) * 100)
		}
		colour := "#10b981"
		if retention < 75 {
			colour = "#f59e0b"
		}
		if retention < 60 {
			colour = "#ef4444"
		}
		deckRows += fmt.Sprintf(`
		<tr>
			<td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;">
				%s
			</td>
			<td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;">
				<span style="color:%s;font-weight:600;font-size:13px;">%d%%</span>
				<span style="color:#94a3b8;font-size:12px;margin-left:6px;">(%d cards)</span>
			</td>
		</tr>`, deck.DeckName, colour, retention, deck.TotalReviewed)
	}

	weekStart := time.Now().AddDate(0, 0, -7).Format("Jan 2")
	weekEnd := time.Now().Format("Jan 2")

	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#4f46e5;padding:32px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">
              Recall
            </h1>
            <p style="margin:8px 0 0;color:#c7d2fe;font-size:13px;">
              Weekly summary · %s – %s
            </p>
          </td>
        </tr>

        <!-- Stats row -->
        <tr>
          <td style="padding:32px 40px 24px;">
            <table width="100%%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center;padding:0 8px;">
                  <div style="font-size:32px;font-weight:800;color:#4f46e5;">%d</div>
                  <div style="font-size:11px;color:#94a3b8;margin-top:4px;text-transform:uppercase;letter-spacing:0.05em;">Cards reviewed</div>
                </td>
                <td style="text-align:center;padding:0 8px;border-left:1px solid #f1f5f9;">
                  <div style="font-size:32px;font-weight:800;color:#10b981;">%d%%</div>
                  <div style="font-size:11px;color:#94a3b8;margin-top:4px;text-transform:uppercase;letter-spacing:0.05em;">Retention</div>
                </td>
                <td style="text-align:center;padding:0 8px;border-left:1px solid #f1f5f9;">
                  <div style="font-size:32px;font-weight:800;color:#f59e0b;">%d</div>
                  <div style="font-size:11px;color:#94a3b8;margin-top:4px;text-transform:uppercase;letter-spacing:0.05em;">Days studied</div>
                </td>
                <td style="text-align:center;padding:0 8px;border-left:1px solid #f1f5f9;">
                  <div style="font-size:32px;font-weight:800;color:#8b5cf6;">%d</div>
                  <div style="font-size:11px;color:#94a3b8;margin-top:4px;text-transform:uppercase;letter-spacing:0.05em;">Unique cards</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Detail table -->
        <tr>
          <td style="padding:0 40px 32px;">
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              %s
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 40px 40px;text-align:center;">
            <a href="http://localhost:3000" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:14px 32px;border-radius:100px;">
              Start studying →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;background:#f8fafc;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              You're receiving this because you use Recall for spaced repetition study.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
		weekStart, weekEnd,
		d.TotalReviewed, d.RetentionRate, d.DaysStudied, d.UniqueCards,
		streakText, deckRows,
	)
}