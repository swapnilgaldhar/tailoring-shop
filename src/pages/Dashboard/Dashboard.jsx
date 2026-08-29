
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Typography,
  Avatar,
  TextField,
  Stack,
} from "@mui/material";

import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ContentCutOutlinedIcon from "@mui/icons-material/ContentCutOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import AddIcon from "@mui/icons-material/Add";
import { getCustomerCount, getCustomersWithDeliveryDate } from "../../services/api";
import { getTodaysDelivery, updateDeliveryStatus } from "../../services/billingApi";
import dashboardBackground from "../../assets/images/Dashboard baground.jpg";

const toNumber = (value) => { const n = Number(value); return Number.isFinite(n) ? n : 0; };
const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  return ["data", "content", "items", "results", "list", "customers", "bills"]
    .map((key) => payload[key]).find(Array.isArray) || [];
};

const toISODate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const resolveDeliveryStatus = (customer) => {
  const backendStatus = typeof customer.deliveryStatus === "string"
    ? customer.deliveryStatus.trim()
    : customer.deliveryStatus;

  return backendStatus || "";
};

const normalizeDeliveryCustomer = (bill = {}) => ({
  id: bill.id ?? bill.billId ?? bill.invoiceId ?? bill.orderId ?? bill.billNumber ?? bill.customerId ?? `${bill.customerName ?? bill.custName ?? "customer"}-${bill.dueDate ?? bill.deliveryDate ?? bill.deliveryAt ?? "date"}`,
  customerName: bill.customerName ?? bill.custName ?? bill.customer?.name ?? "Customer",
  mobileNumber: bill.mobileNumber ?? bill.customerMobile ?? bill.mobile ?? bill.customer?.mobileNumber ?? bill.customer?.mobile ?? "-",
  address: bill.address ?? bill.customerAddress ?? bill.customer?.address ?? "-",
  billNumber: bill.billNumber ?? bill.billNo ?? bill.billnumber ?? bill.bill_number ?? bill.invoiceNumber ?? "-",
  deliveryStatus: bill.deliveryStatus ?? bill.delivery?.status ?? bill.status ?? "",
  balance: toNumber(
    bill.balance
      ?? bill.balanceAmount
      ?? bill.customerBalance
      ?? bill.pendingAmount
      ?? bill.dueAmount
      ?? bill.outstandingBalance
      ?? bill.customer?.balance
  ),
  deliveryDate: bill.dueDate ?? bill.deliveryDate ?? bill.deliveryAt ?? bill.delivery?.date,
});

