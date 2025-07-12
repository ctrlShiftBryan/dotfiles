#!/bin/bash

set -e

echo "🚀 Starting dotfiles bootstrap..."

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    # Detect Linux distribution
    if [ -f /etc/debian_version ]; then
        DISTRO="debian"
    elif [ -f /etc/redhat-release ]; then
        DISTRO="redhat"
    else
        DISTRO="unknown"
    fi
else
    echo "❌ Unsupported OS: $OSTYPE"
    exit 1
fi

echo "📍 Detected OS: $OS"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Install Zsh if not present
if ! command_exists zsh; then
    echo "📦 Installing Zsh..."
    if [[ "$OS" == "macos" ]]; then
        # macOS usually has zsh pre-installed, but just in case
        if command_exists brew; then
            brew install zsh
        else
            echo "⚠️  Zsh not found and Homebrew not available. Will install Homebrew first."
        fi
    elif [[ "$OS" == "linux" ]]; then
        if [[ "$DISTRO" == "debian" ]]; then
            sudo apt-get update && sudo apt-get install -y zsh
        elif [[ "$DISTRO" == "redhat" ]]; then
            sudo yum install -y zsh
        fi
    fi
else
    echo "✅ Zsh already installed"
fi

# 2. Install Homebrew (macOS only)
if [[ "$OS" == "macos" ]] && ! command_exists brew; then
    echo "📦 Installing Homebrew..."
    # Check if we can run interactively
    if [ -t 0 ]; then
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    else
        echo "⚠️  Homebrew installation requires interactive mode."
        echo "⚠️  Please install Homebrew manually first:"
        echo "    /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        echo "⚠️  Then run this script again."
        exit 1
    fi
    
    # Add Homebrew to PATH for current session
    if [[ -d "/opt/homebrew" ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    else
        eval "$(/usr/local/bin/brew shellenv)"
    fi
else
    echo "✅ Package manager ready"
    # Ensure brew is in PATH even if already installed
    if [[ "$OS" == "macos" ]]; then
        if [[ -d "/opt/homebrew" ]]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        elif [[ -d "/usr/local" ]]; then
            eval "$(/usr/local/bin/brew shellenv)"
        fi
    fi
fi

# 3. Install Oh My Zsh if not present
if [ ! -d "$HOME/.oh-my-zsh" ]; then
    echo "📦 Installing Oh My Zsh..."
    # Use unattended install
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
else
    echo "✅ Oh My Zsh already installed"
fi

# 4. Install GNU Stow
if ! command_exists stow; then
    echo "📦 Installing GNU Stow..."
    if [[ "$OS" == "macos" ]]; then
        brew install stow
    elif [[ "$OS" == "linux" ]]; then
        if [[ "$DISTRO" == "debian" ]]; then
            sudo apt-get install -y stow
        elif [[ "$DISTRO" == "redhat" ]]; then
            sudo yum install -y stow
        fi
    fi
else
    echo "✅ GNU Stow already installed"
fi

# 5. Create ~/.zsh directory and template files
echo "📁 Creating ~/.zsh directory and template files..."
mkdir -p "$HOME/.zsh"

# Create env.sh template if it doesn't exist
if [ ! -f "$HOME/.zsh/env.sh" ]; then
    cat > "$HOME/.zsh/env.sh" << 'EOF'
# ~/.zsh/env.sh
# This file is for environment variables containing sensitive data
# It is NOT tracked in git and should be created per-machine
# 
# Example usage:
# export API_KEY="your-api-key-here"
# export DATABASE_URL="your-database-url"
# export SECRET_TOKEN="your-secret-token"

# Add your environment variables below:

EOF
    echo "✅ Created ~/.zsh/env.sh template"
fi

# Create local.sh template if it doesn't exist
if [ ! -f "$HOME/.zsh/local.sh" ]; then
    cat > "$HOME/.zsh/local.sh" << 'EOF'
# ~/.zsh/local.sh
# This file is for machine-specific configuration
# It is NOT tracked in git and should be created per-machine
#
# Example usage:
# export JAVA_HOME="/path/to/java"
# export ANDROID_HOME="/path/to/android-sdk"
# alias myserver='ssh user@my.local.server'

# Add your machine-specific configuration below:

EOF
    echo "✅ Created ~/.zsh/local.sh template"
fi

# Create aliases.sh template if it doesn't exist  
if [ ! -f "$HOME/.zsh/aliases.sh" ]; then
    cat > "$HOME/.zsh/aliases.sh" << 'EOF'
# ~/.zsh/aliases.sh
# This file is for personal aliases
# It is NOT tracked in git and should be created per-machine
#
# Example usage:
# alias ll='ls -la'
# alias gs='git status'
# alias dc='docker-compose'

# Add your personal aliases below:

# Dotfile sync function
sshs() {
    ssh -t "$1" "cd ~/dotfiles && git pull --rebase 2>/dev/null || git clone git@github.com:ctrlShiftBryan/dotfiles.git ~/dotfiles; cd ~/dotfiles && ./setup.sh; exec \$SHELL"
}

EOF
    echo "✅ Created ~/.zsh/aliases.sh template"
fi

echo "🎉 Bootstrap complete! Ready to run setup.sh"

# Note: We don't install ASDF, Python, or other tools here
# Those can be installed after the dotfiles are linked and .zshrc is working