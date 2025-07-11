# Fix Dotfile Sync Dependencies Plan

## Problem Summary

When using `sshs` to sync dotfiles to a remote machine (m1l), the following errors occur:
1. `stow: command not found` - GNU Stow is not installed on the remote machine
2. `brew: command not found` - Homebrew is not available when .zshrc executes
3. Missing ASDF installation files
4. Python command not found in env.sh

The root cause is that .zshrc expects certain tools (Homebrew, ASDF, Python) to be already installed, but these aren't available on a fresh remote machine. Additionally, the remote machine may not even have zsh as the default shell or Oh My Zsh installed.

## Solution Strategy

### Phase 1: Create a Bootstrap Script
Create a `bootstrap.sh` script that installs essential dependencies before running stow:

1. **Detect OS** (macOS vs Linux)
2. **Install Zsh** (if not present):
   - macOS: Usually pre-installed, but check
   - Linux: `sudo apt-get install zsh` or equivalent
3. **Install Package Manager**:
   - macOS: Install Homebrew if not present
   - Linux: Use apt/yum/etc (already available)
4. **Install Oh My Zsh**:
   - Download and run the Oh My Zsh installer
   - Handle existing installation gracefully
5. **Install GNU Stow**:
   - macOS: `brew install stow`
   - Linux: `sudo apt-get install stow` or equivalent
6. **Install Core Dependencies**:
   - ASDF version manager
   - Python (if needed)
   - zsh-autosuggestions plugin
   - Any other essentials
7. **Set Zsh as default shell** (if user confirms)

### Phase 2: Create a Conditional .zshrc
Modify .zshrc to gracefully handle missing dependencies:

1. **Add existence checks** before sourcing:
   ```bash
   # Check if brew exists before using it
   if command -v brew &> /dev/null; then
       . "$(brew --prefix)/libexec/asdf.sh"
   fi
   ```

2. **Create a minimal mode** that works without dependencies:
   - Basic PATH setup
   - Essential aliases
   - Skip plugin loading if Oh My Zsh isn't installed

3. **Add lazy installation prompts** for missing tools

### Phase 3: Update sshs Function
Enhance the sshs function to:

1. Run bootstrap.sh before setup.sh
2. Handle different shell environments (bash, zsh, etc.)
3. Provide better error handling and feedback
4. Ensure zsh is used for the final shell execution
5. Add a flag to skip bootstrap for already-configured machines

### Phase 4: Create Machine-Specific Configuration
Add support for machine-specific configs:

1. Create `.zsh/machines/` directory
2. Source machine-specific files based on hostname
3. Allow overrides for paths and tool locations

## Implementation Steps

1. **Create bootstrap.sh**:
   - OS detection logic
   - Zsh installation check and install
   - Oh My Zsh installation (with existing install detection)
   - Homebrew installation (macOS)
   - GNU Stow installation
   - ASDF installation
   - Basic Python setup
   - zsh-autosuggestions plugin installation
   - Optional: prompt to change default shell to zsh

2. **Refactor .zshrc**:
   - Add conditional checks for all external dependencies
   - Create fallback behavior for missing tools
   - Add informative messages when tools are missing

3. **Update setup.sh**:
   - Call bootstrap.sh if stow is not found
   - Add better error handling
   - Provide progress feedback

4. **Implement sshs function**:
   - Add to .zshrc with proper repository URL
   - Include bootstrap step
   - Add options for force-reinstall

5. **Test on fresh machine**:
   - Verify bootstrap works on clean macOS
   - Test on Ubuntu/Debian
   - Ensure idempotency (running multiple times is safe)

## Expected Outcome

After implementation:
- `sshs m1l` will work on any fresh machine
- No errors during initial setup
- Graceful degradation when optional tools are missing
- Clear messages about what's being installed
- Faster subsequent syncs (skip unnecessary steps)

## Alternative Approaches Considered

1. **Docker/Container approach**: Too heavy for dotfiles
2. **Ansible/Chef**: Overkill for personal dotfiles
3. **Manual README instructions**: Not automated enough
4. **Nix/Home Manager**: Too complex for this use case

## Next Steps

1. Review this plan
2. Implement bootstrap.sh first
3. Test on a local VM or container
4. Gradually update .zshrc with conditionals
5. Deploy and test on actual remote machines