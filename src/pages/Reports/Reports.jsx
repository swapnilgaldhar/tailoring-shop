import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Stack, TextField, Typography,
} from '@mui/material';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import WalletOutlinedIcon from '@mui/icons-material/WalletOutlined';
import dayjs from 'dayjs';
import { getCustomerCount, getCustomers } from '../../services/api';
import { getBills, getCustomersWithBalanceCount, getDeliveryByDate, getMonthlySales, getTodaysCollection, getTodaysDelivery, getTodaysSales } from '../../services/billingApi';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  return ['data', 'content', 'items', 'results', 'list', 'customers', 'bills']
    .map((key) => payload[key]).find(Array.isArray) || [];
};

const readReportCount = (value) => {
  if (value === null || value === undefined || value === '') return 0;

  if (Array.isArray(value)) return value.length || 0;

  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (typeof value === 'object') {
    const candidates = [
      value.count,
      value.total,
      value.totalCount,
      value.value,
      value.data,
      value.amount,
      value.result,
      value.records,
      value.todaysDelivery,
      value.deliveryCount,
      value.deliveries,
      value.items,
      value.list,
      value.payload,
      value.reportCount,
      value.data?.count,
      value.data?.total,
      value.data?.totalCount,
      value.data?.value,
    ];

    for (const candidate of candidates) {
      const parsed = readReportCount(candidate);
      if (parsed !== 0 || candidate === 0 || candidate === '0') {
        return parsed;
      }
    }

    const nested = Object.values(value).find((entry) => entry !== null && entry !== undefined && entry !== '');
    if (nested !== undefined) return readReportCount(nested);

    return 0;
  }

  return 0;
};

const toNumber = (value) => readReportCount(value);

const toDate = (value) => {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};

const onDate = (value, date) => toDate(value)?.isSame(date, 'day') ?? false;

const normalizeCustomer = (customer = {}) => ({
  id: customer.id ?? customer.customerId ?? customer.custId ?? '',
  name: customer.name ?? customer.customerName ?? customer.custName ?? 'Customer',
  balance: toNumber(customer.balance ?? customer.custBalance ?? customer.accountBalance ?? customer.outstandingBalance),
  createdAt: customer.createdAt ?? customer.createdDate ?? customer.createdOn ?? customer.dateCreated,
});

const normalizeBill = (bill = {}) => ({
  id: bill.id ?? bill.billId ?? bill.invoiceId ?? bill.orderId ?? '-',
  customerName: bill.customerName ?? bill.custName ?? bill.customer?.name ?? 'Walk-in customer',
  billDate: bill.billDate ?? bill.date ?? bill.createdAt ?? bill.createdDate,
  dueDate: bill.dueDate ?? bill.deliveryDate ?? bill.deliveryAt,
  amount: toNumber(bill.totalAmount ?? bill.grandTotal ?? bill.total ?? bill.netAmount ?? bill.amount),
  paymentStatus: String(bill.paymentStatus ?? bill.status ?? 'Pending'),
  orderStatus: String(bill.orderStatus ?? bill.deliveryStatus ?? bill.status ?? ''),
});

