package otp_verification

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"time"

	"code-editor/db"

	"github.com/go-redis/redis/v8"
)

// TempUser stores temporary user data during OTP verification
type TempUser struct {
	Email          string `json:"email"`
	HashedPassword string `json:"hashedPassword"`	
	OTP            string `json:"otp"`
}

// generate a 6-digit code
func newOTP() string {
	return fmt.Sprintf("%06d", rand.Intn(1_000_000))
}

// IssueOTP creates an OTP for email, valid for ttl duration, and stores it in Redis
func IssueOTP(email, hashedPassword string, ttl time.Duration) (string, error) {
	code := newOTP()
	ctx := context.Background()

	tempUser := TempUser{
		Email:          email,
		HashedPassword: hashedPassword,
		OTP:            code,
	}

	jsonData, err := json.Marshal(tempUser)
	if err != nil {
		return "", fmt.Errorf("failed to marshal temp user data: %w", err)
	}

	// Store TempUser in Redis with a TTL
	err = db.RedisClient.Set(ctx, "otp:"+email, jsonData, ttl).Err()
	if err != nil {
		return "", fmt.Errorf("failed to store OTP in Redis: %w", err)
	}

	return code, nil
}

// VerifyOTP checks & consumes the code for that email from Redis
func VerifyOTP(email, code string) (*TempUser, error) {
	ctx := context.Background()

	val, err := db.RedisClient.Get(ctx, "otp:"+email).Result()
	if err == redis.Nil {
		// OTP not found or expired
		return nil, nil
	} else if err != nil {
		return nil, fmt.Errorf("failed to get OTP from Redis: %w", err)
	}

	var tempUser TempUser
	err = json.Unmarshal([]byte(val), &tempUser)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal temp user data: %w", err)
	}

	if tempUser.OTP == code {
		// OTP matches, delete it to ensure single use
		err := db.RedisClient.Del(ctx, "otp:"+email).Err()
		if err != nil {
			return nil, fmt.Errorf("failed to delete OTP from Redis: %w", err)
		}
		return &tempUser, nil
	}

	return nil, nil
}
