-- Line numbers
vim.opt.nu = true
vim.opt.relativenumber = true

-- Tabs and indentation (2 spaces for JS/TS)
vim.opt.tabstop = 2
vim.opt.softtabstop = 2
vim.opt.shiftwidth = 2
vim.opt.expandtab = true
vim.opt.smartindent = true

-- Line wrapping
vim.opt.wrap = false

-- Backup and swap files
vim.opt.swapfile = false
vim.opt.backup = false

-- Persistent undo
vim.opt.undofile = true
vim.opt.undodir = os.getenv("HOME") .. "/.vim/undodir"

-- Search
vim.opt.hlsearch = false
vim.opt.incsearch = true

-- Colors
vim.opt.termguicolors = true
vim.opt.colorcolumn = "80"

-- Scrolling
vim.opt.scrolloff = 8

-- Sign column
vim.opt.signcolumn = "yes"

-- Filename characters
vim.opt.isfname:append("@-@")

-- Update time
vim.opt.updatetime = 50

-- Use system clipboard
vim.opt.clipboard = "unnamedplus"

-- Use zsh as default shell with interactive mode to load aliases
vim.o.shell = "/bin/zsh"
vim.o.shellcmdflag = "-ic"
