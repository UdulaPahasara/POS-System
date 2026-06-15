import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Login from './components/login/login';
import AdminLayout from './components/AdminDashboard/AdminLayout';
import Dashboard from './components/AdminDashboard/Dashboard';
import ProductList from './components/AdminDashboard/Products/ProductList';
import InventoryLayout from './components/AdminDashboard/Inventory/InventoryLayout';
import CustomerList from './components/AdminDashboard/Customers/CustomerList';
import UserList from './components/AdminDashboard/Users/UserList';
import POSLayout from './components/POS/POSLayout';
import ReportLayout from './components/AdminDashboard/Reports/ReportLayout';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Full Screen POS Route (Protected: All Roles except maybe pure admin depending on preference, but we'll allow all for now) */}
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'Cashier', 'Inventory Staff']} />}>
              <Route path="/pos" element={<POSLayout />} />
          </Route>
          
          {/* Admin Routes (Protected: Admin and Manager) */}
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager']} />}>
              <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="products" element={<ProductList />} />
                  <Route path="inventory" element={<InventoryLayout />} />
                  <Route path="customers" element={<CustomerList />} />
                  <Route path="reports" element={<ReportLayout />} />
                  
                  {/* Strict Admin Only Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                      <Route path="employees" element={<UserList />} />
                  </Route>
                  
                  <Route path="*" element={<Box sx={{ p: 4, color: '#fff', fontSize: '1.2rem' }}>Module Under Construction</Box>} />
              </Route>
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
