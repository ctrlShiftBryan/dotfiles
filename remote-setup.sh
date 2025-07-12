#!/bin/bash
# Quick setup script for remote machines - run this first to install Homebrew

set -e

echo "🚀 Remote machine initial setup"
echo ""
echo "This script will install Homebrew interactively."
echo "After completion, you can use sshs to sync dotfiles."
echo ""
read -p "Press Enter to continue..."

# Install Homebrew
if ! command -v brew >/dev/null 2>&1; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to current session
    if [[ -d "/opt/homebrew" ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    else
        eval "$(/usr/local/bin/brew shellenv)"
    fi
    
    echo ""
    echo "✅ Homebrew installed!"
else
    echo "✅ Homebrew already installed"
fi

echo ""
echo "🎉 Initial setup complete!"
echo ""
echo "You can now disconnect and use 'sshs $HOSTNAME' to sync dotfiles."