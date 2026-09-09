import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BadgeIcon from '@mui/icons-material/Badge';
import EngineeringIcon from '@mui/icons-material/Engineering';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import PageTabs from '../../components/common/PageTabs';
import {
  createEmployee,
  createKaragir,
  getAllEmployee,
  getAllKaragir,
} from '../../services/employeeApi';

const rowsPerPage = 20;
const mobileNumberPattern = /^\d{10}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseJsonIfString = (payload) => {
  if (typeof payload !== 'string') return payload;

  const trimmed = payload.trim();
  if (!trimmed || (!trimmed.startsWith('[') && !trimmed.startsWith('{'))) {
    return payload;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return payload;
  }
};

const extractList = (payload) => {
  const normalizedPayload = parseJsonIfString(payload);
  if (Array.isArray(normalizedPayload)) return normalizedPayload;
  if (normalizedPayload && typeof normalizedPayload === 'object') {
    if (Array.isArray(normalizedPayload.data)) return normalizedPayload.data;
    if (Array.isArray(normalizedPayload.items)) return normalizedPayload.items;
    if (Array.isArray(normalizedPayload.content)) return normalizedPayload.content;
    if (Array.isArray(normalizedPayload.results)) return normalizedPayload.results;
    if (Array.isArray(normalizedPayload.employees)) return normalizedPayload.employees;
    if (Array.isArray(normalizedPayload.karagirs)) return normalizedPayload.karagirs;
    if (Array.isArray(normalizedPayload.list)) return normalizedPayload.list;
  }
  return [];
};

const normalizeMember = (item = {}) => ({
  ...item,
  id: item.id ?? item.employeeId ?? item.karagirId ?? item.empId ?? item.workerId ?? '',
  name: item.name ?? item.employeeName ?? item.karagirName ?? item.fullName ?? '',
  mobileNumber:
    item.mobileNumber ??
    item.empployeePhone ??
    item.karagirPhone ??
    item.employeeMobileNumber ??
    item.karagirMobileNumber ??
    item.phone ??
    item.mobile ??
    '',
  address:
    item.address ??
    item.empployeeAddress ??
    item.employeeAddress ??
    item.karagirAddress ??
    '',
  email: item.email ?? item.empployeeEmail ?? '',
  employeeType: item.employeeType ?? item.empployeeType ?? item.role ?? item.designation ?? item.type ?? '',
  speciality: item.speciality ?? item.karagirSpeciality ?? item.skill ?? item.specialization ?? '',
  salary: item.salary ?? item.wage ?? item.monthlySalary ?? '',
});

const buildEmployeePayload = (form) => ({
  employeeName: form.name.trim(),
  empployeeAddress: form.address.trim(),
  empployeeEmail: form.email.trim(),
  empployeePhone: form.mobileNumber.trim(),
  empployeeType: form.employeeType.trim(),
});

const buildKaragirPayload = (form) => ({
  karagirName: form.name.trim(),
  karagirPhone: form.mobileNumber.trim(),
  karagirAddress: form.address.trim(),
  karagirSpeciality: form.speciality.trim(),
  karagirEmail: form.email.trim(),
});

const initialEmployeeForm = {
  name: '',
  mobileNumber: '',
  address: '',
  email: '',
  employeeType: '',
};

const initialKaragirForm = {
  name: '',
  mobileNumber: '',
  address: '',
  speciality: '',
  email: '',
};

