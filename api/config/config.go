package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL 	string
	RedisURL    	string
	JWTSecret   	string
	Port        	string
	Env         	string
	ResendAPIKey   	string
    SummaryEmail   	string
	SummaryUserID   string
    SummaryCronHour int
}

func Load() Config {
	godotenv.Load()

	cronHour := 9
    if h := os.Getenv("SUMMARY_CRON_HOUR"); h != "" {
        if parsed, err := strconv.Atoi(h); err == nil {
            cronHour = parsed
        }
    }

	return Config{
		DatabaseURL: 		mustGetenv("DATABASE_URL"),
		JWTSecret:   		mustGetenv("JWT_SECRET"),
		RedisURL:    		getenvOrDefault("REDIS_URL", "redis://localhost:6379"),
		Port:        		getenvOrDefault("PORT", "8080"),
		Env:         		getenvOrDefault("ENV", "development"),
		ResendAPIKey:    	getenvOrDefault("RESEND_API_KEY", ""),
        SummaryEmail:    	getenvOrDefault("SUMMARY_EMAIL", ""),
		SummaryUserID:   	getenvOrDefault("SUMMARY_USER_ID", ""),
        SummaryCronHour: 	cronHour,
	}
}

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