package sandbox

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

func ExecuteCode(language, code, input string) (string, error) {
	// 1) Pick image & args for STDIN mode

	switch language {
	case "python":
		return executeWithVolume(language, code, input)
	case "go":
		return executeWithVolume(language, code, input)
	case "cpp":
		return executeWithVolume(language, code, input)
	case "java":
		return executeWithVolume(language, code, input)
	case "javascript":
		return executeWithVolume(language, code, input)
	default:
		return "", fmt.Errorf("unsupported language: %s", language)
	}
}

func executeWithVolume(language, code, input string) (string, error) {
	// 1) Get the host project path from environment variable
	hostProjectPath := os.Getenv("HOST_PROJECT_PATH")
	if hostProjectPath == "" {
		return "", fmt.Errorf("HOST_PROJECT_PATH environment variable not set")
	}

	// 2) Make a temp dir inside the container's /code-exec mount
	tmpDir, err := os.MkdirTemp("/code-exec", "codeexec-*")
	if err != nil {
		return "", fmt.Errorf("failed to make temp dir: %w", err)
	}
	defer os.RemoveAll(tmpDir)

	var filename string
	var image string
	var cmdArgs []string

	switch language {
	case "python":
		filename = "main.py"
		image = "python:3.10-alpine"
		cmdArgs = []string{"python", filename}
	case "go":
		filename = "main.go"
		image = "golang:1.20-alpine"
		cmdArgs = []string{"go", "run", filename}
	case "cpp":
		filename = "main.cpp"
		image = "cpp-compiler-alpine"
		// Compile and then run
		cmdArgs = []string{"sh", "-c", "g++ -o main main.cpp && ./main"}
	case "java":
		filename = "Main.java"
		image = "openjdk:17-alpine"
		cmdArgs = []string{"sh", "-c", "javac Main.java && java Main"}
	case "javascript":
		filename = "main.js"
		image = "node:alpine"
		cmdArgs = []string{"node", filename}
	default:
		return "", fmt.Errorf("unsupported language: %s", language)
	}

	codePath := filepath.Join(tmpDir, filename)
	if err := os.WriteFile(codePath, []byte(code), 0o644); err != nil {
		return "", fmt.Errorf("failed to write code file: %w", err)
	}

	hostDir := filepath.Join(hostProjectPath, "code-exec", filepath.Base(tmpDir))
	hostDir = strings.Replace(hostDir, `\`, `/`, -1)
	if len(hostDir) > 1 && hostDir[1] == ':' {
		hostDir = "/c" + hostDir[2:]
	}

	fmt.Println("Container Temp Dir:", tmpDir)
	fmt.Println("Absolute Host-relative Volume Path:", hostDir)

	args := []string{
		"run", "--rm", "-i", // Add -i flag here
		"-v", fmt.Sprintf("%s:/app", hostDir),
		"--workdir", "/app",
		"--network=none",
		"--memory", "1g",
		"--cpus", "2.0",
		image,
	}
	args = append(args, cmdArgs...)

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, "docker", args...)
	cmd.Stdin = strings.NewReader(input)
	output, err := cmd.CombinedOutput()
	if ctx.Err() == context.DeadlineExceeded {
		return string(output), fmt.Errorf("execution timed out")
	}
	if err != nil {
		return string(output), fmt.Errorf("execution error: %w", err)
	}
	return string(output), nil
}
