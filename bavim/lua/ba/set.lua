-- Persistent undo
vim.opt.undofile = true
vim.opt.undodir = os.getenv("HOME") .. "/.vim/undodir"

-- Use system clipboard
vim.opt.clipboard = "unnamedplus"
