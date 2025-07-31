package db

import (
	"context"
	"fmt"
	"log"

	"github.com/go-redis/redis/v8"
)

var RedisClient *redis.Client

func ConnectRedis() {
	RedisClient = redis.NewClient(&redis.Options{
		Addr:     "redis:6379", // Redis service name from docker-compose and default port
		Password: "",           // No password by default
		DB:       0,            // Default DB
	})

	pong, err := RedisClient.Ping(context.Background()).Result()
	if err != nil {
		log.Fatalf("Could not connect to Redis: %v", err)
	}
	fmt.Println("Connected to Redis:", pong)
}