const Employees = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [employeeForm, setEmployeeForm] = useState(initialEmployeeForm);
  const [karagirForm, setKaragirForm] = useState(initialKaragirForm);
  const [employeeList, setEmployeeList] = useState([]);
  const [karagirList, setKaragirList] = useState([]);
  const [employeeIdSearch, setEmployeeIdSearch] = useState('');
  const [karagirIdSearch, setKaragirIdSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedKaragir, setSelectedKaragir] = useState(null);
  const [employeePage, setEmployeePage] = useState(1);
  const [karagirPage, setKaragirPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const pagedEmployees = useMemo(
    () => employeeList.slice((employeePage - 1) * rowsPerPage, employeePage * rowsPerPage),
    [employeeList, employeePage],
  );

  const pagedKaragirs = useMemo(
    () => karagirList.slice((karagirPage - 1) * rowsPerPage, karagirPage * rowsPerPage),
    [karagirList, karagirPage],
  );

  const totalEmployeePages = Math.max(1, Math.ceil(employeeList.length / rowsPerPage));
  const totalKaragirPages = Math.max(1, Math.ceil(karagirList.length / rowsPerPage));

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await getAllEmployee();
      const list = extractList(response?.data).map(normalizeMember);
      setEmployeeList(list);
      setFeedback({ type: 'success', message: `Loaded ${list.length} employee records.` });
      setEmployeePage(1);
      return list;
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error?.response?.data?.message || 'Unable to load employee list.',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadKaragirs = async () => {
    setLoading(true);
    try {
      const response = await getAllKaragir();
      const list = extractList(response?.data).map(normalizeMember);
      setKaragirList(list);
      setFeedback({ type: 'success', message: `Loaded ${list.length} karagir records.` });
      setKaragirPage(1);
      return list;
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error?.response?.data?.message || 'Unable to load karagir list.',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (event) => {
    event.preventDefault();
    if (!employeeForm.name.trim() || !employeeForm.mobileNumber.trim()) {
      setFeedback({ type: 'error', message: 'Employee name and mobile number are required.' });
      return;
    }
    if (!mobileNumberPattern.test(employeeForm.mobileNumber.trim())) {
      setFeedback({ type: 'error', message: 'Employee mobile number must contain exactly 10 digits.' });
      return;
    }
    if (employeeForm.email.trim() && !emailPattern.test(employeeForm.email.trim())) {
      setFeedback({ type: 'error', message: 'Enter a valid employee email address.' });
      return;
    }

    setLoading(true);
    try {
      await createEmployee(buildEmployeePayload(employeeForm));
      setFeedback({ type: 'success', message: 'Employee created successfully.' });
      setEmployeeForm(initialEmployeeForm);
      await loadEmployees();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error?.response?.data?.message || 'Unable to create employee.',
      });
      setLoading(false);
    }
  };

  const handleCreateKaragir = async (event) => {
    event.preventDefault();
    if (!karagirForm.name.trim() || !karagirForm.mobileNumber.trim()) {
      setFeedback({ type: 'error', message: 'Karagir name and mobile number are required.' });
      return;
    }
    if (!mobileNumberPattern.test(karagirForm.mobileNumber.trim())) {
      setFeedback({ type: 'error', message: 'Karagir mobile number must contain exactly 10 digits.' });
      return;
    }
    if (karagirForm.email.trim() && !emailPattern.test(karagirForm.email.trim())) {
      setFeedback({ type: 'error', message: 'Enter a valid karagir email address.' });
      return;
    }

    setLoading(true);
    try {
      await createKaragir(buildKaragirPayload(karagirForm));
      setFeedback({ type: 'success', message: 'Karagir created successfully.' });
      setKaragirForm(initialKaragirForm);
      await loadKaragirs();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error?.response?.data?.message || 'Unable to create karagir.',
      });
      setLoading(false);
    }
  };

  const handleFindEmployeeById = async () => {
    const targetId = employeeIdSearch.trim();
    if (!targetId) {
      setFeedback({ type: 'error', message: 'Enter employee ID first.' });
      return;
    }

    const listForSearch = employeeList.length === 0 ? await loadEmployees() : employeeList;

    const found = (listForSearch || []).find(
      (item) => String(item.id) === targetId,
    );

    if (!found) {
      setSelectedEmployee(null);
      setFeedback({ type: 'info', message: 'Employee ID not found in current list.' });
      return;
    }

    setSelectedEmployee(found);
    setFeedback({ type: 'success', message: 'Employee found by ID.' });
  };

  const handleFindKaragirById = async () => {
    const targetId = karagirIdSearch.trim();
    if (!targetId) {
      setFeedback({ type: 'error', message: 'Enter karagir ID first.' });
      return;
    }

    const listForSearch = karagirList.length === 0 ? await loadKaragirs() : karagirList;

    const found = (listForSearch || []).find(
      (item) => String(item.id) === targetId,
    );

    if (!found) {
      setSelectedKaragir(null);
      setFeedback({ type: 'info', message: 'Karagir ID not found in current list.' });
      return;
    }

    setSelectedKaragir(found);
    setFeedback({ type: 'success', message: 'Karagir found by ID.' });
  };

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3, width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(120deg, #eff6ff 0%, #f0fdf4 100%)',
          border: '1px solid #dbeafe',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Team Management
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', mt: 0.5 }}>
              Create and manage employee and karagir records with clean, fast lookup.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={activeTab === 0 ? loadEmployees : loadKaragirs} disabled={loading}>
              {loading ? 'Loading...' : activeTab === 0 ? 'Refresh Employee List' : 'Refresh Karagir List'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Stack sx={{ mb: 2 }}>
        <PageTabs
          value={activeTab}
          onChange={async (_, value) => {
            setActiveTab(value);
            setFeedback(null);

            if (value === 0 && employeeList.length === 0) {
              await loadEmployees();
            }

            if (value === 1 && karagirList.length === 0) {
              await loadKaragirs();
            }
          }}
          tabs={[
            { label: 'Employee' },
            { label: 'Karagir' },
          ]}
        />
      </Stack>

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 2.5 }}>
          {feedback.message}
        </Alert>
      )}

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={4}>
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardContent>
                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.5 }}>
                  <BadgeIcon sx={{ color: '#2563eb' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Create Employee
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Add a new employee profile.
                </Typography>

                <Box component="form" onSubmit={handleCreateEmployee}>
                  <Stack spacing={1.5}>
                    <TextField
                      label="Employee Name"
                      value={employeeForm.name}
                      onChange={(event) => setEmployeeForm((prev) => ({ ...prev, name: event.target.value }))}
                      required
                      fullWidth
                    />
                    <TextField
                      label="Mobile Number"
                      value={employeeForm.mobileNumber}
                      onChange={(event) => setEmployeeForm((prev) => ({
                        ...prev,
                        mobileNumber: event.target.value.replace(/\D/g, '').slice(0, 10),
                      }))}
                      type="tel"
                      inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                      required
                      fullWidth
                    />
                    <TextField
                      label="Address"
                      value={employeeForm.address}
                      onChange={(event) => setEmployeeForm((prev) => ({ ...prev, address: event.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label="Employee Email"
                      value={employeeForm.email}
                      onChange={(event) => setEmployeeForm((prev) => ({ ...prev, email: event.target.value }))}
                      type="email"
                      fullWidth
                    />
                    <TextField
                      label="Employee Type"
                      value={employeeForm.employeeType}
                      onChange={(event) => setEmployeeForm((prev) => ({ ...prev, employeeType: event.target.value }))}
                      fullWidth
                    />
                    <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={loading}>
                      Create Employee
                    </Button>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={8}>
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Employee List</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      size="small"
                      label="Employee ID"
                      value={employeeIdSearch}
                      onChange={(event) => setEmployeeIdSearch(event.target.value)}
                    />
                    <Button variant="outlined" startIcon={<SearchIcon />} onClick={handleFindEmployeeById}>
                      Find by ID
                    </Button>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadEmployees} disabled={loading}>
                      Load All
                    </Button>
                  </Stack>
                </Stack>

                {selectedEmployee && (
                  <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Selected Employee
                    </Typography>
                    <Typography variant="body2">ID: {selectedEmployee.id || '-'}</Typography>
                    <Typography variant="body2">Name: {selectedEmployee.name || '-'}</Typography>
                    <Typography variant="body2">Mobile: {selectedEmployee.mobileNumber || '-'}</Typography>
                    <Typography variant="body2">Email: {selectedEmployee.email || '-'}</Typography>
                    <Typography variant="body2">Type: {selectedEmployee.employeeType || '-'}</Typography>
                  </Paper>
                )}

                <Divider sx={{ mb: 1.5 }} />

                {employeeList.length === 0 ? (
                  <Typography color="text.secondary">No employee records loaded. Click Load All.</Typography>
                ) : (
                  <>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Mobile</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Type</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pagedEmployees.map((item) => (
                          <TableRow key={`${item.id}-${item.name}`} hover>
                            <TableCell>{item.id || '-'}</TableCell>
                            <TableCell>{item.name || '-'}</TableCell>
                            <TableCell>{item.mobileNumber || '-'}</TableCell>
                            <TableCell>{item.email || '-'}</TableCell>
                            <TableCell>{item.employeeType || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Showing {pagedEmployees.length} of {employeeList.length} employees
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" disabled={employeePage === 1} onClick={() => setEmployeePage((prev) => Math.max(1, prev - 1))}>
                          Previous
                        </Button>
                        <Typography variant="body2" sx={{ alignSelf: 'center', px: 1 }}>
                          {employeePage} / {totalEmployeePages}
                        </Typography>
                        <Button size="small" variant="outlined" disabled={employeePage === totalEmployeePages} onClick={() => setEmployeePage((prev) => Math.min(totalEmployeePages, prev + 1))}>
                          Next
                        </Button>
                      </Stack>
                    </Stack>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={4}>
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardContent>
                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.5 }}>
                  <EngineeringIcon sx={{ color: '#0f766e' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Create Karagir
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Add a new karagir profile.
                </Typography>

                <Box component="form" onSubmit={handleCreateKaragir}>
                  <Stack spacing={1.5}>
                    <TextField
                      label="Karagir Name"
                      value={karagirForm.name}
                      onChange={(event) => setKaragirForm((prev) => ({ ...prev, name: event.target.value }))}
                      required
                      fullWidth
                    />
                    <TextField
                      label="Mobile Number"
                      value={karagirForm.mobileNumber}
                      onChange={(event) => setKaragirForm((prev) => ({
                        ...prev,
                        mobileNumber: event.target.value.replace(/\D/g, '').slice(0, 10),
                      }))}
                      type="tel"
                      inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                      required
                      fullWidth
                    />
                    <TextField
                      label="Karagir Email"
                      value={karagirForm.email}
                      onChange={(event) => setKaragirForm((prev) => ({ ...prev, email: event.target.value }))}
                      type="email"
                      fullWidth
                    />
                    <TextField
                      label="Address"
                      value={karagirForm.address}
                      onChange={(event) => setKaragirForm((prev) => ({ ...prev, address: event.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label="Skill / Specialization"
                      value={karagirForm.speciality}
                      onChange={(event) => setKaragirForm((prev) => ({ ...prev, speciality: event.target.value }))}
                      fullWidth
                    />
                    <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={loading}>
                      Create Karagir
                    </Button>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={8}>
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Karagir List</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      size="small"
                      label="Karagir ID"
                      value={karagirIdSearch}
                      onChange={(event) => setKaragirIdSearch(event.target.value)}
                    />
                    <Button variant="outlined" startIcon={<SearchIcon />} onClick={handleFindKaragirById}>
                      Find by ID
                    </Button>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadKaragirs} disabled={loading}>
                      Load All
                    </Button>
                  </Stack>
                </Stack>

                {selectedKaragir && (
                  <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: '#f0fdfa' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Selected Karagir
                    </Typography>
                    <Typography variant="body2">ID: {selectedKaragir.id || '-'}</Typography>
                    <Typography variant="body2">Name: {selectedKaragir.name || '-'}</Typography>
                    <Typography variant="body2">Mobile: {selectedKaragir.mobileNumber || '-'}</Typography>
                    <Typography variant="body2">Speciality: {selectedKaragir.speciality || '-'}</Typography>
                  </Paper>
                )}

                <Divider sx={{ mb: 1.5 }} />

                {karagirList.length === 0 ? (
                  <Typography color="text.secondary">No karagir records loaded. Click Load All.</Typography>
                ) : (
                  <>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Mobile</TableCell>
                          <TableCell>Speciality</TableCell>
                          <TableCell>Address</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pagedKaragirs.map((item) => (
                          <TableRow key={`${item.id}-${item.name}`} hover>
                            <TableCell>{item.id || '-'}</TableCell>
                            <TableCell>{item.name || '-'}</TableCell>
                            <TableCell>{item.mobileNumber || '-'}</TableCell>
                            <TableCell>{item.speciality || '-'}</TableCell>
                            <TableCell>{item.address || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Showing {pagedKaragirs.length} of {karagirList.length} karagirs
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" disabled={karagirPage === 1} onClick={() => setKaragirPage((prev) => Math.max(1, prev - 1))}>
                          Previous
                        </Button>
                        <Typography variant="body2" sx={{ alignSelf: 'center', px: 1 }}>
                          {karagirPage} / {totalKaragirPages}
                        </Typography>
                        <Button size="small" variant="outlined" disabled={karagirPage === totalKaragirPages} onClick={() => setKaragirPage((prev) => Math.min(totalKaragirPages, prev + 1))}>
                          Next
                        </Button>
                      </Stack>
                    </Stack>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Employees;
