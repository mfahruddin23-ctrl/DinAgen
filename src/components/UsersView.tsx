import React, { useState } from 'react';
import { User, UserRole, BusinessSettings, NavTab } from '../types';
import { StorageService } from '../services/storage';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  KeyRound,
  Trash2,
  Edit,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  Crown,
  Briefcase,
  Layers,
  Sparkles
} from 'lucide-react';

interface UsersViewProps {
  currentUser: User | null;
  settings: BusinessSettings;
  onRefreshData?: () => void;
  onSelectTab?: (tab: NavTab) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  currentUser,
  settings,
  onRefreshData,
  onSelectTab
}) => {
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form states for Add User
  const [addForm, setAddForm] = useState({
    username: '',
    name: '',
    role: 'OPERATOR' as UserRole,
    password: '',
    confirmPassword: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [addError, setAddError] = useState('');

  // Form states for Edit User
  const [editForm, setEditForm] = useState<{
    id: string;
    username: string;
    name: string;
    role: UserRole;
    newPassword: string;
    confirmPassword: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>({
    id: '',
    username: '',
    name: '',
    role: 'OPERATOR',
    newPassword: '',
    confirmPassword: '',
    status: 'ACTIVE'
  });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editError, setEditError] = useState('');

  // Feedback banner
  const [bannerMsg, setBannerMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setBannerMsg({ type, text });
    setTimeout(() => setBannerMsg(null), 4000);
  };

  const refreshUsersList = () => {
    const list = StorageService.getUsers();
    setUsers(list);
    if (onRefreshData) onRefreshData();
  };

  // Handlers for Add User
  const handleOpenAddModal = () => {
    setAddForm({
      username: '',
      name: '',
      role: 'OPERATOR',
      password: '',
      confirmPassword: '',
      status: 'ACTIVE'
    });
    setAddError('');
    setShowAddPassword(false);
    setShowAddModal(true);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    const trimmedUsername = addForm.username.trim().toLowerCase().replace(/\s+/g, '');
    const trimmedName = addForm.name.trim();

    if (!trimmedUsername) {
      setAddError('Username wajib diisi.');
      return;
    }
    if (trimmedUsername.length < 3) {
      setAddError('Username minimal 3 karakter.');
      return;
    }
    if (!trimmedName) {
      setAddError('Nama lengkap wajib diisi.');
      return;
    }
    if (!addForm.password) {
      setAddError('Password wajib diisi.');
      return;
    }
    if (addForm.password.length < 4) {
      setAddError('Password minimal 4 karakter.');
      return;
    }
    if (addForm.password !== addForm.confirmPassword) {
      setAddError('Konfirmasi password tidak cocok.');
      return;
    }

    const newUser: User = {
      id: `USR-${Date.now().toString().slice(-6)}`,
      username: trimmedUsername,
      name: trimmedName,
      role: addForm.role,
      password: addForm.password,
      status: addForm.status,
      createdAt: new Date().toISOString()
    };

    const res = StorageService.saveUser(newUser, currentUser?.username || 'Admin');
    if (!res.success) {
      setAddError(res.message);
      return;
    }

    setShowAddModal(false);
    refreshUsersList();
    showNotification(`Pengguna baru "${newUser.name}" (${newUser.username}) berhasil ditambahkan!`);
  };

  // Handlers for Edit User
  const handleOpenEditModal = (u: User) => {
    setEditingUser(u);
    setEditForm({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      newPassword: '',
      confirmPassword: '',
      status: u.status
    });
    setEditError('');
    setShowEditPassword(false);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError('');

    const trimmedName = editForm.name.trim();
    if (!trimmedName) {
      setEditError('Nama lengkap wajib diisi.');
      return;
    }

    // If changing password
    if (editForm.newPassword) {
      if (editForm.newPassword.length < 4) {
        setEditError('Password baru minimal 4 karakter.');
        return;
      }
      if (editForm.newPassword !== editForm.confirmPassword) {
        setEditError('Konfirmasi password baru tidak cocok.');
        return;
      }
    }

    // Safety checks: if editing self
    if (currentUser?.id === editingUser.id) {
      if (editForm.status === 'INACTIVE') {
        setEditError('Anda tidak dapat menonaktifkan akun yang sedang Anda gunakan.');
        return;
      }
    }

    const updatedUser: User = {
      ...editingUser,
      name: trimmedName,
      role: editForm.role,
      status: editForm.status,
      password: editForm.newPassword ? editForm.newPassword : editingUser.password
    };

    const res = StorageService.saveUser(updatedUser, currentUser?.username || 'Admin');
    if (!res.success) {
      setEditError(res.message);
      return;
    }

    setEditingUser(null);
    refreshUsersList();
    showNotification(`Akun ${updatedUser.username} (${updatedUser.name}) berhasil diperbarui!`);
  };

  // Handler for quick status toggle
  const handleToggleStatus = (u: User) => {
    if (currentUser?.id === u.id) {
      showNotification('Anda tidak dapat menonaktifkan akun yang sedang aktif digunakan.', 'error');
      return;
    }

    const nextStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated: User = { ...u, status: nextStatus };
    const res = StorageService.saveUser(updated, currentUser?.username || 'Admin');
    if (res.success) {
      refreshUsersList();
      showNotification(
        `Status akun ${u.username} diubah menjadi ${nextStatus === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}.`
      );
    } else {
      showNotification(res.message, 'error');
    }
  };

  // Handlers for Delete User
  const handleConfirmDelete = () => {
    if (!deletingUser) return;
    const res = StorageService.deleteUser(deletingUser.id, currentUser?.username || 'Admin');
    if (res.success) {
      setDeletingUser(null);
      refreshUsersList();
      showNotification(res.message);
    } else {
      showNotification(res.message, 'error');
      setDeletingUser(null);
    }
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q);

    const matchRole =
      roleFilter === 'ALL' ||
      u.role === roleFilter ||
      (roleFilter === 'OPERATOR' && (u.role === 'OPERATOR' || (u.role as string) === 'KASIR'));

    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  // Role details helper
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'Administrator',
          badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
          icon: Shield
        };
      case 'OWNER':
        return {
          label: 'Owner / Pemilik',
          badgeClass: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700',
          icon: Crown
        };
      default:
        return {
          label: 'Kasir / Operator',
          badgeClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
          icon: Briefcase
        };
    }
  };

  // Stats
  const totalCount = users.length;
  const adminCount = users.filter(u => u.role === 'ADMIN' || u.role === 'OWNER').length;
  const operatorCount = users.filter(u => u.role === 'OPERATOR' || (u.role as string) === 'KASIR').length;
  const activeCount = users.filter(u => u.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Message */}
      {bannerMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm font-semibold transition animate-in fade-in slide-in-from-top-2 duration-200 ${
            bannerMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{bannerMsg.text}</span>
          </div>
          <button
            onClick={() => setBannerMsg(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header View */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Pengaturan &amp; Manajemen Pengguna
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola akun kasir, administrator, hak akses transaksi, dan reset password
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onSelectTab && (
            <button
              onClick={() => onSelectTab('settings')}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 transition"
            >
              Pengaturan Logo &amp; Usaha
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Total Pengguna</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Terdaftar dalam sistem</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Kasir &amp; Operator</span>
            <Briefcase className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {operatorCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Petugas loket transaksi</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Admin &amp; Owner</span>
            <Shield className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {adminCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Hak akses penuh &amp; sistem</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Akun Aktif</span>
            <UserCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {activeCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Bisa login ke aplikasi</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama, username, atau role..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">Semua Peran (Role)</option>
            <option value="ADMIN">Administrator</option>
            <option value="OPERATOR">Kasir / Operator</option>
            <option value="OWNER">Owner / Pemilik</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Hanya Aktif</option>
            <option value="INACTIVE">Hanya Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Users List Table / Card Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>Daftar Akun Pengguna</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-normal">
              {filteredUsers.length} akun
            </span>
          </h3>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Password tersimpan aman &amp; terenkripsi lokal
          </span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Tidak ada pengguna yang cocok dengan pencarian
            </p>
            <p className="text-xs text-slate-400">
              Coba ganti kata kunci pencarian atau reset filter role/status
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredUsers.map(user => {
              const roleInfo = getRoleBadge(user.role);
              const RoleIcon = roleInfo.icon;
              const isCurrent = currentUser?.id === user.id;

              return (
                <div
                  key={user.id}
                  className={`p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/50 ${
                    user.status === 'INACTIVE' ? 'opacity-65 bg-slate-50/40 dark:bg-slate-950/40' : ''
                  }`}
                >
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs ${
                        user.role === 'ADMIN'
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : user.role === 'OWNER'
                          ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {user.name}
                        </span>

                        {isCurrent && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-xs">
                            Akun Anda (Saat Ini)
                          </span>
                        )}

                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${roleInfo.badgeClass}`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {roleInfo.label}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            user.status === 'ACTIVE'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {user.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-semibold text-slate-700 dark:text-slate-300">
                          @{user.username}
                        </span>
                        <span>&bull;</span>
                        <span className="text-[11px]">ID: {user.id}</span>
                        {user.createdAt && (
                          <>
                            <span>&bull;</span>
                            <span className="text-[11px]">
                              Dibuat: {user.createdAt.slice(0, 10)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                    {/* Toggle Active Button */}
                    <button
                      onClick={() => handleToggleStatus(user)}
                      disabled={isCurrent}
                      title={
                        isCurrent
                          ? 'Tidak bisa menonaktifkan akun sendiri'
                          : user.status === 'ACTIVE'
                          ? 'Nonaktifkan Akun'
                          : 'Aktifkan Akun'
                      }
                      className={`p-2 rounded-xl text-xs font-semibold border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                        user.status === 'ACTIVE'
                          ? 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {user.status === 'ACTIVE' ? (
                        <UserX className="w-4 h-4 text-slate-500" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                      )}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEditModal(user)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setDeletingUser(user)}
                      disabled={isCurrent}
                      title={
                        isCurrent
                          ? 'Tidak dapat menghapus akun yang sedang aktif'
                          : 'Hapus Akun Pengguna'
                      }
                      className="p-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>Tingkat Hak Akses Pengguna (Role Permission)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
              <Shield className="w-4 h-4" />
              <span>ADMINISTRATOR (ADMIN)</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Memiliki akses penuh ke seluruh modul sistem: transaksi kasir, pengaturan modal kas, rekonsiliasi, reset kas, manajemen user, pengaturan logo usaha, dan sinkronisasi Google Spreadsheet.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
              <Briefcase className="w-4 h-4" />
              <span>KASIR / OPERATOR</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Fokus pada pelayanan harian: menginput transaksi transfer/tarik/setor tunai, mutasi kas, cetak struk thermal, cek saldo, dan melakukan rekonsiliasi kasir akhir shift.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 space-y-2">
            <div className="flex items-center gap-2 font-bold text-purple-800 dark:text-purple-300">
              <Crown className="w-4 h-4" />
              <span>PEMILIK (OWNER)</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Memantau performa keuangan bisnis: melihat keuntungan bersih, omset harian &amp; bulanan, berita acara tutup kas, riwayat audit log aktivitas, dan ekspor/backup data.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL: TAMBAH USER BARU */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Tambah Pengguna Baru
                  </h3>
                  <p className="text-xs text-slate-400">Buat akun untuk kasir atau administrator baru</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Petugas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="Contoh: Rina Melati"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Username Login <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-xs">@</span>
                  <input
                    type="text"
                    required
                    value={addForm.username}
                    onChange={e =>
                      setAddForm({
                        ...addForm,
                        username: e.target.value.toLowerCase().replace(/\s+/g, '')
                      })
                    }
                    placeholder="rinakasir"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Huruf kecil, tanpa spasi, digunakan untuk login ke sistem
                </span>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hak Akses (Role) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAddForm({ ...addForm, role: 'OPERATOR' })}
                    className={`p-3 rounded-xl border text-center transition ${
                      addForm.role === 'OPERATOR'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-400/40'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span className="block text-xs font-bold">Kasir</span>
                    <span className="text-[10px] text-slate-400 block">Operator Loket</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddForm({ ...addForm, role: 'ADMIN' })}
                    className={`p-3 rounded-xl border text-center transition ${
                      addForm.role === 'ADMIN'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 ring-2 ring-amber-400/40'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Shield className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                    <span className="block text-xs font-bold">Admin</span>
                    <span className="text-[10px] text-slate-400 block">Kelola Penuh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddForm({ ...addForm, role: 'OWNER' })}
                    className={`p-3 rounded-xl border text-center transition ${
                      addForm.role === 'OWNER'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 ring-2 ring-purple-400/40'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Crown className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                    <span className="block text-xs font-bold">Owner</span>
                    <span className="text-[10px] text-slate-400 block">Pemilik Toko</span>
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showAddPassword ? 'text' : 'password'}
                      required
                      value={addForm.password}
                      onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                      placeholder="Min. 4 karakter"
                      className="w-full px-3.5 py-2.5 pr-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPassword(!showAddPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ulangi Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type={showAddPassword ? 'text' : 'password'}
                    required
                    value={addForm.confirmPassword}
                    onChange={e => setAddForm({ ...addForm, confirmPassword: e.target.value })}
                    placeholder="Konfirmasi kata sandi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Status Akun
                </label>
                <select
                  value={addForm.status}
                  onChange={e => setAddForm({ ...addForm, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ACTIVE">Aktif (Dapat langsung digunakan login)</option>
                  <option value="INACTIVE">Nonaktif (Belum bisa login)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Simpan Pengguna Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Edit Profil Pengguna
                  </h3>
                  <p className="text-xs text-slate-400">Ubah data, peran hak akses, atau reset sandi</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Username Akun
                </label>
                <input
                  type="text"
                  disabled
                  value={`@${editForm.username}`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Username tetap untuk menjaga integritas data audit log
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Petugas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hak Akses (Role)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, role: 'OPERATOR' })}
                    className={`p-3 rounded-xl border text-center transition ${
                      editForm.role === 'OPERATOR'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-400/40'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span className="block text-xs font-bold">Kasir</span>
                    <span className="text-[10px] text-slate-400 block">Operator Loket</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, role: 'ADMIN' })}
                    className={`p-3 rounded-xl border text-center transition ${
                      editForm.role === 'ADMIN'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 ring-2 ring-amber-400/40'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Shield className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                    <span className="block text-xs font-bold">Admin</span>
                    <span className="text-[10px] text-slate-400 block">Kelola Penuh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, role: 'OWNER' })}
                    className={`p-3 rounded-xl border text-center transition ${
                      editForm.role === 'OWNER'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 ring-2 ring-purple-400/40'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Crown className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                    <span className="block text-xs font-bold">Owner</span>
                    <span className="text-[10px] text-slate-400 block">Pemilik Toko</span>
                  </button>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Status Akun
                </label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ACTIVE">Aktif (Bisa login &amp; transaksi)</option>
                  <option value="INACTIVE">Nonaktif (Akses diblokir sementara)</option>
                </select>
              </div>

              {/* Change Password Section (Optional) */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ubah Password (Opsional)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Kosongkan jika tidak diubah</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Password Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        value={editForm.newPassword}
                        onChange={e => setEditForm({ ...editForm, newPassword: e.target.value })}
                        placeholder="Ketik password baru"
                        className="w-full px-3 py-2 pr-8 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                      >
                        {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Ulangi Password Baru
                    </label>
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editForm.confirmPassword}
                      onChange={e => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                      placeholder="Konfirmasi password"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS USER */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Hapus Akun Pengguna?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Apakah Anda yakin ingin menghapus akun{' '}
                <strong className="text-slate-900 dark:text-white">
                  {deletingUser.name} (@{deletingUser.username})
                </strong>
                ? Tindakan ini akan dicatat di Audit Log sistem.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300">
              Perhatian: Jika kasir hanya berhenti bekerja sementara, disarankan untuk <strong>Menonaktifkan</strong> akun saja daripada menghapusnya.
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/25"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
