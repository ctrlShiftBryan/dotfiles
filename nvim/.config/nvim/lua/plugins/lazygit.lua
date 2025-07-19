return {
  "kdheepak/lazygit.nvim",
  lazy = true,
  cmd = {
    "LazyGit",
    "LazyGitConfig",
    "LazyGitCurrentFile",
    "LazyGitFilter",
    "LazyGitFilterCurrentFile",
  },
  -- optional for floating window border decoration
  dependencies = {
    "nvim-lua/plenary.nvim",
  },
  -- setting the keybinding for LazyGit with 'keys' is recommended in
  -- order to load the plugin when the command is run for the first time
  keys = {
    { "<leader>gg", "<cmd>LazyGit<cr>", desc = "LazyGit" },
    { "<leader>gG", "<cmd>LazyGitCurrentFile<cr>", desc = "LazyGit (current file)" },
    { "<leader>gc", "<cmd>LazyGitConfig<cr>", desc = "LazyGit Config" },
    { "<leader>gf", "<cmd>LazyGitFilter<cr>", desc = "LazyGit Filter" },
  },
  config = function()
    require("lazygit.utils").project_root_dir = function()
      -- Use LazyVim's root detection
      return require("lazyvim.util").root.get()
    end
  end,
}