-- Bootstrap lazy.nvim
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system({
    "git",
    "clone",
    "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--branch=stable",
    lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

-- Setup lazy.nvim
require("lazy").setup({
  -- VSCode theme
  {
    'Mofiqul/vscode.nvim',
    priority = 1000,
    config = function()
      require('vscode').setup({
        style = 'dark',
        transparent = false,
        italic_comments = true,
      })
      require('vscode').load()
    end,
  },

  -- Treesitter
  {
    'nvim-treesitter/nvim-treesitter',
    build = ':TSUpdate',
    config = function()
      require('nvim-treesitter.configs').setup({
        ensure_installed = { 'lua', 'vim', 'vimdoc', 'javascript', 'typescript', 'python', 'bash', 'json', 'markdown' },
        auto_install = true,
        highlight = {
          enable = true,
        },
        indent = {
          enable = true,
        },
      })
    end,
  },

  -- Harpoon
  {
    'ThePrimeagen/harpoon',
    branch = 'harpoon2',
    dependencies = { 'nvim-lua/plenary.nvim' },
    config = function()
      local harpoon = require('harpoon')
      harpoon:setup()
    end,
    keys = {
      {
        '<leader>a',
        function() require('harpoon'):list():add() end,
        desc = 'Harpoon add file'
      },
      {
        '<C-e>',
        function() require('harpoon').ui:toggle_quick_menu(require('harpoon'):list()) end,
        desc = 'Harpoon menu'
      },
      {
        '<C-h>',
        function() require('harpoon'):list():select(1) end,
        desc = 'Harpoon file 1'
      },
      {
        '<C-j>',
        function() require('harpoon'):list():select(2) end,
        desc = 'Harpoon file 2'
      },
      {
        '<C-k>',
        function() require('harpoon'):list():select(3) end,
        desc = 'Harpoon file 3'
      },
      {
        '<C-l>',
        function() require('harpoon'):list():select(4) end,
        desc = 'Harpoon file 4'
      },
    },
  },

  -- Undotree
  {
    'mbbill/undotree',
    keys = {
      { '<leader>u', '<cmd>UndotreeToggle<cr>', desc = 'Toggle undotree' },
    },
  },

  -- Fugitive - Git integration
  {
    'tpope/vim-fugitive',
    cmd = { 'Git', 'G', 'Gdiffsplit', 'Gread', 'Gwrite', 'Ggrep', 'GMove', 'GDelete', 'GBrowse', 'GRemove', 'GRename', 'Glgrep', 'Gedit' },
    keys = {
      { '<leader>gs', '<cmd>Git<cr>', desc = 'Git status' },
      { '<leader>gb', '<cmd>Git blame<cr>', desc = 'Git blame' },
      { '<leader>gd', '<cmd>Gdiffsplit<cr>', desc = 'Git diff' },
    },
  },

  -- Telescope fuzzy finder
  {
    'nvim-telescope/telescope.nvim',
    tag = '0.1.8',
    dependencies = {
      'nvim-lua/plenary.nvim',
      'nvim-tree/nvim-web-devicons',
      {
        'nvim-telescope/telescope-fzf-native.nvim',
        build = 'make'
      }
    },
    config = function()
      require('telescope').setup({
        pickers = {
          live_grep = {
            additional_args = function()
              return {
                "--glob", "!**/*.snap",
                "--glob", "!stubs/**/*.json",
              }
            end,
          },
        },
      })
    end,
    keys = {
      {
        '<leader>ff',
        function()
          local builtin = require('telescope.builtin')
          local ok = pcall(builtin.git_files, {})
          if not ok then
            builtin.find_files({})
          end
        end,
        desc = 'Find files (git or all)'
      },
      { '<leader>fg', '<cmd>Telescope live_grep<cr>', desc = 'Live grep' },
      { '<leader>fb', '<cmd>Telescope buffers<cr>', desc = 'Buffers' },
      { '<leader>fh', '<cmd>Telescope help_tags<cr>', desc = 'Help tags' },
    },
  },
}, {
  -- Lazy.nvim options
  checker = { enabled = true }, -- automatically check for plugin updates
})
