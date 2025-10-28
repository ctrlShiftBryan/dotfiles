# If you come from bash you might have to change your $PATH.
export PATH=$HOME/bin:$HOME/.local/bin:/usr/local/bin:$PATH
HISTSIZE=100000
SAVEHIST=100000

# Load zsh-autosuggestions
if [ -f ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh ]; then
    source ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh
elif [ -f /opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh ]; then
    source /opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh
fi

# User configuration

# export MANPATH="/usr/local/man:$MANPATH"

# You may need to manually set your language environment
# export LANG=en_US.UTF-8

# Set XDG_CONFIG_HOME for consistent config location across platforms
export XDG_CONFIG_HOME="$HOME/.config"

# Preferred editor for local and remote sessions
export EDITOR='bavim'
export VISUAL='bavim'

# Compilation flags
# export ARCHFLAGS="-arch $(uname -m)"

# Set personal aliases, overriding those provided by Oh My Zsh libs,
# plugins, and themes. Aliases can be placed here, though Oh My Zsh
# users are encouraged to define aliases within a top-level file in
# the $ZSH_CUSTOM folder, with .zsh extension. Examples:
# - $ZSH_CUSTOM/aliases.zsh
# - $ZSH_CUSTOM/macos.zsh
# For a full list of active aliases, run `alias`.
#
# Example aliases
# alias zshconfig="mate ~/.zshrc"
# alias ohmyzsh="mate ~/.oh-my-zsh"
# The following lines have been added by Docker Desktop to enable Docker CLI completions.
fpath=(/Users/bryanarendt/.docker/completions $fpath)
autoload -Uz compinit
compinit
# End of Docker CLI completions

# Load ASDF if available
if command -v brew >/dev/null 2>&1 && [ -f "$(brew --prefix asdf 2>/dev/null)/libexec/asdf.sh" ]; then
    # ASDF installed via Homebrew
    . "$(brew --prefix asdf)/libexec/asdf.sh"
elif [ -f "$HOME/.asdf/asdf.sh" ]; then
    # ASDF installed manually in ~/.asdf
    . "$HOME/.asdf/asdf.sh"
fi

# Source additional configuration files if they exist
if [ -f ~/.zsh/aliases.sh ]; then
    echo "Loading aliases from ~/.zsh/aliases.sh" >> /tmp/zsh_debug.log
    source ~/.zsh/aliases.sh
fi

if [ -f ~/.zsh/local.sh ]; then
    echo "Loading local config from ~/.zsh/local.sh" >> /tmp/zsh_debug.log
    source ~/.zsh/local.sh
fi

if [ -f ~/.zsh/env.sh ]; then
    echo "Loading env from ~/.zsh/env.sh" >> /tmp/zsh_debug.log
    source ~/.zsh/env.sh
fi
export PATH="/opt/homebrew/opt/libpq/bin:$PATH"
export PATH="/opt/podman/bin:$PATH"

# Add zsh scripts to PATH
export PATH="$HOME/.zsh/scripts:$PATH"

export PATH="$HOME/.local/bin:$PATH"
export PATH="$HOME/Library/Python/3.9/bin:$PATH"

source /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
eval "$(zoxide init zsh --cmd cd)"

# Initialize Starship prompt
eval "$(starship init zsh)"
