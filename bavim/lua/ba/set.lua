-- Line numbers
vim.opt.nu = true
vim.opt.relativenumber = true

-- Tabs and indentation
vim.opt.tabstop = 4
vim.opt.softtabstop = 4
vim.opt.shiftwidth = 4
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