const percentageChange = (current, previous) => {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

const statusInfo = (status) => {
  const value = status.toLowerCase();
  if (value.includes('deliver')) return { label: 'Delivered', color: '#16a34a', background: '#dcfce7' };
  if (value.includes('stitch') || value.includes('manufactur')) return { label: 'Stitching', color: '#d97706', background: '#fef3c7' };
  if (value.includes('progress') || value.includes('process')) return { label: 'In Progress', color: '#2563eb', background: '#dbeafe' };
  return { label: 'Pending', color: '#dc2626', background: '#fee2e2' };
};

const MetricCard = ({ title, value, caption, icon, accent, background, change }) => (
  <Card elevation={0} sx={{ border: '1px solid #e7edf5', borderRadius: 2, minHeight: { xs: 118, md: 128 }, boxShadow: '0 4px 14px rgba(15, 23, 42, 0.035)' }}>
    <CardContent sx={{ p: { xs: 1.75, md: 2 }, '&:last-child': { pb: { xs: 1.75, md: 2 } } }}>
      <Stack direction="row" spacing={{ xs: 1.5, md: 2 }} alignItems="flex-start">
        <Box sx={{ width: { xs: 42, md: 52 }, height: { xs: 42, md: 52 }, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: background, color: accent, flexShrink: 0, '& svg': { fontSize: { xs: 22, md: 28 } } }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: '#475569', fontSize: { xs: 13, md: 15 }, fontWeight: 700, lineHeight: 1.25 }}>{title}</Typography>
          <Typography sx={{ color: '#172033', fontWeight: 800, fontSize: { xs: 26, md: 34 }, mt: 0.5, lineHeight: 1.1 }}>{value}</Typography>
          {change !== undefined ? <Typography sx={{ color: change >= 0 ? '#16a34a' : '#dc2626', fontSize: { xs: 12, md: 14 }, fontWeight: 700, mt: 0.9 }}>{change >= 0 ? '+' : ''}{change}%</Typography> : null}
          <Typography sx={{ color: '#64748b', fontSize: { xs: 12, md: 14 }, mt: 0.25, lineHeight: 1.2 }}>{caption}</Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const Reports = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [deliveryCheckDate, setDeliveryCheckDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [customers, setCustomers] = useState([]);
  const [todayCustomerCount, setTodayCustomerCount] = useState(0);
  const [bills, setBills] = useState([]);
  const [todaySales, setTodaySales] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  const [todayDelivery, setTodayDelivery] = useState(0);
  const [todayCollection, setTodayCollection] = useState(0);
  const [customersWithBalanceCount, setCustomersWithBalanceCount] = useState(0);
  const [selectedDateDeliveryCount, setSelectedDateDeliveryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reportDate = dayjs(selectedDate);

  useEffect(() => {
    let active = true;
    const loadReportData = async () => {
      setLoading(true);
      const [customerResult, customerCountResult, billResult, todaySalesResult, monthlySalesResult, todayDeliveryResult, todayCollectionResult, customersWithBalanceResult] = await Promise.allSettled([
        getCustomers(),
        getCustomerCount(),
        getBills(),
        getTodaysSales(),
        getMonthlySales(),
        getTodaysDelivery(),
        getTodaysCollection(),
        getCustomersWithBalanceCount(),
      ]);
      if (!active) return;
      if (customerResult.status === 'fulfilled') setCustomers(extractList(customerResult.value?.data).map(normalizeCustomer));
      if (customerCountResult.status === 'fulfilled') {
        const count = customerCountResult.value?.data?.count ?? customerCountResult.value?.data?.data ?? customerCountResult.value?.data;
        setTodayCustomerCount(Number.isFinite(Number(count)) ? Number(count) : 0);
      }
      if (billResult.status === 'fulfilled') setBills(extractList(billResult.value?.data).map(normalizeBill));
      if (todaySalesResult.status === 'fulfilled') setTodaySales(readReportCount(todaySalesResult.value?.data));
      if (monthlySalesResult.status === 'fulfilled') setMonthlySales(readReportCount(monthlySalesResult.value?.data));
      if (todayDeliveryResult.status === 'fulfilled') setTodayDelivery(readReportCount(todayDeliveryResult.value?.data));
      if (todayCollectionResult.status === 'fulfilled') setTodayCollection(readReportCount(todayCollectionResult.value?.data));
      if (customersWithBalanceResult.status === 'fulfilled') setCustomersWithBalanceCount(readReportCount(customersWithBalanceResult.value?.data));
      if (customerResult.status === 'rejected' && customerCountResult.status === 'rejected' && billResult.status === 'rejected' && todaySalesResult.status === 'rejected' && monthlySalesResult.status === 'rejected' && todayDeliveryResult.status === 'rejected' && todayCollectionResult.status === 'rejected' && customersWithBalanceResult.status === 'rejected') setError('Unable to load report data. Check that the customer and billing APIs are running.');
      setLoading(false);
    };
    loadReportData();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    const loadSelectedDateDelivery = async () => {
      try {
        const result = await getDeliveryByDate(deliveryCheckDate);
        if (!active) return;
        const count = readReportCount(result?.data);
        setSelectedDateDeliveryCount(count);
      } catch {
        if (!active) return;
        setSelectedDateDeliveryCount(0);
      }
    };

    loadSelectedDateDelivery();

    return () => {
      active = false;
    };
  }, [deliveryCheckDate]);

  const report = useMemo(() => {
    const sum = (list) => list.reduce((total, item) => total + item.amount, 0);
    const todayBills = bills.filter((bill) => onDate(bill.billDate, reportDate));
    const monthBills = bills.filter((bill) => toDate(bill.billDate)?.isSame(reportDate, 'month'));
    const pendingBills = bills.filter((bill) => statusInfo(bill.orderStatus).label === 'Pending');
    return {
      todayBills,
      todaySales: sum(todayBills),
      monthOrders: monthBills.length,
      pendingBills,
    };
  }, [bills, reportDate]);

  const handleExport = () => {
    const rows = [
      ['Report Date', reportDate.format('DD MMM YYYY')], ['Today Sales', report.todaySales], ['Today Collection', report.todayCollection], ['New Customers', report.todayCustomers], [],
      ['Bill ID', 'Customer', 'Bill Date', 'Due Date', 'Amount', 'Payment Status'],
      ...report.todayBills.map((bill) => [bill.id, bill.customerName, bill.billDate || '', bill.dueDate || '', bill.amount, bill.paymentStatus]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `tailoring-report-${selectedDate}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const metrics = [
    { title: "Today's Total Sale", value: currency.format(todaySales), caption: 'today', icon: <AttachMoneyOutlinedIcon fontSize="small" />, accent: '#16a34a', background: '#dcfce7' },
    { title: 'New Customers', value: todayCustomerCount, caption: 'today', icon: <GroupsOutlinedIcon fontSize="small" />, accent: '#2563eb', background: '#dbeafe' },
    { title: "Today's Collection", value: currency.format(todayCollection), caption: 'today', icon: <WalletOutlinedIcon fontSize="small" />, accent: '#d97706', background: '#ffedd5' },
    { title: "Today's Delivery", value: todayDelivery, caption: 'today', icon: <LocalShippingOutlinedIcon fontSize="small" />, accent: '#9333ea', background: '#f3e8ff' },
    { title: 'Delivery On Selected Date', value: selectedDateDeliveryCount, caption: dayjs(deliveryCheckDate).format('DD MMM YYYY'), icon: <CalendarMonthOutlinedIcon fontSize="small" />, accent: '#0f766e', background: '#ccfbf1' },
    { title: 'Monthly Sales', value: currency.format(monthlySales), caption: 'this month', icon: <ReceiptLongOutlinedIcon fontSize="small" />, accent: '#e11d48', background: '#ffe4e6' },
    { title: 'Month Orders', value: report.monthOrders, caption: 'bills created this month', icon: <Inventory2OutlinedIcon fontSize="small" />, accent: '#0891b2', background: '#cffafe' },
    { title: 'Pending Orders', value: report.pendingBills.length, caption: 'requires attention', icon: <PendingActionsOutlinedIcon fontSize="small" />, accent: '#d97706', background: '#fef3c7' },
    { title: 'Customers with Balance', value: customersWithBalanceCount, caption: 'customers with outstanding balance', icon: <TrendingUpOutlinedIcon fontSize="small" />, accent: '#ef4444', background: '#fee2e2' },
  ];

  return (
    <Box sx={{ minHeight: 'calc(100vh - 40px)', color: '#172033', display: 'flex', flexDirection: 'column' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 2.5 }}>
        <Stack direction="row" spacing={1.1} alignItems="baseline"><Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: 0, fontSize: { xs: 28, md: 30 } }}>Reports</Typography><Typography sx={{ color: '#64748b', fontSize: 12 }}>Overview &amp; Analytics</Typography></Stack>
        <Stack direction="row" spacing={1.25} sx={{ width: { xs: '100%', md: 'auto' } }}>
          <Button component="label" variant="outlined" startIcon={<CalendarMonthOutlinedIcon />} sx={{ borderColor: '#d5dde9', color: '#334155', textTransform: 'none', bgcolor: 'white', flex: { xs: 1, md: 'initial' } }}>{reportDate.format('DD MMM, YYYY')}<input hidden type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></Button>
          <Button variant="contained" startIcon={<DownloadOutlinedIcon />} onClick={handleExport} sx={{ textTransform: 'none', bgcolor: '#1266d8', boxShadow: 'none', '&:hover': { bgcolor: '#0e55b4' } }}>Export</Button>
        </Stack>
      </Stack>
      <Card elevation={0} sx={{ border: '1px solid #e7edf5', borderRadius: 2, p: 2, mb: 2.5, bgcolor: '#f8fafc' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Typography sx={{ color: '#334155', fontWeight: 700, minWidth: { sm: 210 } }}>
            Check Deliveries By Date
          </Typography>
          <TextField
            size="small"
            type="date"
            value={deliveryCheckDate}
            onChange={(event) => setDeliveryCheckDate(event.target.value)}
            inputProps={{ max: dayjs().format('YYYY-MM-DD') }}
            sx={{ width: { xs: '100%', sm: 220 }, bgcolor: 'white' }}
          />
        </Stack>
      </Card>
      {error ? <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert> : null}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 3 }}>
        {metrics.map((metric) => <MetricCard key={metric.title} {...metric} />)}
      </Box>
    </Box>
  );
};

export default Reports;
