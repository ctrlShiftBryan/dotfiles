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

-- Enable word wrap for markdown files
vim.api.nvim_create_autocmd("FileType", {
  pattern = "markdown",
  callback = function()
    vim.opt_local.wrap = true
  end,
})

-- Diagnostic configuration with squiggly underlines
vim.diagnostic.config({
  underline = true,
  virtual_text = {
    spacing = 4,
    prefix = function(diagnostic)
      local source = diagnostic.source or "unknown"
      return string.format("[%s]", source)
    end,
  },
  signs = true,
  update_in_insert = false,
  severity_sort = true,
})

-- Use curly underlines for diagnostics (requires terminal support)
vim.cmd([[
  highlight DiagnosticUnderlineError cterm=undercurl gui=undercurl guisp=#db4b4b
  highlight DiagnosticUnderlineWarn cterm=undercurl gui=undercurl guisp=#e0af68
  highlight DiagnosticUnderlineInfo cterm=undercurl gui=undercurl guisp=#0db9d7
  highlight DiagnosticUnderlineHint cterm=undercurl gui=undercurl guisp=#10b981
]])
