import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Login from './components/auth/login';
import ResetPassword from './components/auth/ResetPassword';
import AdminLayout from './components/layout/DashboardLayout';
import Dashboard from './components/manager/dashboard/Dashboard';
import ProductList from './components/admin/products/ProductList';
import InventoryLayout from './components/shared_modules/inventory/InventoryLayout';
import CustomerList from './components/shared_modules/customers/CustomerList';
import UserList from './components/admin/users/UserList';
import POSLayout from './components/pos_cashier/POSLayout';
import ReportLayout from './components/manager/reports/ReportLayout';
import SettingsLayout from './components/admin/settings/SettingsLayout';
import CategoryList from './components/admin/categories/CategoryList';
import BranchList from './components/admin/branches/BranchList';
import InventoryDashboard from './components/inventory_staff/dashboard/InventoryDashboard';
import PurchaseOrderList from './components/shared_modules/purchasing/PurchaseOrderList';
import PurchaseReturnList from './components/shared_modules/purchasing/PurchaseReturnList';
import SupplierList from './components/manager/suppliers/SupplierList';
import InvoiceList from './components/manager/invoices/InvoiceList';
import ProtectedRoute from './components/common/ProtectedRoute';
import ChatbotWidget from './components/chatbot/ChatbotWidget';
import UserProfile from './components/common/UserProfile';
import './App.css';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { NotificationProvider } from './context/NotificationContext';

const theme = createTheme({
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Full Screen POS Route (Protected: All Roles except maybe pure admin depending on preference, but we'll allow all for now) */}
            <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'Cashier', 'Inventory Staff']} />}>
                <Route path="/pos" element={<POSLayout />} />
            </Route>
            
            {/* Admin Routes (Protected: Admin, Manager, Inventory Staff) */}
            <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'Inventory Staff']} />}>
                <Route path="/:roleBase" element={<AdminLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="profile" element={<UserProfile />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="inventory-dashboard" element={<InventoryDashboard />} />
                    <Route path="products" element={<ProductList />} />
                    <Route path="categories" element={<CategoryList />} />
                    <Route path="inventory" element={<InventoryLayout />} />
                    <Route path="purchase-orders" element={<PurchaseOrderList />} />
                    <Route path="purchase-returns" element={<PurchaseReturnList />} />
                    <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager']} />}>
                        <Route path="suppliers" element={<SupplierList />} />
                    </Route>
                    <Route element={<ProtectedRoute allowedRoles={['Manager', 'Cashier']} />}>
                        <Route path="customers" element={<CustomerList />} />
                    </Route>
                    <Route path="reports" element={<ReportLayout />} />
                    
                    <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager']} />}>
                        <Route path="invoices" element={<InvoiceList />} />
                    </Route>
                    
                    <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                        <Route path="branches" element={<BranchList />} />
                        <Route path="employees" element={<UserList />} />
                        <Route path="settings" element={<SettingsLayout />} />
                    </Route>
                    
                    <Route path="*" element={<Box sx={{ p: 4, color: '#fff', fontSize: '1.2rem' }}>Module Under Construction</Box>} />
                </Route>
            </Route>
          </Routes>
          <ChatbotWidget />
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
