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

  -- vim-tmux-navigator with Alt key mappings (instead of Ctrl to avoid breaking Shift+Enter)
  {
    'christoomey/vim-tmux-navigator',
    lazy = false,
    init = function()
      -- Disable default Ctrl mappings
      vim.g.tmux_navigator_no_mappings = 1
    end,
    config = function()
      -- Use Alt keys instead of Ctrl
      vim.keymap.set('n', '<M-h>', '<cmd>TmuxNavigateLeft<cr>', { desc = 'Navigate left (vim/tmux)' })
      vim.keymap.set('n', '<M-j>', '<cmd>TmuxNavigateDown<cr>', { desc = 'Navigate down (vim/tmux)' })
      vim.keymap.set('n', '<M-k>', '<cmd>TmuxNavigateUp<cr>', { desc = 'Navigate up (vim/tmux)' })
      vim.keymap.set('n', '<M-l>', '<cmd>TmuxNavigateRight<cr>', { desc = 'Navigate right (vim/tmux)' })

      -- Same mappings work from terminal mode
      vim.keymap.set('t', '<M-h>', '<cmd>TmuxNavigateLeft<cr>', { desc = 'Navigate left from terminal' })
      vim.keymap.set('t', '<M-j>', '<C-\\><C-n><cmd>TmuxNavigateDown<cr>', { desc = 'Navigate down from terminal' })
      vim.keymap.set('t', '<M-k>', '<C-\\><C-n><cmd>TmuxNavigateUp<cr>', { desc = 'Navigate up from terminal' })
      vim.keymap.set('t', '<M-l>', '<C-\\><C-n><cmd>TmuxNavigateRight<cr>', { desc = 'Navigate right from terminal' })
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
      { '<leader>gb', '<cmd>Git blame<cr>', desc = 'Git blame' },
      { '<leader>gd', '<cmd>Gdiffsplit<cr>', desc = 'Git diff' },
    },
  },

  -- Diffview - VSCode-like diff view
  {
    'sindrets/diffview.nvim',
    dependencies = { 'nvim-lua/plenary.nvim' },
    cmd = { 'DiffviewOpen', 'DiffviewClose', 'DiffviewFileHistory' },
    keys = {
      { '<leader>gv', '<cmd>DiffviewOpen<cr>', desc = 'Open diffview' },
      { '<leader>gh', '<cmd>DiffviewFileHistory %<cr>', desc = 'File history' },
      { '<leader>gc', '<cmd>DiffviewClose<cr>', desc = 'Close diffview' },
    },
  },

  -- Gitsigns - Inline git change indicators
  {
    'lewis6991/gitsigns.nvim',
    event = { 'BufReadPre', 'BufNewFile' },
    opts = {
      signs = {
        add          = { text = '│' },
        change       = { text = '│' },
        delete       = { text = '_' },
        topdelete    = { text = '‾' },
        changedelete = { text = '~' },
        untracked    = { text = '┆' },
      },
      on_attach = function(bufnr)
        local gs = package.loaded.gitsigns

        local function map(mode, l, r, opts)
          opts = opts or {}
          opts.buffer = bufnr
          vim.keymap.set(mode, l, r, opts)
        end

        -- Navigation
        map('n', ']c', function()
          if vim.wo.diff then return ']c' end
          vim.schedule(function() gs.next_hunk() end)
          return '<Ignore>'
        end, {expr=true, desc = 'Next hunk'})

        map('n', '[c', function()
          if vim.wo.diff then return '[c' end
          vim.schedule(function() gs.prev_hunk() end)
          return '<Ignore>'
        end, {expr=true, desc = 'Previous hunk'})

        -- Actions
        map('n', '<leader>hs', gs.stage_hunk, { desc = 'Stage hunk' })
        map('n', '<leader>hr', gs.reset_hunk, { desc = 'Reset hunk' })
        map('v', '<leader>hs', function() gs.stage_hunk {vim.fn.line('.'), vim.fn.line('v')} end, { desc = 'Stage hunk' })
        map('v', '<leader>hr', function() gs.reset_hunk {vim.fn.line('.'), vim.fn.line('v')} end, { desc = 'Reset hunk' })
        map('n', '<leader>hS', gs.stage_buffer, { desc = 'Stage buffer' })
        map('n', '<leader>hu', gs.undo_stage_hunk, { desc = 'Undo stage hunk' })
        map('n', '<leader>hR', gs.reset_buffer, { desc = 'Reset buffer' })
        map('n', '<leader>hp', gs.preview_hunk, { desc = 'Preview hunk' })
        map('n', '<leader>hb', function() gs.blame_line{full=true} end, { desc = 'Blame line' })
        map('n', '<leader>tb', gs.toggle_current_line_blame, { desc = 'Toggle line blame' })
        map('n', '<leader>hd', gs.diffthis, { desc = 'Diff this' })
        map('n', '<leader>hD', function() gs.diffthis('~') end, { desc = 'Diff this ~' })
        map('n', '<leader>td', gs.toggle_deleted, { desc = 'Toggle deleted' })

        -- Text object
        map({'o', 'x'}, 'ih', ':<C-U>Gitsigns select_hunk<CR>', { desc = 'Select hunk' })
      end
    },
  },

  -- Octo - GitHub integration
  {
    'pwntester/octo.nvim',
    dependencies = {
      'nvim-lua/plenary.nvim',
      'nvim-telescope/telescope.nvim',
      'nvim-tree/nvim-web-devicons',
    },
    cmd = 'Octo',
    keys = {
      { '<leader>go', '<cmd>Octo<cr>', desc = 'Octo' },
      { '<leader>gpl', '<cmd>Octo pr list<cr>', desc = 'List PRs' },
      { '<leader>gpc', '<cmd>Octo pr checkout<cr>', desc = 'Checkout PR' },
      { '<leader>gpr', '<cmd>Octo pr create<cr>', desc = 'Create PR' },
      { '<leader>gpv', '<cmd>Octo pr view<cr>', desc = 'View PR' },
    },
    config = function()
      require('octo').setup({
        enable_builtin = true,
        default_to_projects_v2 = true,
        default_merge_method = 'squash',
      })
    end,
  },

  -- LSP Support
  {
    'neovim/nvim-lspconfig',
    dependencies = {
      -- Mason for installing LSP servers
      { 'williamboman/mason.nvim', config = true },
      { 'williamboman/mason-lspconfig.nvim' },

      -- Autocompletion
      { 'hrsh7th/nvim-cmp' },
      { 'hrsh7th/cmp-nvim-lsp' },
      { 'hrsh7th/cmp-buffer' },
      { 'hrsh7th/cmp-path' },
      { 'L3MON4D3/LuaSnip' },
      { 'saadparwaiz1/cmp_luasnip' },
    },
    config = function()
      -- Setup mason
      require('mason').setup()
      require('mason-lspconfig').setup({
        ensure_installed = { 'lua_ls', 'ts_ls', 'eslint' },
        automatic_installation = true,
      })

      -- Setup completion
      local cmp = require('cmp')
      local cmp_lsp = require('cmp_nvim_lsp')
      local capabilities = cmp_lsp.default_capabilities()

      cmp.setup({
        snippet = {
          expand = function(args)
            require('luasnip').lsp_expand(args.body)
          end,
        },
        mapping = cmp.mapping.preset.insert({
          ['<C-p>'] = cmp.mapping.select_prev_item(),
          ['<C-n>'] = cmp.mapping.select_next_item(),
          ['<C-y>'] = cmp.mapping.confirm({ select = true }),
          ['<C-Space>'] = cmp.mapping.complete(),

          -- Tab to accept suggestion
          ['<Tab>'] = cmp.mapping(function(fallback)
            if cmp.visible() then
              cmp.confirm({ select = true })
            else
              fallback() -- normal tab behavior when menu isn't open
            end
          end, { 'i', 's' }),
        }),
        sources = cmp.config.sources({
          { name = 'nvim_lsp' },
          { name = 'luasnip' },
        }, {
          { name = 'buffer' },
          { name = 'path' },
        })
      })

      -- LSP keymaps on attach
      local on_attach = function(client, bufnr)
        local opts = { buffer = bufnr, remap = false }
        vim.keymap.set('n', 'gd', vim.lsp.buf.definition, opts)
        vim.keymap.set('n', 'K', vim.lsp.buf.hover, opts)
        vim.keymap.set('n', '<leader>vws', vim.lsp.buf.workspace_symbol, opts)
        vim.keymap.set('n', '<leader>vd', vim.diagnostic.open_float, opts)
        vim.keymap.set('n', '<leader>vy', function()
          local diagnostics = vim.diagnostic.get(0, { lnum = vim.fn.line('.') - 1 })
          if #diagnostics > 0 then
            local diag = diagnostics[1]
            local filepath = vim.fn.expand('%')
            local line = diag.lnum + 1
            local col = diag.col + 1
            local message = string.format("%s in file '%s' line %d column %d",
              diag.message, filepath, line, col)
            vim.diagnostic.open_float()
            vim.fn.setreg('+', message)
            print('Diagnostic with location copied to clipboard')
          end
        end, opts)
        vim.keymap.set('n', '[d', vim.diagnostic.goto_next, opts)
        vim.keymap.set('n', ']d', vim.diagnostic.goto_prev, opts)
        vim.keymap.set('n', '<leader>vca', vim.lsp.buf.code_action, opts)
        vim.keymap.set('n', '<leader>vrr', vim.lsp.buf.references, opts)
        vim.keymap.set('n', '<leader>vrn', vim.lsp.buf.rename, opts)
        vim.keymap.set('i', '<C-h>', vim.lsp.buf.signature_help, opts)
      end

      -- Configure LSP servers using new vim.lsp.config API
      vim.lsp.config('lua_ls', {
        cmd = { 'lua-language-server' },
        root_markers = { '.luarc.json', '.luarc.jsonc', '.luacheckrc', '.stylua.toml', 'stylua.toml', 'selene.toml', 'selene.yml', '.git' },
        capabilities = capabilities,
        on_attach = on_attach,
        settings = {
          Lua = {
            diagnostics = {
              globals = { 'vim' }
            }
          }
        }
      })

      vim.lsp.config('ts_ls', {
        cmd = { 'typescript-language-server', '--stdio' },
        root_markers = { 'package.json', 'tsconfig.json', 'jsconfig.json', '.git' },
        capabilities = capabilities,
        on_attach = on_attach,
      })

      vim.lsp.config('eslint', {
        cmd = { 'vscode-eslint-language-server', '--stdio' },
        root_markers = { '.eslintrc', '.eslintrc.js', '.eslintrc.json', 'package.json', '.git' },
        capabilities = capabilities,
        on_attach = on_attach,
      })

      -- Enable LSP servers
      vim.lsp.enable('lua_ls')
      vim.lsp.enable('ts_ls')
      vim.lsp.enable('eslint')
    end,
  },

  -- which-key - show keybindings
  {
    'folke/which-key.nvim',
    event = 'VeryLazy',
    config = function()
      local wk = require('which-key')
      wk.setup({
        delay = 200, -- delay before popup shows (ms)
        preset = "modern", -- modern gives us centered position
        keys = {
          scroll_down = "<c-f>", -- scroll down (avoid conflict with <c-d>)
          scroll_up = "<c-b>",   -- scroll up (avoid conflict with <c-u>)
        },
        win = {
          border = "single",
          padding = { 1, 1 }, -- minimal padding like helix
          height = { min = 4, max = 15 }, -- compact height
          width = { min = 40, max = 80 }, -- compact width
          row = math.floor(vim.o.lines / 4), -- center vertically (half of screen height)
        },
        layout = {
          spacing = 1, -- tight spacing like helix
          align = "center",
        },
        icons = {
          separator = "→", -- clean separator
          group = "+", -- simple group indicator
        },
      })

      -- Define groups
      wk.add({
        { "<leader>f", group = "Find (Telescope)" },
        { "<leader>g", group = "Git" },
        { "<leader>gp", group = "Pull Request" },
        { "<leader>h", group = "Hunk" },
        { "<leader>t", group = "Tools/Toggle" },
        { "<leader>v", group = "LSP" },
        { "<leader>w", group = "Window" },
        { "<leader>wn", group = "Navigate" },
        { "<leader>ws", group = "Split" },
        { "<leader>wr", group = "Resize" },
        { "<leader>wm", group = "Move" },
        { "<leader>c", group = "Quickfix" },
        { "<leader>l", group = "Location List" },
        { "<leader>p", group = "Path" },
        { "<leader>z", group = "LSP Tools" },
        { "<leader>d", group = "Delete" },
      })
    end,
  },

  -- Comment.nvim - Smart commenting with JSX support
  {
    'numToStr/Comment.nvim',
    dependencies = {
      'JoosepAlviste/nvim-ts-context-commentstring'
    },
    event = { 'BufReadPre', 'BufNewFile' },
    config = function()
      require('Comment').setup({
        pre_hook = require('ts_context_commentstring.integrations.comment_nvim').create_pre_hook(),
      })
    end,
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
      local actions = require('telescope.actions')
      local action_state = require('telescope.actions.state')

      require('telescope').setup({
        pickers = {
          live_grep = {
            additional_args = function()
              return {
                "--hidden",
                "--glob", "!**/*.snap",
                "--glob", "!stubs/**/*.json",
                "--glob", "!.git"
              }
            end,
          },
          git_status = {
            mappings = {
              n = {
                ['<C-d>'] = function(prompt_bufnr)
                  local entry = action_state.get_selected_entry()
                  actions.close(prompt_bufnr)
                  vim.cmd('DiffviewOpen -- ' .. entry.value)
                end,
                ['<C-r>'] = function(prompt_bufnr)
                  local entry = action_state.get_selected_entry()
                  if not entry then
                    print('No file selected')
                    return
                  end

                  local file = entry.path or entry.value
                  local status = entry.status

                  -- Confirm before reverting
                  local action_text = status == '??' and 'Delete' or 'Revert'
                  local choice = vim.fn.confirm(action_text .. ' ' .. file .. '?', '&Yes\n&No', 2)
                  if choice ~= 1 then
                    return
                  end

                  actions.close(prompt_bufnr)

                  local git_root = vim.fn.systemlist('git rev-parse --show-toplevel')[1]
                  local cmd, result

                  -- Handle different git statuses
                  if status == '??' then
                    -- Untracked file - delete it
                    cmd = string.format('cd %s && rm -rf %s 2>&1',
                      vim.fn.shellescape(git_root),
                      vim.fn.shellescape(file))
                  else
                    -- Modified/staged file - restore it
                    cmd = string.format('cd %s && git restore --staged %s && git restore %s 2>&1',
                      vim.fn.shellescape(git_root),
                      vim.fn.shellescape(file),
                      vim.fn.shellescape(file))
                  end

                  result = vim.fn.system(cmd)

                  if vim.v.shell_error ~= 0 then
                    print('Failed: ' .. result)
                  else
                    print((status == '??' and 'Deleted: ' or 'Reverted: ') .. file)
                  end

                  -- Reopen git_status
                  vim.defer_fn(function()
                    require('telescope.builtin').git_status()
                  end, 100)
                end,
              },
              i = {
                ['<C-d>'] = function(prompt_bufnr)
                  local entry = action_state.get_selected_entry()
                  actions.close(prompt_bufnr)
                  vim.cmd('DiffviewOpen -- ' .. entry.value)
                end,
                ['<C-r>'] = function(prompt_bufnr)
                  local entry = action_state.get_selected_entry()
                  if not entry then
                    print('No file selected')
                    return
                  end

                  local file = entry.path or entry.value
                  local status = entry.status

                  -- Confirm before reverting
                  local action_text = status == '??' and 'Delete' or 'Revert'
                  local choice = vim.fn.confirm(action_text .. ' ' .. file .. '?', '&Yes\n&No', 2)
                  if choice ~= 1 then
                    return
                  end

                  actions.close(prompt_bufnr)

                  local git_root = vim.fn.systemlist('git rev-parse --show-toplevel')[1]
                  local cmd, result

                  -- Handle different git statuses
                  if status == '??' then
                    -- Untracked file - delete it
                    cmd = string.format('cd %s && rm -rf %s 2>&1',
                      vim.fn.shellescape(git_root),
                      vim.fn.shellescape(file))
                  else
                    -- Modified/staged file - restore it
                    cmd = string.format('cd %s && git restore --staged %s && git restore %s 2>&1',
                      vim.fn.shellescape(git_root),
                      vim.fn.shellescape(file),
                      vim.fn.shellescape(file))
                  end

                  result = vim.fn.system(cmd)

                  if vim.v.shell_error ~= 0 then
                    print('Failed: ' .. result)
                  else
                    print((status == '??' and 'Deleted: ' or 'Reverted: ') .. file)
                  end

                  -- Reopen git_status
                  vim.defer_fn(function()
                    require('telescope.builtin').git_status()
                  end, 100)
                end,
              },
            },
          },
        },
      })
    end,
    keys = {
      {
        '<leader>ff',
        function()
          local cached_pickers = require('telescope.state').get_global_key('cached_pickers') or {}
          local last_picker = cached_pickers[1]

          -- Only resume if last picker was Find Files or Git Files
          if last_picker and (last_picker.prompt_title == 'Find Files' or last_picker.prompt_title == 'Git Files') then
            require('telescope.builtin').resume()
          else
            local builtin = require('telescope.builtin')
            local ok = pcall(builtin.git_files, { show_untracked = true })
            if not ok then
              builtin.find_files({ hidden = true })
            end
          end
        end,
        desc = 'Find files (git or all)'
      },
      {
        '<leader>fs',
        function()
          local cached_pickers = require('telescope.state').get_global_key('cached_pickers') or {}
          local last_picker = cached_pickers[1]

          -- Only resume if last picker was Live Grep
          if last_picker and last_picker.prompt_title == 'Live Grep' then
            require('telescope.builtin').resume()
          else
            require('telescope.builtin').live_grep()
          end
        end,
        desc = 'Live grep'
      },
      {
        '<leader>fn',
        function()
          require('telescope.builtin').live_grep({
            search_dirs = { "node_modules" },
            additional_args = function()
              return { "--hidden" }
            end
          })
        end,
        desc = 'Grep in node_modules'
      },
      { '<leader>fb', '<cmd>Telescope buffers<cr>', desc = 'Buffers' },
      { '<leader>fh', '<cmd>Telescope help_tags<cr>', desc = 'Help tags' },
      {
        '<leader>fr',
        function()
          local git_root = vim.fn.systemlist('git rev-parse --show-toplevel')[1]
          if vim.v.shell_error == 0 then
            require('telescope.builtin').oldfiles({ cwd = git_root })
          else
            require('telescope.builtin').oldfiles({ cwd_only = true })
          end
        end,
        desc = 'Recent files (repo)'
      },
      { '<leader>fR', '<cmd>Telescope oldfiles<cr>', desc = 'Recent files (all)' },
      {
        '<leader>fF',
        function()
          require('telescope.builtin').find_files({ hidden = true, no_ignore = true })
        end,
        desc = 'Find files (including gitignored)'
      },
      -- Git pickers
      {
        '<leader>fg',
        function()
          local cached_pickers = require('telescope.state').get_global_key('cached_pickers') or {}
          local last_picker = cached_pickers[1]

          -- Only resume if last picker was Git Status
          if last_picker and last_picker.prompt_title == 'Git Status' then
            require('telescope.builtin').resume()
          else
            require('telescope.builtin').git_status()
          end
        end,
        desc = 'Git status'
      },
      { '<leader>fG', '<cmd>Telescope git_status<cr>', desc = 'Git commits (no resume)' },
      { '<leader>fc', '<cmd>Telescope git_commits<cr>', desc = 'Git commits' },
      { '<leader>fB', '<cmd>Telescope git_branches<cr>', desc = 'Git branches' },
    },
  },

  -- Markdown rendering
  {
    'MeanderingProgrammer/render-markdown.nvim',
    dependencies = { 'nvim-treesitter/nvim-treesitter', 'nvim-tree/nvim-web-devicons' },
    ft = { 'markdown' },
    opts = {},
  },

  -- nvim-surround - easily change/add/delete surrounding pairs
  {
    'kylechui/nvim-surround',
    version = '*',
    event = 'VeryLazy',
    config = function()
      require('nvim-surround').setup()
    end,
  },

  -- ba-tools.nvim - Personal tools and utilities
  {
    'ba-tools.nvim',
    dir = '~/code2/ba-tools.nvim',
    keys = {
      { '<leader>th', function() require('ba-tools').hello() end, desc = 'Tools: Hello' },
      { '<leader>ti', function() require('ba-tools').file_info() end, desc = 'Tools: File Info' },
      { '<leader>tg', function() require('ba-tools').git_menu() end, desc = 'Tools: Git Menu' },
    },
    config = function()
      require('ba-tools').setup()
    end,
  },
}, {
  -- Lazy.nvim options
  checker = { enabled = true }, -- automatically check for plugin updates
})
