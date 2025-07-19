-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here

-- Copy file paths to clipboard
vim.keymap.set("n", "<leader>cf", function()
  local path = vim.fn.expand("%:.")
  vim.fn.setreg("+", path)
  vim.notify('Copied: "' .. path .. '"')
end, { desc = "Copy relative file path" })

vim.keymap.set("n", "<leader>cF", function()
  local path = vim.fn.expand("%:p")
  vim.fn.setreg("+", path)
  vim.notify('Copied: "' .. path .. '"')
end, { desc = "Copy absolute file path" })

vim.keymap.set("n", "<leader>cn", function()
  local path = vim.fn.expand("%:t")
  vim.fn.setreg("+", path)
  vim.notify('Copied: "' .. path .. '"')
end, { desc = "Copy filename" })

vim.keymap.set("n", "<leader>cP", function()
  local path = vim.fn.expand("%:~")
  vim.fn.setreg("+", path)
  vim.notify('Copied: "' .. path .. '"')
end, { desc = "Copy path relative to home" })
