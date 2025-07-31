package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"code-editor/sandbox"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"code-editor/config"
	"code-editor/db"
	"code-editor/handlers"
	"code-editor/middleware"
	"code-editor/models"
)

func main() {
	// Load configuration (including JWT secret)
	config.LoadConfig()

	// Connect to MongoDB
	client := db.ConnectDB()
	defer func() {
		if err := client.Disconnect(context.TODO()); err != nil {
			log.Fatal(err)
		}
	}()

	// Connect to Redis
	db.ConnectRedis()

	// Get a handle to the users collection
	usersCollection := client.Database("code_editor_db").Collection("users")
	codesCollection := client.Database("code_editor_db").Collection("codes")
	sharedCodesCollection := client.Database("code_editor_db").Collection("shared_codes")

	// Create a unique index on the email field
	indexModel := mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	_, err := usersCollection.Indexes().CreateOne(context.Background(), indexModel)
	if err != nil {
		log.Fatalf("Failed to create unique index on users collection: %v", err)
	}

	// Create TTL index for shared codes
	ttlIndexModel := mongo.IndexModel{
		Keys:    bson.D{{Key: "expiresAt", Value: 1}},
		Options: options.Index().SetExpireAfterSeconds(0), // Expire based on the date in expiresAt
	}
	_, err = sharedCodesCollection.Indexes().CreateOne(context.Background(), ttlIndexModel)
	if err != nil {
		log.Fatalf("Failed to create TTL index on shared_codes collection: %v", err)
	}

	router := gin.Default()

	// Add CORS middleware
	config := cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}
	router.Use(cors.New(config))

	// Initialize Handlers
	// SMTP Configuration
	smtpCfg := handlers.SMTPConfig{
		Host:     os.Getenv("MAIL_HOST"),
		Port:     587,
		Username: os.Getenv("MAIL_ID"),
		Password: os.Getenv("MAIL_PASSWORD"),
		From:     os.Getenv("MAIL_ID"),
	}
	authHandler := handlers.NewAuthHandler(usersCollection, smtpCfg)
	codeHandler := handlers.NewCodeHandler(codesCollection)
	shareHandler := handlers.NewShareHandler(codesCollection, sharedCodesCollection)

	// Auth routes
	router.POST("/login", authHandler.Login)
	router.POST("/signup", authHandler.Signup)
	router.POST("/logout", authHandler.Logout)

	// OTP Verification routes
	router.POST("/request-otp", authHandler.RequestOTP)
	router.POST("/verify-otp", authHandler.VerifyOTP)

	// Share routes
	shareRoutes := router.Group("/share")
	shareRoutes.Use(middleware.AuthMiddleware(usersCollection)) // Protect creation of share links
	{
		shareRoutes.POST("", shareHandler.CreateShareLink)
	}
	router.GET("/share/:token", shareHandler.GetSharedCode) // Public route for viewing shared code

	// Code routes
	codeRoutes := router.Group("/code")
	codeRoutes.Use(middleware.AuthMiddleware(usersCollection))
	{
		codeRoutes.POST("", codeHandler.SaveCode)
		codeRoutes.GET("", codeHandler.GetCodeByEmail)
		codeRoutes.DELETE("/:id", codeHandler.DeleteCode)
	}

	// Code execution route (remains in main.go)
	router.POST("/execute", func(c *gin.Context) {
		var req models.CodeRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}
		fmt.Println("api data ", req.Language, req.Code, req.Input)
		output, err := sandbox.ExecuteCode(req.Language, req.Code, req.Input)
		log.Printf("Docker returned output: %q, err: %v", output, err)

		resp := gin.H{"output": output}
		if err != nil {
			resp["error"] = err.Error()
		}
		c.JSON(http.StatusOK, resp)
	})

	// Health check route (remains in main.go)
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// start server
	router.Run(":8003")
}
