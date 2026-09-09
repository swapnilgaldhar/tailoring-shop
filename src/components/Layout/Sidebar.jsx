import {
  Drawer,
  Toolbar,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography
} from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import StraightenIcon from "@mui/icons-material/Straighten"; //measurements icon
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import InventoryIcon from "@mui/icons-material/Inventory";
import AssessmentIcon from "@mui/icons-material/Assessment";
import BadgeIcon from "@mui/icons-material/Badge";
import SettingsIcon from "@mui/icons-material/Settings";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";

import { Link } from "react-router-dom";

const drawerWidth = 240;

const menuItems = [
  {
    text: "Dashboard",
    icon: <HomeIcon />,
    path: "/"
  },
  {
    text: "Customers",
    icon: <PeopleIcon />,
    path: "/customers"
  },
  {
    text: "Measurements",
    icon: <StraightenIcon />,
    path: "/measurements"
  },
  {
    text: "Purchase Order",
    icon: <ShoppingCartIcon />,
    path: "/orders"
  },
  {
    text: "Billing",
    icon: <ReceiptLongIcon />,
    path: "/billing"
  },
  {
    text: "Inventory",
    icon: <InventoryIcon />,
    path: "/inventory"
  },
  {
    text: "Reports",
    icon: <AssessmentIcon />,
    path: "/reports"
  },
  {
    text: "Employees",
    icon: <BadgeIcon />,
    path: "/employees"
  },
  {
    text: "Settings",
    icon: <SettingsIcon />,
    path: "/settings"
  }
];

const Sidebar = () => {

  return (

    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box"
        }
      }}
    >

      {/* Branding Header */}
      <Box
        sx={{
          background: "#980170", /* 980170*/
          color: "white",
          padding: "15px 10px",
          textAlign: "center",
          borderBottom: "1px solid #980170"
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, marginBottom: 1 }}>
          <LocalShippingIcon sx={{ fontSize: "28px" }} />
          <Typography
            variant="h6"
            sx={{ 
              fontWeight: "bold",
              fontSize: "16px"
            }}
          > 
            Tailoring Shop
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{ 
            opacity: 0.9,
            fontSize: "12px"
          }}
        >
          Owner: Mr. Rajendra Galdhar
        </Typography>
      </Box>

      <List>

        {menuItems.map((item) => (

          <ListItemButton
            key={item.text}
            component={Link}
            to={item.path}
            
          >

            <ListItemIcon>
              {item.icon}
            </ListItemIcon>

            <ListItemText
              primary={item.text}
            />

          </ListItemButton>

        ))}

      </List>

    </Drawer>

  );

};

export default Sidebar;