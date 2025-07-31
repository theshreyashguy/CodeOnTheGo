# ─── Stage 1: Build the Go binary ────────────────────────────────────────────
FROM golang:1.24-alpine AS builder


# Install git (if you fetch modules from VCS) and ca-certs for HTTPS
RUN apk add --no-cache git ca-certificates

WORKDIR /app

# Copy all source files first, including go.mod and go.sum
COPY . .

# Download dependencies based on all copied source files
RUN go mod download
RUN go mod tidy

# Build your server (adjust path if your main is elsewhere)
RUN go build -o code-editor main.go


# ─── Stage 2: Final image with Docker client ────────────────────────────────
FROM alpine:latest

# Install Docker CLI and ca-certificates for HTTPS
RUN apk add --no-cache docker-cli ca-certificates curl

WORKDIR /app

# Copy binary and .env into the runtime image
COPY --from=builder /app/code-editor .
COPY .env .
RUN mkdir -p /code-exec

# Expose port (if your service listens on 8003)
EXPOSE 8003

# Entrypoint
CMD ["./code-editor"]
