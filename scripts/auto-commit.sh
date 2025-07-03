#!/bin/bash

# Auto-commit script for Workshop Tracker
# This script automatically commits changes with meaningful messages

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    echo -e "${1}${2}${NC}"
}

# Function to generate intelligent commit messages based on file changes
generate_commit_message() {
    local changes=$(git diff --cached --name-only)
    local message=""
    local type="chore"
    
    # Analyze changes to determine commit type and message
    if echo "$changes" | grep -q "\.jsx\|\.js\|\.ts\|\.tsx"; then
        if echo "$changes" | grep -q "component"; then
            type="feat"
            message="enhanced UI components and user experience"
        elif echo "$changes" | grep -q "page"; then
            type="feat"
            message="improved page functionality and layout"
        elif echo "$changes" | grep -q "context"; then
            type="refactor"
            message="updated application state management"
        else
            type="feat"
            message="enhanced application functionality"
        fi
    elif echo "$changes" | grep -q "\.css\|\.scss\|tailwind"; then
        type="style"
        message="improved visual design and styling"
    elif echo "$changes" | grep -q "package\.json\|package-lock\.json"; then
        type="chore"
        message="updated dependencies and project configuration"
    elif echo "$changes" | grep -q "README\|\.md"; then
        type="docs"
        message="updated project documentation"
    elif echo "$changes" | grep -q "\.gitignore\|\.env"; then
        type="chore"
        message="updated project configuration files"
    elif echo "$changes" | grep -q "test\|spec"; then
        type="test"
        message="enhanced testing coverage and quality"
    else
        # Default messages based on day of week for variety
        local day=$(date +%u)
        case $day in
            1) type="feat"; message="Monday feature development and improvements" ;;
            2) type="refactor"; message="code organization and structure improvements" ;;
            3) type="fix"; message="bug fixes and performance optimizations" ;;
            4) type="style"; message="UI/UX enhancements and design improvements" ;;
            5) type="chore"; message="project maintenance and dependency updates" ;;
            6) type="feat"; message="weekend feature development" ;;
            7) type="docs"; message="documentation updates and project cleanup" ;;
        esac
    fi
    
    echo "${type}: ${message}"
}

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_color $RED "Error: Not in a git repository!"
        exit 1
    fi
}

# Function to check for changes
check_changes() {
    if git diff --quiet && git diff --cached --quiet; then
        print_color $YELLOW "No changes to commit."
        return 1
    fi
    return 0
}

# Function to show changes summary
show_changes() {
    print_color $BLUE "Files changed:"
    git diff --name-only
    git diff --cached --name-only
    echo ""
}

# Function to auto-stage files (excluding sensitive files)
auto_stage() {
    # Add all files except sensitive ones
    git add .
    
    # Unstage sensitive files if accidentally added
    git reset HEAD .env* 2>/dev/null || true
    git reset HEAD **/node_modules/** 2>/dev/null || true
    git reset HEAD **/.DS_Store 2>/dev/null || true
}

# Main function
main() {
    print_color $BLUE "🎨 Workshop Tracker Auto-Commit Script"
    echo ""
    
    # Check if we're in a git repository
    check_git_repo
    
    # Auto-stage files
    auto_stage
    
    # Check for changes
    if ! check_changes; then
        exit 0
    fi
    
    # Show changes
    show_changes
    
    # Generate commit message
    local commit_msg=$(generate_commit_message)
    
    # Add timestamp to commit message
    local timestamp=$(date '+%Y-%m-%d %H:%M')
    local full_message="${commit_msg}

Auto-committed on ${timestamp} via Cursor IDE"
    
    # Show the commit message
    print_color $YELLOW "Commit message: $commit_msg"
    echo ""
    
    # Commit changes
    if git commit -m "$full_message"; then
        print_color $GREEN "✅ Successfully committed changes!"
        
        # Check if remote exists and push
        if git remote -v | grep -q origin; then
            print_color $BLUE "Pushing to remote repository..."
            if git push; then
                print_color $GREEN "✅ Successfully pushed to remote!"
            else
                print_color $RED "❌ Failed to push to remote. Please check your connection."
            fi
        else
            print_color $YELLOW "⚠️  No remote repository configured. Skipping push."
        fi
    else
        print_color $RED "❌ Failed to commit changes."
        exit 1
    fi
}

# Run the script
main "$@" 