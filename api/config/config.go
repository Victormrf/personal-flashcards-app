package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL string
	RedisURL    string
	JWTSecret   string
	Port        string
	Env         string
}

func Load() Config {
	// In production this file won't exist and that's fine —
	// godotenv.Load silently does nothing if .env is missing
	godotenv.Load()

	return Config{
		DatabaseURL: mustGetenv("DATABASE_URL"),
		JWTSecret:   mustGetenv("JWT_SECRET"),
		RedisURL:    getenvOrDefault("REDIS_URL", "redis://localhost:6379"),
		Port:        getenvOrDefault("PORT", "8080"),
		Env:         getenvOrDefault("ENV", "development"),
	}
}

// mustGetenv panics at startup if a required variable is missing.
// Failing fast here is intentional — a misconfigured app should
// never start silently.
func mustGetenv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic(fmt.Sprintf("required environment variable %q is not set", key))
	}
	return v
}

func getenvOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}