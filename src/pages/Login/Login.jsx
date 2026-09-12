import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { apiUrl } from '../../services/apiConfig';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
     console.log("🔥 HANDLE LOGIN CALLED");

  e.preventDefault();

  console.log("🔥 Username:", username);
  console.log("🔥 Password entered:", password ? "YES" : "NO");
  console.log("🔥 API URL:", apiUrl('/api/auth/login'));
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(apiUrl('/api/auth/login'), {
        mobileNumber: username,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      const payload = response?.data ?? {};
      const message = String(
        payload?.message
          ?? payload?.data?.message
          ?? payload?.statusMessage
          ?? payload?.msg
          ?? ''
      );

      const isLoginSuccessful =
        message.toLowerCase().includes('login successful')
        || payload?.success === true
        || payload?.status === 'success';

      if (!isLoginSuccessful) {
        throw new Error(message || 'Login failed. Please try again.');
      }

      const token = payload?.token || payload?.data?.token || 'dummy-token';
      localStorage.setItem('authToken', token);
      localStorage.setItem('authExpiry', String(Date.now() + 15 * 60 * 1000));
      localStorage.setItem('user', JSON.stringify({ username, ...(payload?.user ?? payload?.data ?? {}) }));
      navigate('/dashboard', { replace: true });
    } catch (loginError) {
      const backendMessage = loginError?.response?.data?.message
        || loginError?.response?.data?.error
        || loginError?.message
        || 'Login failed. Please try again.';
      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left branding panel */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '45%',
          background: 'linear-gradient(145deg, #980170 0%, #a51b80 50%, #bc419b 100%)',
          color: 'white',
          px: 6,
          gap: 3,
        }}
      >
        <Box
          sx={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
          }}
        >
          <ContentCutIcon sx={{ fontSize: 48 }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center', lineHeight: 1.2 }}>
          First Impression<br />Tailoring Shop
        </Typography>
        <Typography sx={{ opacity: 0.85, textAlign: 'center', fontSize: 15, maxWidth: 300 }}>
          Manage your customers, measurements, and billing — all in one place.
        </Typography>
        <Box sx={{ mt: 2, px: 3, py: 1.5, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2 }}>
          <Typography sx={{ fontSize: 13, opacity: 0.9, textAlign: 'center' }}>
            Owner: <strong>Swapnil</strong>
          </Typography>
        </Box>
      </Box>

      {/* Right login panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: '#f4f7fb',
          px: { xs: 3, sm: 6 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, mb: 3 }}>
            <ContentCutIcon sx={{ color: '#1976d2', fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1976d2' }}>
              Tailoring Shop
            </Typography>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
            Welcome back
          </Typography>
          <Typography sx={{ color: '#64748b', mb: 3.5, fontSize: 15 }}>
            Sign in to continue to your dashboard
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              required
              fullWidth
              label="Username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ bgcolor: 'white', borderRadius: 2 }}
            />

            <TextField
              required
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ bgcolor: 'white', borderRadius: 2 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 0.5,
                py: 1.4,
                fontWeight: 700,
                fontSize: 16,
                borderRadius: 2,
                textTransform: 'none',
                background: 'linear-gradient(90deg, #980170 0%, #980170 100%)',
                boxShadow: '0 4px 14px rgba(25,118,210,0.35)',
                '&:hover': { background: 'linear-gradient(90deg, #0d47a1 0%, #1565c0 100%)' },
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </Box>

          <Typography sx={{ mt: 4, color: '#94a3b8', fontSize: 12, textAlign: 'center' }}>
            Session expires after 15 minutes of inactivity.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
 
