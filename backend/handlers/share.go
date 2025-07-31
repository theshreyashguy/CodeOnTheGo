package handlers

import (
	"context"
	"net/http"
	"time"

	"code-editor/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ShareHandler struct {
	CodesCollection       *mongo.Collection
	SharedCodesCollection *mongo.Collection
}

func NewShareHandler(codesCollection, sharedCodesCollection *mongo.Collection) *ShareHandler {
	return &ShareHandler{
		CodesCollection:       codesCollection,
		SharedCodesCollection: sharedCodesCollection,
	}
}

func (h *ShareHandler) CreateShareLink(c *gin.Context) {
	var req struct {
		CodeID            string `json:"codeId" binding:"required"`
		ExpirationMinutes int    `json:"expirationMinutes" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Get the original code from the user's codes collection
	objID, err := primitive.ObjectIDFromHex(req.CodeID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid code ID format"})
		return
	}

	var originalCode models.Code
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err = h.CodesCollection.FindOne(ctx, bson.M{"_id": objID}).Decode(&originalCode)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Code not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve code"})
		return
	}

	// 2. Generate a unique token
	token := uuid.New().String()[:8] // Use first 8 chars of UUID for a short token

	// 3. Calculate expiration time
	expirationTime := time.Now().Add(time.Duration(req.ExpirationMinutes) * time.Minute)

	// 4. Create and insert SharedCode document
	sharedCode := models.SharedCode{
		Token:     token,
		Code:      originalCode.Code,
		Language:  originalCode.Language,
		CreatedAt: time.Now(),
		ExpiresAt: expirationTime,
	}

	_, err = h.SharedCodesCollection.InsertOne(ctx, sharedCode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create share link"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Share link created successfully",
		"token":     token,
		"expiresAt": expirationTime,
	})
}

func (h *ShareHandler) GetSharedCode(c *gin.Context) {
	token := c.Param("token")

	var sharedCode models.SharedCode
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := h.SharedCodesCollection.FindOne(ctx, bson.M{"token": token}).Decode(&sharedCode)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Shared code not found or expired"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve shared code"})
		return
	}

	// Check if the code has expired (redundant if TTL index is working, but good for immediate check)
	if time.Now().After(sharedCode.ExpiresAt) {
		// Optionally delete the expired code immediately if TTL hasn't caught it yet
		// h.SharedCodesCollection.DeleteOne(ctx, bson.M{"_id": sharedCode.ID})
		c.JSON(http.StatusNotFound, gin.H{"error": "Shared code not found or expired"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":      sharedCode.Code,
		"language":  sharedCode.Language,
		"expiresAt": sharedCode.ExpiresAt,
	})
}
