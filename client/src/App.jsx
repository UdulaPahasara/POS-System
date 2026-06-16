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
import SettingsLayout from './components/AdminDashboard/Settings/SettingsLayout';
import CategoryList from './components/AdminDashboard/Categories/CategoryList';
import InventoryDashboard from './components/AdminDashboard/InventoryStaff/InventoryDashboard';
import PurchaseOrderList from './components/AdminDashboard/PurchaseOrders/PurchaseOrderList';
import PurchaseReturnList from './components/AdminDashboard/PurchaseOrders/PurchaseReturnList';
import SupplierList from './components/AdminDashboard/Suppliers/SupplierList';
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
          
          {/* Admin Routes (Protected: Admin, Manager, Inventory Staff) */}
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'Inventory Staff']} />}>
              <Route path="/:roleBase" element={<AdminLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="inventory-dashboard" element={<InventoryDashboard />} />
                  <Route path="products" element={<ProductList />} />
                  <Route path="categories" element={<CategoryList />} />
                  <Route path="inventory" element={<InventoryLayout />} />
                  <Route path="purchase-orders" element={<PurchaseOrderList />} />
                  <Route path="purchase-returns" element={<PurchaseReturnList />} />
                  <Route element={<ProtectedRoute allowedRoles={['Manager']} />}>
                      <Route path="suppliers" element={<SupplierList />} />
                  </Route>
                  <Route element={<ProtectedRoute allowedRoles={['Manager', 'Cashier']} />}>
                      <Route path="customers" element={<CustomerList />} />
                  </Route>
                  <Route path="reports" element={<ReportLayout />} />
                  
                  <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                      <Route path="employees" element={<UserList />} />
                      <Route path="settings" element={<SettingsLayout />} />
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
