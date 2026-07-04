import {
  AppBar,
  Toolbar,
  Typography,
  Box,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";

const Header = ({ handleDrawerToggle }) => {

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "#1976d2",
        width: "100%",
        zIndex: 1,
        padding: "10px 0",
      }}
    >
      <Toolbar sx={{ flexDirection: "column", alignItems: "flex-start", minHeight: "auto", gap: 1 }}>
        
        {/* Shop Logo and Name */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LocalShippingIcon sx={{ color: "white", fontSize: "28px" }} />
          <Typography
            variant="h6"
            sx={{ 
              color: "white",
              fontWeight: "bold",
              fontSize: "16px"
            }}
          >
            Tailoring Shop
          </Typography>
        </Box>

        {/* Owner Name */}
        <Typography
          variant="caption"
          sx={{ 
            color: "rgba(255,255,255,0.8)",
            fontSize: "12px",
            marginLeft: "36px"
          }}
        >
          Owner: Swapnil
        </Typography>

      </Toolbar>
    </AppBar>
  );
};

export default Header;