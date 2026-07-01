const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'client', 'src');
const componentsDir = path.join(srcDir, 'components');

const dirsToCreate = [
    'services',
    'components/common',
    'components/layout',
    'components/shared_modules/inventory',
    'components/shared_modules/purchasing',
    'components/shared_modules/customers',
    'components/admin/users',
    'components/admin/settings',
    'components/admin/categories',
    'components/admin/products',
    'components/manager/dashboard',
    'components/manager/reports',
    'components/manager/suppliers',
    'components/inventory_staff/dashboard',
    'components/pos_cashier',
    'components/auth'
];

dirsToCreate.forEach(dir => {
    fs.mkdirSync(path.join(srcDir, dir), { recursive: true });
});

function moveFile(oldPath, newPath) {
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`Moved ${oldPath} to ${newPath}`);
    } else {
        console.log(`File not found: ${oldPath}`);
    }
}

function moveFolderContents(oldFolder, newFolder) {
    if (fs.existsSync(oldFolder)) {
        const files = fs.readdirSync(oldFolder);
        files.forEach(file => {
            moveFile(path.join(oldFolder, file), path.join(newFolder, file));
        });
    } else {
        console.log(`Folder not found: ${oldFolder}`);
    }
}

// Move Layouts
moveFile(path.join(componentsDir, 'AdminDashboard', 'AdminLayout.jsx'), path.join(componentsDir, 'layout', 'DashboardLayout.jsx'));
moveFile(path.join(componentsDir, 'AdminDashboard', 'AdminSidebar.jsx'), path.join(componentsDir, 'layout', 'Sidebar.jsx'));
moveFile(path.join(componentsDir, 'AdminDashboard', 'AdminHeader.jsx'), path.join(componentsDir, 'layout', 'Header.jsx'));

// Move POS
moveFolderContents(path.join(componentsDir, 'POS'), path.join(componentsDir, 'pos_cashier'));

// Move Auth
moveFolderContents(path.join(componentsDir, 'login'), path.join(componentsDir, 'auth'));

// Move Protected Route
moveFile(path.join(componentsDir, 'ProtectedRoute.jsx'), path.join(componentsDir, 'common', 'ProtectedRoute.jsx'));

// Move Shared Modules
moveFolderContents(path.join(componentsDir, 'AdminDashboard', 'Inventory'), path.join(componentsDir, 'shared_modules', 'inventory'));
moveFolderContents(path.join(componentsDir, 'AdminDashboard', 'PurchaseOrders'), path.join(componentsDir, 'shared_modules', 'purchasing'));
moveFolderContents(path.join(componentsDir, 'AdminDashboard', 'Customers'), path.join(componentsDir, 'shared_modules', 'customers'));

// Move Admin
moveFolderContents(path.join(componentsDir, 'AdminDashboard', 'Users'), path.join(componentsDir, 'admin', 'users'));
moveFolderContents(path.join(componentsDir, 'AdminDashboard', 'Settings'), path.join(componentsDir, 'admin', 'settings'));
moveFolderContents(path.join(componentsDir, 'AdminDashboard', 'Categories'), path.join(componentsDir, 'admin', 'categories'));
moveFolderContents(path.join(componentsDir, 'AdminDashboard', 'Products'), path.join(componentsDir, 'admin', 'products'));

// Move Manager
moveFile(path.join(componentsDir, 'AdminDashboard', 'Dashboard.jsx'), path.join(componentsDir, 'manager', 'dashboard', 'Dashboard.jsx'));
moveFolderContents(path.join(componentsDir, 'AdminDashboard', 'Reports'), path.join(componentsDir, 'manager', 'reports'));
moveFolderContents(path.join(componentsDir, 'AdminDashboard', 'Suppliers'), path.join(componentsDir, 'manager', 'suppliers'));

// Move Inventory Staff
moveFolderContents(path.join(componentsDir, 'AdminDashboard', 'InventoryStaff'), path.join(componentsDir, 'inventory_staff', 'dashboard'));

// Remove empty directories
try { fs.rmdirSync(path.join(componentsDir, 'AdminDashboard', 'Inventory')); } catch (e) {}
try { fs.rmdirSync(path.join(componentsDir, 'AdminDashboard', 'PurchaseOrders')); } catch (e) {}
try { fs.rmdirSync(path.join(componentsDir, 'AdminDashboard', 'Customers')); } catch (e) {}
try { fs.rmdirSync(path.join(componentsDir, 'AdminDashboard', 'Users')); } catch (e) {}
try { fs.rmdirSync(path.join(componentsDir, 'AdminDashboard', 'Settings')); } catch (e) {}
try { fs.rmdirSync(path.join(componentsDir, 'AdminDashboard', 'Categories')); } catch (e) {}
try { fs.rmdirSync(path.join(componentsDir, 'AdminDashboard', 'Products')); } catch (e) {}
try { fs.rmdirSync(path.join(componentsDir, 'AdminDashboard', 'Reports')); } catch (e) {}
try { fs.rmdirSync(path.join(componentsDir, 'AdminDashboard', 'Suppliers')); } catch (e) {}
try { fs.rmdirSync(path.join(componentsDir, 'AdminDashboard', 'InventoryStaff')); } catch (e) {}
try { fs.rmdirSync(path.join(componentsDir, 'AdminDashboard')); } catch (e) {}
try { fs.rmdirSync(path.join(componentsDir, 'POS')); } catch (e) {}
try { fs.rmdirSync(path.join(componentsDir, 'login')); } catch (e) {}

console.log("Migration complete!");
