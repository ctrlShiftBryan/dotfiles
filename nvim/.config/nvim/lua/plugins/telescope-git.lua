return {
  "nvim-telescope/telescope.nvim",
  keys = {
    -- Git-related keybindings
    { "<leader>gS", "<cmd>Telescope git_status<cr>", desc = "Git Status (Telescope)" },
    { "<leader>gc", "<cmd>Telescope git_commits<cr>", desc = "Git Commits" },
    { "<leader>gC", "<cmd>Telescope git_bcommits<cr>", desc = "Git Buffer Commits" },
    { "<leader>gB", "<cmd>Telescope git_branches<cr>", desc = "Git Branches" },
    { "<leader>gt", "<cmd>Telescope git_stash<cr>", desc = "Git Stash" },
  },
}