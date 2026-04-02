import React from 'react'
import { useTheme } from '@mui/material/styles'

/**
 * SAP Fiori icon name → Unicode code point mapping.
 * Source: @sap-theming/theming-base-content SAP-icons.json
 */
const SAP_ICONS = {
  // Navigation & Actions
  'home': '\ue070',
  'search': '\ue00d',
  'refresh': '\ue00a',
  'add': '\ue058',
  'delete': '\ue03d',
  'edit': '\ue038',
  'copy': '\ue245',
  'move': '\ue1e8',
  'download': '\ue03a',
  'upload': '\ue12e',
  'overflow': '\ue1f2',
  'navigation-right-arrow': '\ue066',
  'clear-all': '\ue28c',
  'display': '\ue1dd',

  // Objects & Content
  'folder': '\ue16b',
  'open-folder': '\ue1c9',
  'document': '\ue172',
  'database': '\ue080',
  'key': '\ue20e',
  'log': '\ue022',
  'action-settings': '\ue0a6',
  'history': '\ue02d',
  'create-folder': '\ue1cb',
  'export': '\ue15b',

  // Status & Feedback
  'accept': '\ue05b',
  'error': '\ue1ec',
  'warning': '\ue094',
  'information': '\ue202',

  // Media
  'media-play': '\ue14b',
}

const SIZE_MAP = {
  small: 16,
  medium: 20,
  large: 24,
  inherit: 'inherit',
}

/**
 * Resolves MUI-style color shorthand to a theme color value.
 * Supports: 'primary', 'secondary', 'error', 'warning', 'info', 'success', 'action',
 *           'disabled', or a direct CSS color string.
 */
function resolveColor(color, theme) {
  if (!color || color === 'inherit') return 'inherit'
  if (color === 'action') return theme.palette.action.active || theme.palette.text.secondary
  if (color === 'disabled') return theme.palette.action.disabled
  const paletteEntry = theme.palette[color]
  if (paletteEntry && paletteEntry.main) return paletteEntry.main
  return color
}

/**
 * SapIcon — renders an SAP Fiori icon from the SAP-icons font.
 *
 * @param {string} name - SAP icon name (e.g. 'folder', 'delete', 'search')
 * @param {string} [fontSize='medium'] - 'small' (16px), 'medium' (20px), 'large' (24px), or 'inherit'
 * @param {string} [color] - MUI color shorthand ('primary', 'error', 'action') or CSS color value
 */
const SapIcon = ({ name, fontSize = 'medium', color, style, ...props }) => {
  const theme = useTheme()
  const char = SAP_ICONS[name]
  if (!char) {
    console.warn(`SapIcon: unknown icon "${name}"`)
    return null
  }

  const size = SIZE_MAP[fontSize] || fontSize
  const resolvedColor = resolveColor(color, theme)

  return (
    <span
      role="img"
      aria-hidden="true"
      {...props}
      style={{
        fontFamily: 'SAP-icons',
        fontSize: typeof size === 'number' ? `${size}px` : size,
        fontStyle: 'normal',
        fontWeight: 'normal',
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: typeof size === 'number' ? `${size}px` : undefined,
        height: typeof size === 'number' ? `${size}px` : undefined,
        color: resolvedColor,
        verticalAlign: 'middle',
        ...style,
      }}
    >
      {char}
    </span>
  )
}

export { SAP_ICONS }
export default SapIcon
