import React from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Box,
} from '@mui/material';
import { Layers as LayersIcon } from '@mui/icons-material';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  useHistory,
  useParams,
} from 'react-router-dom';
import SalesOrderFormMUI from './components/mui/SalesOrderFormMUI';
import SalesOrderList from './components/mui/SalesOrderList';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#8b9ff8',
      dark: '#4c5fd7',
    },
    secondary: {
      main: '#764ba2',
      light: '#9568c4',
      dark: '#5d3a82',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.5px' },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '10px 24px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': { borderRadius: 8 },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', width: '100%' }}>
          <AppBar
            position="sticky"
            elevation={2}
            sx={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
            }}
          >
            <Toolbar>
              <LayersIcon sx={{ mr: 2 }} />
              <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
                Sales Order Management
              </Typography>
            </Toolbar>
          </AppBar>

          <Switch>
            {/* List Page */}
            <Route exact path="/" component={SalesOrderList} />

            {/* Add New SO */}
            <Route exact path="/sales-order/new" component={SalesOrderFormMUI} />

            {/* Edit Existing SO */}
            <Route exact path="/sales-order/edit/:id" component={SalesOrderFormMUI} />
          </Switch>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;