const Dashboard = () => {
  const [todayCustomerCount, setTodayCustomerCount] = useState(0);
  const [todayDelivery, setTodayDelivery] = useState(0);
  const [deliveryCustomers, setDeliveryCustomers] = useState([]);
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState(toISODate(new Date()));
  const [statusCustomer, setStatusCustomer] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("Pending");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  const filteredCustomers = useMemo(
    () => deliveryCustomers.filter((customer) => toISODate(customer.deliveryDate) === selectedDeliveryDate),
    [deliveryCustomers, selectedDeliveryDate]
  );

  const handleOpenStatusDialog = (customer) => {
    setStatusCustomer(customer);
    setSelectedStatus(resolveDeliveryStatus(customer) || "Pending");
    setStatusError("");
  };

  const handleCloseStatusDialog = () => {
    if (!updatingStatus) setStatusCustomer(null);
  };

  const handleUpdateStatus = async () => {
    const billNumber = statusCustomer?.billNumber;
    if (!billNumber || billNumber === "-") {
      setStatusError("Bill number is missing, so the delivery status cannot be updated.");
      return;
    }

    setUpdatingStatus(true);
    try {
      await updateDeliveryStatus(billNumber, selectedStatus);

      try {
        const response = await getCustomersWithDeliveryDate(selectedDeliveryDate);
        const refreshedCustomers = extractList(response?.data).map(normalizeDeliveryCustomer);
        setDeliveryCustomers(refreshedCustomers);
      } catch (refreshError) {
        console.error("Unable to refresh delivery customers after status update.", refreshError);
      }

      setStatusCustomer(null);
    } catch (error) {
      console.error("Unable to update delivery status.", error);
      const serverMessage = error?.response?.data?.message;
      setStatusError(
        serverMessage ||
          `Unable to update delivery status (HTTP ${error?.response?.status || "request error"}).`,
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    const loadDashboardSummary = async () => {
      try {
        const response = await getCustomerCount();
        const count = response.data?.count ?? response.data?.data ?? response.data;
        setTodayCustomerCount(Number.isFinite(Number(count)) ? Number(count) : 0);
      } catch (error) {
        console.error("Unable to load today's customer count.", error);
      }
      try {
        const response = await getTodaysDelivery();
        setTodayDelivery(toNumber(response?.data));
      } catch (error) {
        console.error("Unable to load today's delivery count.", error);
      }

    };

    loadDashboardSummary();
  }, []);

  useEffect(() => {
    const loadDeliveryCustomers = async () => {
      if (!selectedDeliveryDate) {
        setDeliveryCustomers([]);
        return;
      }

      try {
        const response = await getCustomersWithDeliveryDate(selectedDeliveryDate);
        setDeliveryCustomers(extractList(response?.data).map(normalizeDeliveryCustomer));
      } catch (error) {
        setDeliveryCustomers([]);
        console.error("Unable to load delivery customers for the selected date.", error);
      }
    };

    loadDeliveryCustomers();
  }, [selectedDeliveryDate]);

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
      value: todayCustomerCount,
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
      value: todayDelivery,
      icon: <LocalShippingOutlinedIcon />,
      bg: "#FFF3E0",
      color: "#EF6C00",
    },
  ];

  return (
    <Box
      sx={{
        p: 3,
        minHeight: "100vh",
        backgroundImage: `url(${dashboardBackground})`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
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
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="overline" sx={{ color: "#666", letterSpacing: 1 }}>
                DELIVERY CUSTOMERS
              </Typography>
              <Typography variant="h6" sx={{ color: "#1F3A30", fontWeight: 700 }}>
                Customers for selected delivery date
              </Typography>
            </Box>

            <TextField
              size="small"
              type="date"
              value={selectedDeliveryDate}
              onChange={(event) => setSelectedDeliveryDate(event.target.value)}
              sx={{ minWidth: { xs: "100%", sm: 220 }, backgroundColor: "#fff" }}
            />
          </Stack>

          <Typography sx={{ color: "#555", mb: 1.5 }}>
            Total: {filteredCustomers.length}
          </Typography>

          <Box sx={{ border: "1px solid #E2E8F0", borderRadius: 2, overflow: "hidden" }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1.5fr 1fr", md: "1.7fr 1.3fr 1.2fr 1.3fr 1.2fr 1.2fr 1.2fr 1fr" }, backgroundColor: "#F8FAFC", px: 2, py: 1.25, fontWeight: 700, color: "#334155" }}>
              <Typography variant="body2">Customer Name</Typography>
              <Typography variant="body2">Mobile Number</Typography>
              <Typography variant="body2" sx={{ display: { xs: "none", md: "block" } }}>Bill Number</Typography>
              <Typography variant="body2" sx={{ display: { xs: "none", md: "block" } }}>Address</Typography>
              <Typography variant="body2">Balance</Typography>
              <Typography variant="body2">Delivery Date</Typography>
              <Typography variant="body2">Delivery Status</Typography>
              <Typography variant="body2" sx={{ display: { xs: "none", md: "block" } }}>Action</Typography>
            </Box>

            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer, index) => (
                <Box
                  key={`${customer.id}-${customer.billNumber}-${index}`}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1.5fr 1fr", md: "1.7fr 1.3fr 1.2fr 1.3fr 1.2fr 1.2fr 1.2fr 1fr" },
                    px: 2,
                    py: 1.15,
                    borderTop: "1px solid #EEF2F7",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#1E293B", fontWeight: 600 }}>
                    {customer.customerName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#334155" }}>
                    {customer.mobileNumber}
                  </Typography>
                  <Typography variant="body2" sx={{ display: { xs: "none", md: "block" }, color: "#334155" }}>
                    {customer.billNumber}
                  </Typography>
                  <Typography variant="body2" sx={{ display: { xs: "none", md: "block" }, color: "#334155" }}>
                    {customer.address}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#334155" }}>
                    ₹ {customer.balance}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#334155" }}>
                    {formatDate(customer.deliveryDate)}
                  </Typography>
                  {resolveDeliveryStatus(customer) && (
                    <Chip
                      size="small"
                      label={resolveDeliveryStatus(customer)}
                      color={resolveDeliveryStatus(customer) === "Delivered" ? "success" : "default"}
                      sx={{ justifySelf: "start" }}
                    />
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ display: { xs: "none", md: "inline-flex" }, justifySelf: "start" }}
                    onClick={() => handleOpenStatusDialog(customer)}
                  >
                    Update Status
                  </Button>
                </Box>
              ))
            ) : (
              <Box sx={{ px: 2, py: 2.5, borderTop: "1px solid #EEF2F7" }}>
                <Typography variant="body2" color="text.secondary">
                  No customers found for this delivery date.
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog open={Boolean(statusCustomer)} onClose={handleCloseStatusDialog} fullWidth maxWidth="xs">
        <DialogTitle>Update Delivery Status</DialogTitle>
        <DialogContent>
          <Typography>
            Update delivery status for bill {statusCustomer?.billNumber || statusCustomer?.id}.
          </Typography>
          <TextField
            select
            fullWidth
            label="Delivery Status"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            margin="normal"
          >
            <MenuItem value="Delivered">Delivered</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
          </TextField>
          {statusError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {statusError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog} disabled={updatingStatus}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUpdateStatus} disabled={updatingStatus}>
            {updatingStatus ? "Updating..." : "Update Status"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
