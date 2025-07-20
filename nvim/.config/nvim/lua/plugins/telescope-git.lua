return {
  {
    "nvim-telescope/telescope.nvim",
    dependencies = { "nvim-lua/plenary.nvim" },
    keys = {
      -- Git-related keybindings
      { "<leader>gf", "<cmd>Telescope git_files<cr>", desc = "Find Git Files" },
      { "<leader>gc", "<cmd>Telescope git_commits<cr>", desc = "Git Commits" },
      { "<leader>gC", "<cmd>Telescope git_bcommits<cr>", desc = "Git Buffer Commits" },
      { "<leader>gb", "<cmd>Telescope git_branches<cr>", desc = "Git Branches" },
      { "<leader>gt", "<cmd>Telescope git_status<cr>", desc = "Git Status (Telescope)" },
      { "<leader>gS", "<cmd>Telescope git_stash<cr>", desc = "Git Stash" },
    },
    opts = {
      defaults = {
        git_worktrees = vim.g.git_worktrees,
        path_display = { "truncate" },
        sorting_strategy = "ascending",
        layout_config = {
          horizontal = { prompt_position = "top" },
          vertical = { mirror = false },
        },
      },
      pickers = {
        git_status = {
          initial_mode = "normal",
          layout_strategy = "vertical",
          layout_config = {
            vertical = {
              preview_height = 0.6,
            },
          },
        },
        git_commits = {
          initial_mode = "normal",
          layout_strategy = "vertical",
          layout_config = {
            vertical = {
              preview_height = 0.6,
            },
          },
        },
      },
    },
  },
}