package config

import (
	"os"
	"log"
	"github.com/joho/godotenv"
)

var JWTSecret []byte

func LoadConfig() {
	// Load .env file
	err := godotenv.Load(".env") // Load .env from the current directory
	if err != nil {
		log.Println("Error loading .env file, ensure it's present in the backend directory.")
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Fatal("JWT_SECRET environment variable not set. Please set it in your .env file.")
	}
	JWTSecret = []byte(secret)
}
