package models

import "github.com/golang-jwt/jwt/v5"

type CodeRequest struct {
	Language string `json:"language"`
	Code     string `json:"code"`
	Input    string `json:"input"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type SignupRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type User struct {
	ID       string `bson:"_id,omitempty"` // MongoDB _id field
	Email    string `bson:"email"`
	Password string `bson:"password"` // Hashed password
	IsVerified bool   `bson:"isVerified"`
}

type Claims struct {
	Email string `json:"email"`
	jwt.RegisteredClaims
}
