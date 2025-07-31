package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Code struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Email    string             `bson:"email" json:"email"`
	Language string             `bson:"language" json:"language"`
	Code     string             `bson:"code" json:"code"`
}
