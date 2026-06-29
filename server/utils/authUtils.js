export const getRoleName = (user) => {
    if (!user || !user.role) return null;
    return typeof user.role === 'object' ? user.role.roleName : user.role;
};

export const isAdminRole = (user) => {
    const roleName = getRoleName(user);
    return roleName === 'Admin' || roleName === 'Super Admin';
};
