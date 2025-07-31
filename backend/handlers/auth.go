package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"

	"code-editor/config"
	"code-editor/models"
	otp_verification "code-editor/otp-verification"

	"gopkg.in/gomail.v2"
)

type SMTPConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
}

type AuthHandler struct {
	UsersCollection *mongo.Collection
	SMTPConfig      SMTPConfig
}

func NewAuthHandler(usersCollection *mongo.Collection, smtpConfig SMTPConfig) *AuthHandler {
	return &AuthHandler{
		UsersCollection: usersCollection,
		SMTPConfig:      smtpConfig,
	}
}

func (h *AuthHandler) sendEmail(to, subject, body string) error {
	mail := gomail.NewMessage()
	mail.SetHeader("From", h.SMTPConfig.From)
	mail.SetHeader("To", to)
	mail.SetHeader("Subject", subject)
	mail.SetBody("text/plain", body)

	dialer := gomail.NewDialer(h.SMTPConfig.Host, h.SMTPConfig.Port, h.SMTPConfig.Username, h.SMTPConfig.Password)
	return dialer.DialAndSend(mail)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := h.UsersCollection.FindOne(ctx, bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to login"})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !user.IsVerified {
		c.JSON(http.StatusForbidden, gin.H{"error": "Email not verified. Please verify your email to login."})
		return
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &models.Claims{
		Email: req.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			Issuer:    "code-editor-app",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(config.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.SetCookie("token", tokenString, int(expirationTime.Unix()), "/", "", false, true) // secure: false for http, domain: empty for default

	c.JSON(http.StatusOK, gin.H{"message": "Login successful", "email": user.Email})
}

func (h *AuthHandler) Signup(c *gin.Context) {
	var req models.SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
    }

    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
        return
    }

    // Check if user already exists in MongoDB (already verified)
    var existingUser models.User
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    err = h.UsersCollection.FindOne(ctx, bson.M{"email": req.Email}).Decode(&existingUser)
    if err == nil {
        // User already exists and is verified
        c.JSON(http.StatusConflict, gin.H{"error": "User with this email already exists and is verified."})
        return
    } else if err != mongo.ErrNoDocuments {
        // Some other DB error
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check user existence"})
        return
    }

    // Generate and send OTP, store temp user data in Redis
    otpCode, err := otp_verification.IssueOTP(req.Email, string(hashedPassword), 5*time.Minute) // OTP valid for 5 minutes
    if err != nil {
        log.Printf("Failed to generate/store OTP for %s: %v", req.Email, err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP"})
        return
    }

    err = h.sendEmail(req.Email, "Your OTP for Code Editor", fmt.Sprintf("Your OTP is: %s\nIt is valid for 5 minutes.", otpCode))
    if err != nil {
        log.Printf("Failed to send OTP email to %s: %v", req.Email, err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP email"})
        return
    }

    c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully. Please check your email for OTP verification.", "email": req.Email})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	// Clear the JWT cookie by setting an expired one
	// Ensure all attributes match the original cookie set during login
	c.SetCookie("token", "", -1, "/", "", false, true) // MaxAge: -1 to delete immediately, secure: false for http, domain: empty for default

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func (h *AuthHandler) RequestOTP(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"}`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email payload"})
		return
	}

	// Check if user exists and is not already verified
	// In this new flow, we check Redis for temporary user data
	// If a user exists in MongoDB and is verified, we don't send OTP again
	var user models.User
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := h.UsersCollection.FindOne(ctx, bson.M{"email": req.Email}).Decode(&user)
	if err == nil && user.IsVerified {
		c.JSON(http.StatusOK, gin.H{"message": "Email already verified."})
		return
	} else if err != nil && err != mongo.ErrNoDocuments {
		// Some other DB error
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check user existence"})
		return
	}

	// If user is not in MongoDB or not verified, check Redis for temporary data
	// If temporary data exists, resend OTP with the same hashed password
	// If not, this request is invalid as it should come from a signup attempt
	
	// For simplicity, we'll assume if RequestOTP is called, it's for a pending verification
	// In a real app, you might fetch the hashedPassword from a temporary Redis record
	// or require the user to re-enter password for security.
	// For now, we'll just issue a new OTP for the email.

	otpCode, err := otp_verification.IssueOTP(req.Email, "", 5*time.Minute) // Hashed password is not needed for re-request
	if err != nil {
		log.Printf("Failed to generate/store OTP for %s: %v", req.Email, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP"})
		return
	}

	err = h.sendEmail(req.Email, "Your New OTP for Code Editor", fmt.Sprintf("Your new OTP is: %s\nIt is valid for 5 minutes.", otpCode))
	if err != nil {
		log.Printf("Failed to send OTP email to %s: %v", req.Email, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP email"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "New OTP sent to your email."})
}

func (h *AuthHandler) VerifyOTP(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"}`
		OTP   string `json:"otp" binding:"required"}`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	// Verify OTP using Redis and get temporary user data
	tempUser, err := otp_verification.VerifyOTP(req.Email, req.OTP)
	if err != nil {
		log.Printf("Error verifying OTP for %s: %v", req.Email, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error during OTP verification"})
		return
	}

	if tempUser == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired OTP"})
		return
	}

	// OTP is valid, now register the user in MongoDB
	user := models.User{
		Email:      tempUser.Email,
		Password:   tempUser.HashedPassword,
		IsVerified: true,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = h.UsersCollection.InsertOne(ctx, user)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			// This case should ideally not happen if signup checked for existing users
			// but good to handle defensively.
			c.JSON(http.StatusConflict, gin.H{"error": "User with this email already exists."})
			return
		}
		log.Printf("Failed to register user %s after OTP verification: %v", req.Email, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user"})
		return
	}

	// User registered and verified. Now log them in by setting the JWT cookie.
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &models.Claims{
		Email: user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			Issuer:    "code-editor-app",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(config.JWTSecret)
	if err != nil {
		log.Printf("Failed to generate token for %s after verification: %v", user.Email, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.SetCookie("token", tokenString, int(expirationTime.Unix()), "/", "", false, true) // secure: false for http, domain: empty for default

	c.JSON(http.StatusOK, gin.H{"message": "Email verified and registration complete! You are now logged in.", "email": user.Email})
}
