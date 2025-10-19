vim.g.mapleader = " "

-- File explorer
vim.keymap.set("n", "<leader>pv", vim.cmd.Ex, { desc = "Open file explorer" })

-- Tmux navigation is now configured in lazy.lua via vim-tmux-navigator plugin

-- Window Navigation (grouped)
vim.keymap.set('n', '<leader>wnw', '<C-w>w', { desc = 'Cycle to next window' })
vim.keymap.set('n', '<leader>wnW', '<C-w>W', { desc = 'Cycle to prev window' })
vim.keymap.set('n', '<leader>wnp', '<C-w>p', { desc = 'Go to previous window' })
vim.keymap.set('n', '<leader>wnt', '<C-w>t', { desc = 'Go to top-left window' })
vim.keymap.set('n', '<leader>wnb', '<C-w>b', { desc = 'Go to bottom-right window' })

-- Window Splitting (grouped)
vim.keymap.set('n', '<leader>wss', '<C-w>s', { desc = 'Split horizontal' })
vim.keymap.set('n', '<leader>wsv', '<C-w>v', { desc = 'Split vertical' })
vim.keymap.set('n', '<leader>wsn', '<C-w>n', { desc = 'New window (empty)' })
vim.keymap.set('n', '<leader>wsq', '<C-w>q', { desc = 'Quit window' })

-- Frequently used window commands (at top level)
vim.keymap.set('n', '<leader>wh', '<C-w>h', { desc = 'Move to left window' })
vim.keymap.set('n', '<leader>wj', '<C-w>j', { desc = 'Move to bottom window' })
vim.keymap.set('n', '<leader>wk', '<C-w>k', { desc = 'Move to top window' })
vim.keymap.set('n', '<leader>wl', '<C-w>l', { desc = 'Move to right window' })
vim.keymap.set('n', '<leader>wc', '<C-w>c', { desc = 'Close window' })
vim.keymap.set('n', '<leader>wo', '<C-w>o', { desc = 'Close all other windows' })

-- Window Resizing
vim.keymap.set('n', '<leader>wr=', '<C-w>=', { desc = 'Equal size windows' })
vim.keymap.set('n', '<leader>wr_', '<C-w>_', { desc = 'Maximize height' })
vim.keymap.set('n', '<leader>wr|', '<C-w>|', { desc = 'Maximize width' })
vim.keymap.set('n', '<leader>wr+', '<C-w>+', { desc = 'Increase height' })
vim.keymap.set('n', '<leader>wr-', '<C-w>-', { desc = 'Decrease height' })
vim.keymap.set('n', '<leader>wr>', '<C-w>>', { desc = 'Increase width' })
vim.keymap.set('n', '<leader>wr<', '<C-w><', { desc = 'Decrease width' })

-- Window Moving
vim.keymap.set('n', '<leader>wmH', '<C-w>H', { desc = 'Move window far left' })
vim.keymap.set('n', '<leader>wmJ', '<C-w>J', { desc = 'Move window far bottom' })
vim.keymap.set('n', '<leader>wmK', '<C-w>K', { desc = 'Move window far top' })
vim.keymap.set('n', '<leader>wmL', '<C-w>L', { desc = 'Move window far right' })
vim.keymap.set('n', '<leader>wmr', '<C-w>r', { desc = 'Rotate windows down/right' })
vim.keymap.set('n', '<leader>wmR', '<C-w>R', { desc = 'Rotate windows up/left' })
vim.keymap.set('n', '<leader>wmx', '<C-w>x', { desc = 'Exchange with next window' })
vim.keymap.set('n', '<leader>wmT', '<C-w>T', { desc = 'Move to new tab' })

-- Move lines in visual mode
vim.keymap.set("v", "J", ":m '>+1<CR>gv=gv", { desc = "Move line down" })
vim.keymap.set("v", "K", ":m '<-2<CR>gv=gv", { desc = "Move line up" })

-- Keep cursor centered while navigating
vim.keymap.set("n", "J", "mzJ`z", { desc = "Join lines (keep cursor)" })
vim.keymap.set("n", "<C-d>", "<C-d>zz", { desc = "Half page down (centered)" })
vim.keymap.set("n", "<C-u>", "<C-u>zz", { desc = "Half page up (centered)" })
vim.keymap.set("n", "n", "nzzzv", { desc = "Next search (centered)" })
vim.keymap.set("n", "N", "Nzzzv", { desc = "Prev search (centered)" })
vim.keymap.set("n", "=ap", "ma=ap'a", { desc = "Format paragraph" })

-- Restart LSP
vim.keymap.set("n", "<leader>zig", "<cmd>LspRestart<cr>", { desc = "Restart LSP" })

-- Greatest remap ever - paste without yanking deleted text
vim.keymap.set("x", "<leader>p", [["_dP]], { desc = "Paste without yank" })

-- Delete to black hole register (don't affect clipboard)
vim.keymap.set({ "n", "v" }, "<leader>d", "\"_d", { desc = "Delete (no clipboard)" })

-- Make Ctrl-C act like Escape
vim.keymap.set("i", "<C-c>", "<Esc>", { desc = "Exit insert mode" })

-- Disable Q (ex mode)
vim.keymap.set("n", "Q", "<nop>", { desc = "Disabled (ex mode)" })

-- Quickfix and location list navigation
vim.keymap.set("n", "<leader>cn", "<cmd>cnext<CR>zz", { desc = "Next quickfix" })
vim.keymap.set("n", "<leader>cp", "<cmd>cprev<CR>zz", { desc = "Prev quickfix" })
vim.keymap.set("n", "<leader>ln", "<cmd>lnext<CR>zz", { desc = "Next location" })
vim.keymap.set("n", "<leader>lp", "<cmd>lprev<CR>zz", { desc = "Prev location" })

-- Search and replace word under cursor
vim.keymap.set("n", "<leader>s", [[:%s/\<<C-r><C-w>\>/<C-r><C-w>/gI<Left><Left><Left>]], { desc = "Replace word under cursor" })

-- Live grep with word under cursor
vim.keymap.set("n", "?", function()
  local word = vim.fn.expand('<cword>')
  require('telescope.builtin').live_grep({ default_text = word })
end, { desc = "Live grep word under cursor" })

-- Quick access to git menu (ba-tools)
vim.keymap.set("n", "<C-g>", function()
  require('ba-tools').git_menu()
end, { desc = "Git menu" })

-- Make current file executable
vim.keymap.set("n", "<leader>x", "<cmd>!chmod +x %<CR>", { silent = true, desc = "Make file executable" })

-- Reload neovim config
vim.keymap.set("n", "<leader><leader>", function()
    vim.cmd("source " .. vim.fn.stdpath("config") .. "/init.lua")
    print("Config reloaded!")
end, { desc = "Reload config" })

-- Save file with Ctrl+s
vim.keymap.set({ 'n', 'i', 'v' }, '<C-s>', '<cmd>w<cr><Esc>', { desc = 'Save file' })

-- Copy file paths
vim.keymap.set('n', '<leader>pr', function()
  local path = vim.fn.expand('%')
  vim.fn.setreg('+', path)
  print('Copied relative path: ' .. path)
end, { desc = 'Copy relative path' })

vim.keymap.set('n', '<leader>pa', function()
  local path = vim.fn.expand('%:p')
  vim.fn.setreg('+', path)
  print('Copied absolute path: ' .. path)
end, { desc = 'Copy absolute path' })

-- Terminal mode
vim.keymap.set('t', '<C-Space>', '<C-\\><C-n>', { desc = 'Exit terminal mode' })
