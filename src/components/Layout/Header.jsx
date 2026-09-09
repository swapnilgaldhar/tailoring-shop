import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
} from "@mui/material";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";

const Header = ({ handleDrawerToggle }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authExpiry");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "#980170", /*980170   1976d2 */
        width: "100%",
        zIndex: 1,
        padding: "10px 0",
      }}
    >
      <Toolbar sx={{ flexDirection: "row", alignItems: "center", minHeight: "auto", gap: 1 }}>

        {/* Shop Logo and Name */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
          <CheckroomIcon sx={{ color: "white", fontSize: "28px" }} />
          <Box>
            <Typography
              variant="h6"
              sx={{ color: "white", fontWeight: "bold", fontSize: "16px", lineHeight: 1.2 }}
            >
              First Impression Tailoring Shop
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}
            >
              Owner: Master Rajendra Galdhar.
            </Typography>
          </Box>
        </Box>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          startIcon={<LogoutIcon />}
          sx={{
            color: "white",
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            px: 2,
            bgcolor: "rgba(253, 254, 251, 0.96)",
            "&:hover": { bgcolor: "rgba(251, 248, 248, 0.94)" },
          }}
        >
          Logout
        </Button>

      </Toolbar>
    </AppBar>
  );
};

export default Header;