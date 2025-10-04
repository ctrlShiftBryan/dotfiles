vim.g.mapleader = " "

-- File explorer
vim.keymap.set("n", "<leader>pv", vim.cmd.Ex)

-- Window commands
vim.keymap.set('n', '<leader>w', '<C-w>', { desc = 'Window commands' })

-- Move lines in visual mode
vim.keymap.set("v", "J", ":m '>+1<CR>gv=gv")
vim.keymap.set("v", "K", ":m '<-2<CR>gv=gv")

-- Keep cursor centered while navigating
vim.keymap.set("n", "J", "mzJ`z") -- Join lines but keep cursor position
vim.keymap.set("n", "<C-d>", "<C-d>zz") -- Half page down + center
vim.keymap.set("n", "<C-u>", "<C-u>zz") -- Half page up + center
vim.keymap.set("n", "n", "nzzzv") -- Next search + center
vim.keymap.set("n", "N", "Nzzzv") -- Previous search + center
vim.keymap.set("n", "=ap", "ma=ap'a") -- Format paragraph + return to position

-- Restart LSP
vim.keymap.set("n", "<leader>zig", "<cmd>LspRestart<cr>")

-- Greatest remap ever - paste without yanking deleted text
vim.keymap.set("x", "<leader>p", [["_dP]])

-- Delete to black hole register (don't affect clipboard)
vim.keymap.set({ "n", "v" }, "<leader>d", "\"_d")

-- Make Ctrl-C act like Escape
vim.keymap.set("i", "<C-c>", "<Esc>")

-- Disable Q (ex mode)
vim.keymap.set("n", "Q", "<nop>")

-- Quickfix and location list navigation (avoiding window nav conflicts)
vim.keymap.set("n", "<leader>cn", "<cmd>cnext<CR>zz") -- Next quickfix
vim.keymap.set("n", "<leader>cp", "<cmd>cprev<CR>zz") -- Previous quickfix
vim.keymap.set("n", "<leader>ln", "<cmd>lnext<CR>zz") -- Next location list
vim.keymap.set("n", "<leader>lp", "<cmd>lprev<CR>zz") -- Previous location list

-- Search and replace word under cursor
vim.keymap.set("n", "<leader>s", [[:%s/\<<C-r><C-w>\>/<C-r><C-w>/gI<Left><Left><Left>]])

-- Make current file executable
vim.keymap.set("n", "<leader>x", "<cmd>!chmod +x %<CR>", { silent = true })

-- Source current file (reload config)
vim.keymap.set("n", "<leader><leader>", function()
    vim.cmd("so")
end)

-- Save file with Ctrl+s
vim.keymap.set({ 'n', 'i', 'v' }, '<C-s>', '<cmd>w<cr><Esc>', { desc = 'Save file' })
