package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SharedCode struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Token     string             `bson:"token" json:"token"`         // Unique short identifier for the URL
	Code      string             `bson:"code" json:"code"`
	Language  string             `bson:"language" json:"language"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"` // For TTL index
	ExpiresAt time.Time          `bson:"expiresAt" json:"expiresAt"` // Explicit expiration time
}
