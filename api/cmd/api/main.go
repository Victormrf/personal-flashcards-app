package main

import (
	"database/sql"
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	_ "github.com/lib/pq"

	"github.com/Victormrf/personal-flashcards-app/config"
	db "github.com/Victormrf/personal-flashcards-app/db"
	"github.com/Victormrf/personal-flashcards-app/internal/handler"
	"github.com/Victormrf/personal-flashcards-app/internal/middleware"
	"github.com/Victormrf/personal-flashcards-app/internal/repository/postgres"
	"github.com/Victormrf/personal-flashcards-app/internal/service"
	"github.com/Victormrf/personal-flashcards-app/internal/cache"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
	// 1. Load config
	cfg := config.Load()

	// 2. Connect to database
	conn, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer conn.Close()

	if err := conn.Ping(); err != nil {
		log.Fatalf("failed to ping database: %v", err)
	}
	log.Println("database connected")

	// 3. Init sqlc queries
	queries := db.New(conn)

	redisCache := cache.NewRedisCache(cfg.RedisURL)
	if err := redisCache.Ping(context.Background()); err != nil {
		log.Fatalf("failed to connect to redis: %v", err)
	}
	log.Println("redis connected")

	// 4. Wire repositories
	cardRepo   := postgres.NewCardRepository(queries)
	deckRepo   := postgres.NewDeckRepository(queries)
	reviewRepo := postgres.NewReviewRepository(queries)
	userRepo   := postgres.NewUserRepository(queries)

	// 5. Wire services
	cardSvc   := service.NewCardService(cardRepo, deckRepo)
	deckSvc   := service.NewDeckService(deckRepo)
	reviewSvc := service.NewReviewService(cardRepo, reviewRepo, redisCache)
	authSvc   := service.NewAuthService(userRepo, cfg.JWTSecret)

	// 6. Wire handlers
	cardH   := handler.NewCardHandler(cardSvc)
	deckH   := handler.NewDeckHandler(deckSvc)
	reviewH := handler.NewReviewHandler(reviewSvc)
	authH   := handler.NewAuthHandler(authSvc)

	// 7. Set up router
	r := chi.NewRouter()
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.CORS)
	r.Use(middleware.PrometheusMiddleware)

	// Public routes — no JWT required
	r.Handle("/metrics", promhttp.Handler())
	r.Post("/api/v1/auth/register", authH.Register)
	r.Post("/api/v1/auth/login",    authH.Login)

	// Protected routes — JWT required
	r.Group(func(r chi.Router) {
		r.Use(middleware.Auth(cfg.JWTSecret))

		r.Get("/api/v1/study",                       reviewH.GetDueCards)
		r.Post("/api/v1/cards/{cardID}/review",      reviewH.SubmitReview)
		r.Delete("/api/v1/cards/{cardID}",           cardH.Delete)

		r.Get("/api/v1/decks",                       deckH.List)
		r.Post("/api/v1/decks",                      deckH.Create)
		r.Delete("/api/v1/decks/{deckID}",           deckH.Delete)
		r.Post("/api/v1/decks/{deckID}/cards",       cardH.Create)
		r.Post("/api/v1/decks/{deckID}/cards/batch", cardH.CreateMany)
		r.Get("/api/v1/decks/{deckID}",             deckH.GetByID)
		r.Get("/api/v1/decks/{deckID}/cards",       cardH.GetByDeck)
		r.Get("/api/v1/categories", 				deckH.GetCategories)
	})

	// 8. Start server
	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("server listening on %s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("server error: %v", err)
	}
}