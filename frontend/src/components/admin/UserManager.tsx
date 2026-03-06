import React, { useState } from 'react';
import { Users, Search, Shield, User, Mail, Trash2, Edit } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'user' | 'admin';
    status: 'active' | 'inactive';
    joinedDate: string;
}

const mockUsers: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'user', status: 'active', joinedDate: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'admin', status: 'active', joinedDate: '2024-02-20' },
    { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'user', status: 'inactive', joinedDate: '2024-03-10' },
    { id: 4, name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active', joinedDate: '2024-01-01' },
];

export const UserManager: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users] = useState<User[]>(mockUsers);

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold theme-text-base mb-2">User Management</h1>
                <p className="theme-text-secondary">
                    Manage users, roles, and permissions
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="theme-surface theme-border border rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl theme-primary flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm theme-text-secondary">Total Users</p>
                            <p className="text-2xl font-bold theme-text-base">{users.length}</p>
                        </div>
                    </div>
                </div>
                <div className="theme-surface theme-border border rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm theme-text-secondary">Active Users</p>
                            <p className="text-2xl font-bold theme-text-base">
                                {users.filter((u) => u.status === 'active').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="theme-surface theme-border border rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm theme-text-secondary">Administrators</p>
                            <p className="text-2xl font-bold theme-text-base">
                                {users.filter((u) => u.role === 'admin').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="theme-surface theme-border border rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 theme-text-secondary" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 theme-text-base placeholder-[var(--theme-text-secondary-value)] focus:outline-none"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="theme-surface theme-border border rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="theme-border border-b">
                        <tr>
                            <th className="text-left p-4 theme-text-secondary font-medium text-sm">User</th>
                            <th className="text-left p-4 theme-text-secondary font-medium text-sm">Role</th>
                            <th className="text-left p-4 theme-text-secondary font-medium text-sm">Status</th>
                            <th className="text-left p-4 theme-text-secondary font-medium text-sm">Joined</th>
                            <th className="text-right p-4 theme-text-secondary font-medium text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="border-t theme-border hover:bg-[var(--theme-border-value)]">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full theme-primary flex items-center justify-center text-white">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium theme-text-base">{user.name}</p>
                                            <div className="flex items-center gap-1 text-sm theme-text-secondary">
                                                <Mail className="w-3 h-3" />
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span
                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        <Shield className="w-3 h-3" />
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${user.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        {user.status}
                                    </span>
                                </td>
                                <td className="p-4 theme-text-secondary text-sm">{user.joinedDate}</td>
                                <td className="p-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="p-2 theme-text-secondary hover:theme-primary transition-colors">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 theme-text-secondary hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
