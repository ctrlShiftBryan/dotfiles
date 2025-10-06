#!/bin/bash

set -e

# Parse arguments
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    echo "🔍 DRY RUN MODE - No changes will be made"
    echo ""
fi

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
    echo "📦 Would install: Zsh"
    if ! $DRY_RUN; then
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
    fi
else
    echo "✅ Zsh already installed"
fi

# 2. Handle Homebrew (macOS only)
if [[ "$OS" == "macos" ]]; then
    # First, check if Homebrew is installed in known locations
    BREW_INSTALLED=false
    if [[ -x "/opt/homebrew/bin/brew" ]]; then
        echo "✅ Found Homebrew at /opt/homebrew (Apple Silicon)"
        eval "$(/opt/homebrew/bin/brew shellenv)"
        BREW_INSTALLED=true
    elif [[ -x "/usr/local/bin/brew" ]]; then
        echo "✅ Found Homebrew at /usr/local (Intel)"
        eval "$(/usr/local/bin/brew shellenv)"
        BREW_INSTALLED=true
    fi
    
    # If not found in known locations, check if it's in PATH
    if ! $BREW_INSTALLED && command_exists brew; then
        echo "✅ Homebrew found in PATH"
        BREW_INSTALLED=true
    fi
    
    # Only try to install if truly not found
    if ! $BREW_INSTALLED; then
        echo "📦 Would install: Homebrew"
        if ! $DRY_RUN; then
            # Check if we can run interactively
            if [ -t 0 ]; then
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
                # Add to PATH after installation
                if [[ -d "/opt/homebrew" ]]; then
                    eval "$(/opt/homebrew/bin/brew shellenv)"
                else
                    eval "$(/usr/local/bin/brew shellenv)"
                fi
            else
                echo "⚠️  Homebrew installation requires interactive mode."
                echo "⚠️  Please install Homebrew manually first:"
                echo "    /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
                echo "⚠️  Then run this script again."
                exit 1
            fi
        fi
    fi
else
    echo "✅ Package manager ready (Linux)"
fi

# 3. Install Oh My Zsh if not present
if [ ! -d "$HOME/.oh-my-zsh" ]; then
    echo "📦 Would install: Oh My Zsh"
    if ! $DRY_RUN; then
        # Use unattended install
        sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
    fi
else
    echo "✅ Oh My Zsh already installed"
fi

# 4. Install GNU Stow
if ! command_exists stow; then
    echo "📦 Would install: GNU Stow"
    if ! $DRY_RUN; then
        if [[ "$OS" == "macos" ]]; then
            brew install stow
        elif [[ "$OS" == "linux" ]]; then
            if [[ "$DISTRO" == "debian" ]]; then
                sudo apt-get install -y stow
            elif [[ "$DISTRO" == "redhat" ]]; then
                sudo yum install -y stow
            fi
        fi
    fi
else
    echo "✅ GNU Stow already installed"
fi

# 5. Create ~/.zsh directory and template files
if [ ! -d "$HOME/.zsh" ]; then
    echo "📁 Would create: ~/.zsh directory"
    if ! $DRY_RUN; then
        mkdir -p "$HOME/.zsh"
    fi
else
    echo "✅ ~/.zsh directory already exists"
fi

# Create env.sh template if it doesn't exist
if [ ! -f "$HOME/.zsh/env.sh" ]; then
    echo "📝 Would create: ~/.zsh/env.sh template"
    if ! $DRY_RUN; then
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

# Example of conditional Python PATH (uncomment if needed):
# if command -v python >/dev/null 2>&1; then
#     export PATH="$PATH:$(python -m site --user-site)/../bin"
# fi

EOF
        echo "✅ Created ~/.zsh/env.sh template"
    fi
else
    echo "✅ ~/.zsh/env.sh already exists"
    # Check if it contains Python commands that might fail
    if grep -q "python -m site" "$HOME/.zsh/env.sh" 2>/dev/null; then
        echo "⚠️  Found Python PATH command in existing env.sh"
        echo "⚠️  Consider wrapping it with: if command -v python >/dev/null 2>&1; then"
    fi
fi

# Create local.sh template if it doesn't exist
if [ ! -f "$HOME/.zsh/local.sh" ]; then
    echo "📝 Would create: ~/.zsh/local.sh template"
    if ! $DRY_RUN; then
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
fi

# Note: aliases.sh is now tracked in dotfiles/zsh/ and stowed to ~/.zsh/aliases.sh
# No template needed here

if $DRY_RUN; then
    echo ""
    echo "🔍 Dry run complete! Run without --dry-run to apply changes"
else
    echo "🎉 Bootstrap complete! Ready to run setup.sh"
fi

# Export PATH for subsequent scripts
if [[ "$OS" == "macos" ]]; then
    if [[ -d "/opt/homebrew" ]]; then
        export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
    elif [[ -d "/usr/local" ]]; then
        export PATH="/usr/local/bin:/usr/local/sbin:$PATH"
    fi
fi

# Debug: Show current PATH and which commands are available
echo "📍 Current PATH: $PATH"
echo "📍 Commands available:"
echo "  - brew: $(command -v brew || echo 'not found')"
echo "  - stow: $(command -v stow || echo 'not found')"
echo "  - zsh: $(command -v zsh || echo 'not found')"

# Note: We don't install ASDF, Python, or other tools here
# Those can be installed after the dotfiles are linked and .zshrc is working