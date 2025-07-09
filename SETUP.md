# 🚀 GitHub Setup & Automated Commits Guide

This guide will help you connect your Workshop Tracker project to a private GitHub repository and set up automated commits to maintain a healthy GitHub contribution graph.

## 📋 Prerequisites

- [GitHub account](https://github.com)
- [Git installed](https://git-scm.com/downloads)
- [GitHub CLI (optional but recommended)](https://cli.github.com/)

## 🔧 Step 1: Create GitHub Repository

### Option A: Using GitHub CLI (Recommended)
```bash
# Install GitHub CLI if not installed
# macOS: brew install gh
# Windows: winget install GitHub.cli

# Login to GitHub
gh auth login

# Create a private repository
gh repo create workshop-tracker --private --description "Modern workshop tracker with income/expense analytics"

# Set the remote origin
git remote add origin https://github.com/your-username/workshop-tracker.git
```

### Option B: Using GitHub Website
1. Go to [github.com](https://github.com)
2. Click "New repository" or the `+` icon
3. Fill in the details:
   - **Repository name**: `workshop-tracker`
   - **Description**: `Modern workshop tracker with income/expense analytics`
   - **Visibility**: ✅ Private
   - **Initialize**: ❌ Don't initialize (we already have files)
4. Click "Create repository"
5. Copy the remote URL and run:
```bash
git remote add origin https://github.com/YOUR-USERNAME/workshop-tracker.git
```

## 🔐 Step 2: Configure Git Credentials

### GitHub Personal Access Token (Recommended)
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Set scopes: `repo`, `workflow`, `write:packages`
4. Copy the token and save it securely
5. Configure git:
```bash
git config --global credential.helper store
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

## 🚀 Step 3: Push Initial Commit

```bash
# Push the initial commit to GitHub
git push -u origin main
```

## 🤖 Step 4: Set Up Automated Commits

### Local Auto-Commit Script
The project includes an intelligent auto-commit script that:
- Analyzes your changes to generate meaningful commit messages
- Follows conventional commit standards
- Automatically pushes to GitHub
- Excludes sensitive files

#### Usage:
```bash
# Run auto-commit manually
npm run commit

# Or run the script directly
./scripts/auto-commit.sh
```

### GitHub Actions (Daily Automation)
The project includes a GitHub Actions workflow that creates daily commits to maintain your contribution graph.

#### To enable:
1. The workflow is already set up in `.github/workflows/auto-commit.yml`
2. It runs daily at 10:00 AM UTC
3. You can also trigger it manually from the Actions tab

## 🔄 Step 5: Cursor IDE Integration

### Method 1: Terminal Integration
Add this to your shell profile (`~/.zshrc`, `~/.bashrc`, etc.):
```bash
# Workshop Tracker Auto-Commit
alias wt-commit='cd /path/to/workshop-tracker && npm run commit'
```

### Method 2: Cursor Tasks (Recommended)
Create a `.vscode/tasks.json` file in your project:
```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Auto Commit",
            "type": "shell",
            "command": "./scripts/auto-commit.sh",
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            },
            "problemMatcher": []
        }
    ]
}
```

Then use `Cmd+Shift+P` → "Tasks: Run Task" → "Auto Commit"

### Method 3: Git Hooks (Advanced)
Set up a pre-commit hook for automatic commits:
```bash
# Create pre-commit hook
echo '#!/bin/bash
./scripts/auto-commit.sh' > .git/hooks/pre-commit

# Make it executable
chmod +x .git/hooks/pre-commit
```

## 📊 Step 6: Verify Setup

### Check Repository Connection
```bash
# Check remote configuration
git remote -v

# Test push
git push origin main
```

### Test Auto-Commit
```bash
# Make a small change
echo "# Test" >> test.md

# Run auto-commit
npm run commit

# Check if it was pushed
git log --oneline -5
```

## 🎯 Commit Message Examples

The auto-commit script generates intelligent messages based on your changes:

### Automatic Detection:
- `feat: enhanced UI components and user experience` (React components)
- `style: improved visual design and styling` (CSS/Tailwind changes)
- `docs: updated project documentation` (Markdown files)
- `chore: updated dependencies and project configuration` (package.json)
- `refactor: updated application state management` (Context files)

### Daily Rotation:
- **Monday**: `feat: Monday feature development and improvements`
- **Tuesday**: `refactor: code organization and structure improvements`
- **Wednesday**: `fix: bug fixes and performance optimizations`
- **Thursday**: `style: UI/UX enhancements and design improvements`
- **Friday**: `chore: project maintenance and dependency updates`
- **Saturday**: `feat: weekend feature development`
- **Sunday**: `docs: documentation updates and project cleanup`

## 🔧 Available Commands

```bash
# Project setup
npm run setup              # Install all dependencies
npm run install:all        # Install frontend and backend deps

# Development
npm run dev               # Start both frontend and backend
npm run dev:frontend      # Start only frontend
npm run dev:backend       # Start only backend

# Git operations
npm run commit            # Auto-commit with intelligent messages
npm run push              # Push to GitHub
npm run status            # Check git status
npm run log               # View recent commits

# Production
npm run build             # Build frontend for production
npm run start             # Start production server
```

## 🎨 Customization

### Modify Commit Messages
Edit `scripts/auto-commit.sh` to customize the commit message generation logic.

### Change Commit Schedule
Edit `.github/workflows/auto-commit.yml` to change the daily commit schedule:
```yaml
schedule:
  - cron: '0 22 * * *'  # 10:00 PM UTC instead of 10:00 AM
```

### Add Custom Commit Types
Extend the commit message logic in the auto-commit script:
```bash
elif echo "$changes" | grep -q "\.svg\|\.png\|\.jpg"; then
    type="assets"
    message="updated project assets and media files"
```

## 🚨 Important Notes

### Security
- Never commit sensitive files (`.env`, API keys, etc.)
- The script automatically excludes common sensitive files
- Always review changes before committing

### Best Practices
- Use meaningful commit messages for manual commits
- Keep commits focused on specific changes
- Regular commits are better than large, infrequent ones
- Use branches for experimental features

### Troubleshooting

#### Authentication Issues
```bash
# Clear stored credentials
git config --global --unset credential.helper

# Re-authenticate
gh auth login
```

#### Push Issues
```bash
# Check remote URL
git remote -v

# Update remote URL if needed
git remote set-url origin https://github.com/YOUR-USERNAME/workshop-tracker.git
```

#### Permission Issues
```bash
# Make script executable
chmod +x scripts/auto-commit.sh

# Check file permissions
ls -la scripts/
```

## 🎉 Success!

Once set up, your Workshop Tracker project will:
- ✅ Be connected to a private GitHub repository
- ✅ Automatically commit changes with meaningful messages
- ✅ Push commits to maintain your contribution graph
- ✅ Have daily automated commits via GitHub Actions
- ✅ Support intelligent commit message generation

Your GitHub contribution graph will show consistent activity, reflecting your ongoing development work on the Workshop Tracker project!

---

## 🔗 Quick Links

- [GitHub Repository](https://github.com/your-username/workshop-tracker)
- [GitHub Actions](https://github.com/your-username/workshop-tracker/actions)
- [Issues](https://github.com/your-username/workshop-tracker/issues)
- [Wiki](https://github.com/your-username/workshop-tracker/wiki)

Happy coding! 🎨✨ 