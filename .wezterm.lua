-- Pull in WezTerm API
local wezterm = require 'wezterm'

-- Initialize actual config
local config = {}
if wezterm.config_builder then
  config = wezterm.config_builder()
end

-- Helper function to get color scheme based on appearance
local function color_scheme_for_appearance(appearance)
  if appearance:find 'Dark' then
    return 'Tokyo Night'
  else
    return 'Tokyo Night Day'
  end
end

-- Appearance
config.font = wezterm.font 'Hack Nerd Font Mono'
config.font_size = 14.0
config.color_scheme = color_scheme_for_appearance(wezterm.gui.get_appearance())
config.window_decorations = "RESIZE"
config.hide_tab_bar_if_only_one_tab = true
config.native_macos_fullscreen_mode = true

-- Transparency
config.window_background_opacity = 0.80
config.macos_window_background_blur = 20

-- Key bindings
config.keys = {
  -- Make shift+enter send a literal newline
  {
    key = 'Enter',
    mods = 'SHIFT',
    action = wezterm.action.SendString '\n',
  },
  -- Toggle fullscreen with Ctrl+Cmd+f (creates new desktop space automatically)
  {
    key = 'f',
    mods = 'CTRL|CMD',
    action = wezterm.action.ToggleFullScreen,
  },
}

return config
