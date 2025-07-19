-- Animation test commands
return {
  {
    "echasnovski/mini.animate",
    keys = {
      {
        "<leader>at",
        function()
          -- Test cursor animation by jumping around
          local pos = vim.api.nvim_win_get_cursor(0)
          vim.cmd("normal! gg")
          vim.defer_fn(function()
            vim.cmd("normal! G")
            vim.defer_fn(function()
              vim.api.nvim_win_set_cursor(0, pos)
            end, 500)
          end, 500)
        end,
        desc = "Test cursor animation",
      },
      {
        "<leader>aw",
        function()
          -- Test window animations
          vim.cmd("split")
          vim.defer_fn(function()
            vim.cmd("vsplit")
            vim.defer_fn(function()
              vim.cmd("only")
            end, 1000)
          end, 500)
        end,
        desc = "Test window animations",
      },
      {
        "<leader>as",
        function()
          -- Check animation status
          local ok, animate = pcall(require, "mini.animate")
          if ok then
            vim.notify("mini.animate is loaded", vim.log.levels.INFO)
            local config = animate.config or {}
            for animation_type, cfg in pairs(config) do
              local enabled = cfg.enable ~= false
              vim.notify(string.format("%s animation: %s", animation_type, enabled and "enabled" or "disabled"), vim.log.levels.INFO)
            end
          else
            vim.notify("mini.animate is NOT loaded", vim.log.levels.ERROR)
          end
        end,
        desc = "Check animation status",
      },
    },
  },
}