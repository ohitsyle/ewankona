// src/pages/admin/Sysad/ManageUsers.jsx
// Manage Users page for System Admin

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import { toast } from 'react-toastify';
import { Search, Download, Plus, Edit, Trash2, Users, UserCheck, UserX, Shield, GraduationCap, Briefcase, X, Check, Loader2 } from 'lucide-react';
import { exportToCSV } from '../../../utils/csvExport';

export default function ManageUsers() {
  const { theme, isDarkMode } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    employees: 0,
    students: 0
  });
  const intervalRef = useRef(null);
  const usersPerPage = 20;

  // Purple accent for sysad
  const accentColor = '#8B5CF6';

  const fetchUsers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const params = new URLSearchParams({
        page: currentPage,
        limit: usersPerPage,
        sortBy
      });
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const data = await api.get(`/admin/sysad/users?${params}`);
      if (data) {
        setUsers(data.users || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalUsers(data.pagination?.total || 0);
        setMetrics(data.metrics || metrics);
      }
    } catch (error) {
      if (!silent) toast.error('Failed to load users');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter, sortBy]);

  useEffect(() => {
    intervalRef.current = setInterval(() => fetchUsers(true), 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleExportCSV = () => {
    const exportData = users.map(user => ({
      'ID Number': user.schoolUId || user.adminId || 'N/A',
      'Name': `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      'Email': user.email || 'N/A',
      'Role': user.role || 'user',
      'Status': user.isActive ? 'Active' : 'Inactive',
      'Balance': user.balance || 0,
      'Created': new Date(user.createdAt).toLocaleDateString()
    }));
    exportToCSV(exportData, `users-export-${sortBy}`);
    toast.success('Users exported successfully');
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      await api.delete(`/admin/sysad/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers(true);
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.patch(`/admin/sysad/users/${userId}/status`, {
        isActive: !currentStatus
      });
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchUsers(true);
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  return (
    <div className="min-h-[calc(100vh-220px)] flex flex-col">
      {/* Header */}
      <div style={{ borderColor: theme.border.primary }} className="mb-6 border-b-2 pb-5">
        <h2 style={{ color: accentColor }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>👥</span> Manage Users
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          View, add, edit, and manage all system users
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <MetricCard icon={<Users className="w-5 h-5" />} label="Total Users" value={metrics.total} color="#3B82F6" theme={theme} />
        <MetricCard icon={<UserCheck className="w-5 h-5" />} label="Active" value={metrics.active} color="#10B981" theme={theme} />
        <MetricCard icon={<UserX className="w-5 h-5" />} label="Inactive" value={metrics.inactive} color="#EF4444" theme={theme} />
        <MetricCard icon={<Shield className="w-5 h-5" />} label="Admins" value={metrics.admins} color="#8B5CF6" theme={theme} />
        <MetricCard icon={<Briefcase className="w-5 h-5" />} label="Employees" value={metrics.employees} color="#F59E0B" theme={theme} />
        <MetricCard icon={<GraduationCap className="w-5 h-5" />} label="Students" value={metrics.students} color="#06B6D4" theme={theme} />
      </div>

      {/* Actions Bar */}
      <div
        style={{
          background: isDarkMode ? 'rgba(15,18,39,0.8)' : theme.bg.card,
          borderColor: accentColor
        }}
        className="rounded-xl border-2 p-4 mb-5"
      >
        <div className="flex flex-wrap gap-3 items-center justify-between">
          {/* Left: Search & Filters */}
          <div className="flex flex-wrap gap-3 items-center flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search style={{ color: theme.text.tertiary }} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, ID, email..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ background: isDarkMode ? 'rgba(30,35,71,0.8)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              style={{ background: isDarkMode ? 'rgba(30,35,71,0.8)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
              className="px-3 py-2 rounded-lg border text-sm focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="employee">Employees</option>
              <option value="admin">Admins</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              style={{ background: isDarkMode ? 'rgba(30,35,71,0.8)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
              className="px-3 py-2 rounded-lg border text-sm focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              style={{ background: isDarkMode ? 'rgba(30,35,71,0.8)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
              className="px-3 py-2 rounded-lg border text-sm focus:outline-none"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="lastName">Sort by Name</option>
              <option value="role">Sort by Role</option>
            </select>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981', borderColor: 'rgba(16,185,129,0.3)' }}
              className="px-4 py-2 rounded-lg font-semibold text-sm border flex items-center gap-2 hover:opacity-80 transition"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              style={{ background: accentColor, color: '#FFFFFF' }}
              className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="mb-4 flex justify-between items-center">
        <p style={{ color: theme.text.secondary }} className="text-sm">
          Showing <span style={{ color: accentColor }} className="font-bold">{users.length}</span> of {totalUsers} users
        </p>
      </div>

      {/* Users Table */}
      <div className="flex-1">
        <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="rounded-2xl border overflow-hidden">
          {loading ? (
            <div style={{ color: accentColor }} className="text-center py-20">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div style={{ color: theme.text.tertiary }} className="text-center py-20">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-semibold">No users found</p>
              <p className="text-sm mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: isDarkMode ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.05)' }}>
                    <th style={{ color: accentColor, borderColor: theme.border.primary }} className="text-left p-4 text-xs font-bold uppercase border-b-2">ID Number</th>
                    <th style={{ color: accentColor, borderColor: theme.border.primary }} className="text-left p-4 text-xs font-bold uppercase border-b-2">Name</th>
                    <th style={{ color: accentColor, borderColor: theme.border.primary }} className="text-left p-4 text-xs font-bold uppercase border-b-2">Email</th>
                    <th style={{ color: accentColor, borderColor: theme.border.primary }} className="text-left p-4 text-xs font-bold uppercase border-b-2">Role</th>
                    <th style={{ color: accentColor, borderColor: theme.border.primary }} className="text-left p-4 text-xs font-bold uppercase border-b-2">Status</th>
                    <th style={{ color: accentColor, borderColor: theme.border.primary }} className="text-center p-4 text-xs font-bold uppercase border-b-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} style={{ borderColor: theme.border.primary }} className="border-b hover:bg-white/5 transition">
                      <td style={{ color: theme.text.primary }} className="p-4 font-mono font-semibold">
                        {user.schoolUId || user.adminId || 'N/A'}
                      </td>
                      <td style={{ color: theme.text.primary }} className="p-4 font-semibold">
                        {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}
                      </td>
                      <td style={{ color: theme.text.secondary }} className="p-4">
                        {user.email || 'N/A'}
                      </td>
                      <td className="p-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="p-4">
                        <StatusBadge isActive={user.isActive} />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
                            style={{ background: 'rgba(59,130,246,0.2)', color: '#3B82F6' }}
                            className="p-2 rounded-lg hover:opacity-80 transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user._id, user.isActive)}
                            style={{
                              background: user.isActive ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                              color: user.isActive ? '#EF4444' : '#10B981'
                            }}
                            className="p-2 rounded-lg hover:opacity-80 transition"
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            style={{ background: 'rgba(239,68,68,0.2)', color: '#EF4444' }}
                            className="p-2 rounded-lg hover:opacity-80 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{ background: theme.bg.card, borderColor: theme.border.primary }}
            className="mt-4 flex justify-between items-center p-4 rounded-xl border"
          >
            <p style={{ color: theme.text.secondary }} className="text-sm">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  background: currentPage === 1 ? 'rgba(255,255,255,0.05)' : `${accentColor}20`,
                  color: currentPage === 1 ? theme.text.muted : accentColor,
                  borderColor: theme.border.primary
                }}
                className="px-4 py-2 rounded-lg font-semibold text-sm border disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{
                  background: currentPage === totalPages ? 'rgba(255,255,255,0.05)' : `${accentColor}20`,
                  color: currentPage === totalPages ? theme.text.muted : accentColor,
                  borderColor: theme.border.primary
                }}
                className="px-4 py-2 rounded-lg font-semibold text-sm border disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          theme={theme}
          isDarkMode={isDarkMode}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); fetchUsers(true); }}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          theme={theme}
          isDarkMode={isDarkMode}
          user={selectedUser}
          onClose={() => { setShowEditModal(false); setSelectedUser(null); }}
          onSuccess={() => { setShowEditModal(false); setSelectedUser(null); fetchUsers(true); }}
        />
      )}
    </div>
  );
}

// Metric Card Component
function MetricCard({ icon, label, value, color, theme }) {
  return (
    <div style={{ background: theme.bg.card, borderColor: `${color}30` }} className="p-3 rounded-xl border flex items-center gap-3">
      <div style={{ background: `${color}20`, color }} className="w-10 h-10 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p style={{ color: theme.text.secondary }} className="text-[10px] font-semibold uppercase">{label}</p>
        <p style={{ color }} className="text-lg font-bold">{value?.toLocaleString() || 0}</p>
      </div>
    </div>
  );
}

// Role Badge Component
function RoleBadge({ role }) {
  const config = {
    admin: { bg: 'rgba(139,92,246,0.2)', color: '#8B5CF6', label: 'Admin' },
    student: { bg: 'rgba(6,182,212,0.2)', color: '#06B6D4', label: 'Student' },
    employee: { bg: 'rgba(245,158,11,0.2)', color: '#F59E0B', label: 'Employee' },
    user: { bg: 'rgba(107,114,128,0.2)', color: '#6B7280', label: 'User' }
  };
  const { bg, color, label } = config[role] || config.user;
  return (
    <span style={{ background: bg, color }} className="px-2 py-1 rounded-full text-xs font-bold capitalize">
      {label}
    </span>
  );
}

// Status Badge Component
function StatusBadge({ isActive }) {
  return (
    <span
      style={{
        background: isActive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
        color: isActive ? '#10B981' : '#EF4444'
      }}
      className="px-2 py-1 rounded-full text-xs font-bold"
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

// Add User Modal
function AddUserModal({ theme, isDarkMode, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    schoolUId: '',
    role: 'student'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.schoolUId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/admin/sysad/users', formData);
      toast.success('User created successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        style={{ background: isDarkMode ? '#1E2347' : '#FFFFFF', borderColor: theme.border.primary }}
        className="relative rounded-2xl shadow-2xl border w-full max-w-lg overflow-hidden animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }} className="px-6 py-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add New User
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
                required
              />
            </div>
            <div>
              <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">Middle Name</label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">Last Name *</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
              className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
              required
            />
          </div>
          <div>
            <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
              className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">School ID *</label>
              <input
                type="text"
                value={formData.schoolUId}
                onChange={(e) => setFormData({ ...formData, schoolUId: e.target.value })}
                style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
                required
              />
            </div>
            <div>
              <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
              >
                <option value="student">Student</option>
                <option value="employee">Employee</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              style={{ background: isDarkMode ? 'rgba(71,85,105,0.5)' : '#E5E7EB', color: theme.text.primary }}
              className="flex-1 py-3 rounded-xl font-semibold transition hover:opacity-80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ background: '#8B5CF6', color: '#FFFFFF' }}
              className="flex-1 py-3 rounded-xl font-semibold transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}

// Edit User Modal
function EditUserModal({ theme, isDarkMode, user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    middleName: user.middleName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    schoolUId: user.schoolUId || '',
    isActive: user.isActive !== false
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/admin/sysad/users/${user._id}`, formData);
      toast.success('User updated successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        style={{ background: isDarkMode ? '#1E2347' : '#FFFFFF', borderColor: theme.border.primary }}
        className="relative rounded-2xl shadow-2xl border w-full max-w-lg overflow-hidden animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }} className="px-6 py-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Edit className="w-5 h-5" /> Edit User
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
                required
              />
            </div>
            <div>
              <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">Middle Name</label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">Last Name *</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
              className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
              required
            />
          </div>
          <div>
            <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
              className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
              required
            />
          </div>
          <div>
            <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">School ID</label>
            <input
              type="text"
              value={formData.schoolUId}
              onChange={(e) => setFormData({ ...formData, schoolUId: e.target.value })}
              style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
              className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
            />
          </div>

          {/* Status Toggle */}
          <div
            style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', borderColor: theme.border.primary }}
            className="p-4 rounded-xl border flex items-center justify-between"
          >
            <div>
              <p style={{ color: theme.text.primary }} className="font-semibold">Account Status</p>
              <p style={{ color: theme.text.secondary }} className="text-xs">
                {formData.isActive ? 'User can access the system' : 'User cannot access the system'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              style={{
                background: formData.isActive ? '#10B981' : '#EF4444'
              }}
              className="px-4 py-2 rounded-lg text-white font-semibold text-sm transition"
            >
              {formData.isActive ? 'Active' : 'Inactive'}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              style={{ background: isDarkMode ? 'rgba(71,85,105,0.5)' : '#E5E7EB', color: theme.text.primary }}
              className="flex-1 py-3 rounded-xl font-semibold transition hover:opacity-80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ background: '#3B82F6', color: '#FFFFFF' }}
              className="flex-1 py-3 rounded-xl font-semibold transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
