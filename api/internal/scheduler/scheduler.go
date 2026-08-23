package scheduler

import (
	"context"
	"log"
	"time"

	"github.com/Victormrf/personal-flashcards-app/internal/service"
)

type Scheduler struct {
	summary  *service.SummaryService
	cronHour int
}

func New(summary *service.SummaryService, cronHour int) *Scheduler {
	return &Scheduler{summary: summary, cronHour: cronHour}
}

// Start runs in a goroutine and fires the weekly summary
// every Sunday at the configured hour.
func (s *Scheduler) Start(ctx context.Context) {
	go func() {
		log.Printf("scheduler: started, summary fires Sundays at %02d:00", s.cronHour)

		for {
			next := s.nextSunday()
			log.Printf("scheduler: next summary at %s", next.Format(time.RFC1123))

			select {
			case <-ctx.Done():
				log.Println("scheduler: stopped")
				return
			case <-time.After(time.Until(next)):
				log.Println("scheduler: firing weekly summary")
				if err := s.summary.Send(ctx); err != nil {
					log.Printf("scheduler: summary error: %v", err)
				} else {
					log.Println("scheduler: weekly summary sent")
				}
			}
		}
	}()
}

func (s *Scheduler) nextSunday() time.Time {
	now := time.Now()
	// days until next Sunday (0 = Sunday in Go's Weekday)
	daysUntilSunday := (7 - int(now.Weekday())) % 7
	if daysUntilSunday == 0 && now.Hour() >= s.cronHour {
		daysUntilSunday = 7 // already past today's fire time, wait a full week
	}

	next := time.Date(
		now.Year(), now.Month(), now.Day()+daysUntilSunday,
		s.cronHour, 0, 0, 0,
		now.Location(),
	)
	return next
}