return {
  {
    "folke/snacks.nvim",
    opts = {
      explorer = {
        -- Show hidden files (dotfiles)
        hidden = {
          enabled = true,
          show_count = true, -- Show count of hidden files
        },
        -- Add explicit keymaps for expand/collapse
        keys = {
          ["<cr>"] = "expand_or_open",
          ["l"] = "expand_or_open",
          ["h"] = "close",
          ["<tab>"] = "expand_or_open",
          ["g."] = "toggle_hidden", -- Toggle hidden files with g.
        },
      },
    },
  },
}
