package middleware

import (
	"context"
	"net/http"
	"time"

	"code-editor/config"
	"code-editor/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func AuthMiddleware(usersCollection *mongo.Collection) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, err := c.Cookie("token")
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: No token provided"})
			return
		}

		claims := &models.Claims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return config.JWTSecret, nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Invalid token"})
			return
		}

		// Fetch user from DB to check verification status
		var user models.User
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		err = usersCollection.FindOne(ctx, bson.M{"email": claims.Email}).Decode(&user)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user information"})
			return
		}

		if !user.IsVerified {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Email not verified. Please verify your email to access this feature."})
			return
		}

		// Add the email to the context for downstream handlers
		ctx = context.WithValue(c.Request.Context(), "userEmail", claims.Email)
		c.Request = c.Request.WithContext(ctx)

		c.Next()
	}
}
