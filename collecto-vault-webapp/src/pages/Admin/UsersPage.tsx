import React, { useState } from 'react';
import { Users, Search, Award, ChevronDown, Trash2 } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    points: number;
    tier: string;
    status: 'Active' | 'Suspended';
}

const mockUsers: User[] = [
    { id: 101, name: "Alice Johnson", email: "alice@example.com", points: 2350, tier: "Gold", status: 'Active' },
    { id: 102, name: "Bob Smith", email: "bob@example.com", points: 450, tier: "Bronze", status: 'Active' },
    { id: 103, name: "Charlie Brown", email: "charlie@example.com", points: 1500, tier: "Silver", status: 'Suspended' },
];

export default function UsersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState(mockUsers);

    // --- NEW: Handler that uses setUsers to remove a user ---
    const handleRemoveUser = (userId: number, userName: string) => {
        if (window.confirm(`Are you sure you want to remove user: ${userName}? This action cannot be undone.`)) {
            setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        }
    };
    // --------------------------------------------------------

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-7 h-7 text-teal-600" /> User Management ({users.length})
            </h1>
            <p className="text-gray-500">Search, view, and manage loyalty member accounts and point balances.</p>

            {/* Search and Filter Bar */}
            <div className="flex gap-4">
                <div className="relative grow">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border-gray-300 rounded-lg shadow-sm focus:border-teal-500 focus:ring-teal-500"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Award className="w-4 h-4" /> Filter Tier
                </button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <TableHeader label="User ID" />
                            <TableHeader label="Name" />
                            <TableHeader label="Email" />
                            <TableHeader label="Points" />
                            <TableHeader label="Tier" />
                            <TableHeader label="Status" />
                            <TableHeader label="Actions" isAction={true} />
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-teal-600">{user.points.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.tier === 'Gold' ? 'bg-yellow-100 text-yellow-800' : user.tier === 'Silver' ? 'bg-slate-100 text-slate-800' : 'bg-orange-100 text-orange-800'}`}>
                                        {user.tier}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button className="text-indigo-600 hover:text-indigo-900">View/Edit</button>
                                    <button 
                                        className="text-red-600 hover:text-red-900"
                                        onClick={() => handleRemoveUser(user.id, user.name)}
                                    >
                                        <Trash2 className="w-4 h-4 inline-block" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Sub-component
const TableHeader: React.FC<{ label: string; isAction?: boolean }> = ({ label, isAction = false }) => (
    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${isAction ? 'text-right' : ''}`}>
        <div className="flex items-center">
            {label}
            {!isAction && <ChevronDown className="w-3 h-3 ml-1" />}
        </div>
    </th>
);