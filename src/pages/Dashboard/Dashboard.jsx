

import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Avatar,
} from "@mui/material";

import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ContentCutOutlinedIcon from "@mui/icons-material/ContentCutOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import AddIcon from "@mui/icons-material/Add";

const Dashboard = () => {
  const cards = [
    {
      title: "Today's Sales",
      value: "₹ 12,450",
      icon: <CurrencyRupeeIcon />,
      bg: "#E8F5E9",
      color: "#2E7D32",
    },
    {
      title: "Today's Customers",
      value: "18",
      icon: <PeopleAltOutlinedIcon />,
      bg: "#E3F2FD",
      color: "#1565C0",
    },
    {
      title: "Today's Manufactured",
      value: "24",
      icon: <ContentCutOutlinedIcon />,
      bg: "#F3E5F5",
      color: "#6A1B9A",
    },
    {
      title: "Today's Delivery",
      value: "15",
      icon: <LocalShippingOutlinedIcon />,
      bg: "#FFF3E0",
      color: "#EF6C00",
    },
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: "#F8F6F2", minHeight: "100vh" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="overline" sx={{ letterSpacing: 2, color: "#777" }}>
            WORKSHOP OVERVIEW
          </Typography>

          <Typography
            variant="h3"
            sx={{
              fontFamily: "Georgia",
              color: "#1F3A30",
              fontWeight: 500,
            }}
          >
            Good Day, Tailor.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            backgroundColor: "#18392B",
            px: 3,
            py: 1.3,
            borderRadius: 2,
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#10261D",
            },
          }}
        >
          New Order
        </Button>
      </Box>

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card elevation={2} sx={{ borderRadius: 3, height: 170 }}>
              <CardContent>
                <Avatar
                  sx={{
                    bgcolor: card.bg,
                    color: card.color,
                    width: 55,
                    height: 55,
                    mb: 2,
                  }}
                >
                  {card.icon}
                </Avatar>

                <Typography
                  variant="body2"
                  sx={{
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {card.title}
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    mt: 1,
                    fontWeight: 700,
                    color: "#222",
                  }}
                >
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mt: 4, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="overline" sx={{ color: "#666", letterSpacing: 1 }}>
            TAILORING CAPACITY
          </Typography>

          <Typography variant="h4" mt={1}>
            27 Items Available This Week
          </Typography>

          <Typography color="text.secondary" mt={1}>
            3 Pieces in Progress • Weekly Capacity 30
          </Typography>

          <Box
            sx={{
              mt: 3,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#D7D7D7",
            }}
          >
            <Box
              sx={{
                width: "10%",
                height: "100%",
                borderRadius: 5,
                backgroundColor: "#18392B",
              }}
            />
          </Box>

          <Typography mt={1} color="text.secondary">
            10% Utilised
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
