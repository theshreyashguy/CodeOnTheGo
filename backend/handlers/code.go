package handlers

import (
	"context"
	"net/http"
	"time"

	"code-editor/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type CodeHandler struct {
	CodesCollection *mongo.Collection
}

func NewCodeHandler(codesCollection *mongo.Collection) *CodeHandler {
	return &CodeHandler{
		CodesCollection: codesCollection,
	}
}

func (h *CodeHandler) SaveCode(c *gin.Context) {
	var req models.Code
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get email from the context
	email, exists := c.Request.Context().Value("userEmail").(string)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	req.Email = email

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := h.CodesCollection.InsertOne(ctx, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save code"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Code saved successfully"})
}

func (h *CodeHandler) GetCodeByEmail(c *gin.Context) {
	// Get email from the context
	email, exists := c.Request.Context().Value("userEmail").(string)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := h.CodesCollection.Find(ctx, bson.M{"email": email})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve codes"})
		return
	}
	defer cursor.Close(ctx)

	var codes []models.Code
	if err = cursor.All(ctx, &codes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode codes"})
		return
	}

	c.JSON(http.StatusOK, codes)
}

func (h *CodeHandler) DeleteCode(c *gin.Context) {
	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := h.CodesCollection.DeleteOne(ctx, bson.M{"_id": objID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete code"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Code not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Code deleted successfully"})
}
