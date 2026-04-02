import { createTheme } from '@mui/material/styles'

const sapFontFamily = '"72", Arial, sans-serif'
const sapMonoFontFamily = '"72Mono", monospace'

const horizonDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4CA5FF',
      light: '#6CB9FF',
      dark: '#0070F2',
    },
    secondary: {
      main: '#8FAACC',
      light: '#B0C4DE',
      dark: '#556B82',
    },
    error: {
      main: '#FF8888',
      dark: '#AA0808',
    },
    warning: {
      main: '#FFAB45',
      dark: '#E76500',
    },
    info: {
      main: '#4CA5FF',
      dark: '#0070F2',
    },
    success: {
      main: '#41A85F',
      dark: '#256F3A',
    },
    background: {
      default: '#1D2329',
      paper: '#2B2F35',
    },
    text: {
      primary: '#F5F6F7',
      secondary: '#8FAACC',
      disabled: '#56657A',
    },
    divider: '#3F444B',
    action: {
      hover: 'rgba(76, 165, 255, 0.08)',
      selected: 'rgba(76, 165, 255, 0.16)',
      disabled: 'rgba(245, 246, 247, 0.3)',
      disabledBackground: 'rgba(245, 246, 247, 0.12)',
    },
  },
  typography: {
    fontFamily: sapFontFamily,
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.35,
    },
    h4: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.4,
    },
    body2: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.6875rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    subtitle2: {
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
    },
    overline: {
      fontSize: '0.625rem',
      fontWeight: 400,
      lineHeight: 1.6,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#23262C',
          borderRight: '1px solid #3F444B',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(76, 165, 255, 0.16)',
            '&:hover': {
              backgroundColor: 'rgba(76, 165, 255, 0.24)',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #3F444B',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#2B2F35',
          border: '1px solid #3F444B',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#2B2F35',
        },
      },
    },
  },
})

// Export mono font family for use in components
export { sapMonoFontFamily }
export default horizonDarkTheme
