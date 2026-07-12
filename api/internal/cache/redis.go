// Redis client wrapper

package cache

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/Victormrf/personal-flashcards-app/internal/metrics"
)

type RedisCache struct {
	client *redis.Client
}

func NewRedisCache(url string) *RedisCache {
	opts, err := redis.ParseURL(url)
	if err != nil {
		panic("invalid redis url: " + err.Error())
	}
	return &RedisCache{client: redis.NewClient(opts)}
}

func (c *RedisCache) Get(ctx context.Context, key string) (string, error) {
	val, err := c.client.Get(ctx, key).Result()
	if err != nil {
		metrics.CacheMissesTotal.Inc()
		return "", err
	}
	metrics.CacheHitsTotal.Inc()
	return val, nil
}

func (c *RedisCache) Set(ctx context.Context, key string, value string, ttl time.Duration) error {
	return c.client.Set(ctx, key, value, ttl).Err()
}

func (c *RedisCache) Delete(ctx context.Context, key string) error {
	return c.client.Del(ctx, key).Err()
}

func (c *RedisCache) Ping(ctx context.Context) error {
	return c.client.Ping(ctx).Err()
}


