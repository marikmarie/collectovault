import React, { useState, useEffect } from 'react';
import { Plus, Search,  X, Edit, Trash2 } from 'lucide-react';
import { customerService } from '../../api/customer';

// --- Type Definitions ---
interface UserData {
  id: number;
  name: string;
  clientId: string;
  currentPoints: number;
  currentTierId: number | null;
}

// --- Sub-components ---

interface UserModalProps {
    initialData: UserData | null;
    onClose: () => void;
    onSave: (userData: Omit<UserData, 'id' | 'currentTierId'>) => void;
}

const UserModal: React.FC<UserModalProps> = ({ initialData, onClose, onSave }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [clientId, setClientId] = useState(initialData?.clientId || '');
    const [currentPoints, setCurrentPoints] = useState(initialData?.currentPoints || 0);

    const handleSubmit = () => {
        onSave({ name, clientId, currentPoints });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                        {initialData ? 'Edit User' : 'Create New User'}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                        <input type="text" value={clientId} onChange={e => setClientId(e.target.value)} className="w-full border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Points</label>
                        <input type="number" value={currentPoints} onChange={e => setCurrentPoints(parseInt(e.target.value) || 0)} className="w-full border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" />
                    </div>
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
                        {initialData ? 'Update User' : 'Create User'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

const UsersManagement: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const collectoId = localStorage.getItem('collectoId');
            
            if (!collectoId) {
                setError('CollectoId not found in localStorage');
                return;
            }

            const response = await customerService.getAllCustomers(collectoId);
            setUsers(response.data.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch users');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.clientId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRemoveUser = (id: number) => {
        if (window.confirm('Are you sure you want to remove this user? This action is irreversible.')) {
            setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
        }
    };
    
    // Placeholder for save logic
    const handleSaveUser = (userData: Omit<UserData, 'id' | 'currentTierId'>) => {
        if (editingUser) {
            setUsers(prevUsers => prevUsers.map(u => u.id === editingUser.id ? {...u, ...userData} : u));
        } else {
            const newUser: UserData = {
                id: Date.now(),
                ...userData,
                currentTierId: null,
            };
            setUsers(prevUsers => [...prevUsers, newUser]);
        }
        setIsModalOpen(false);
        setEditingUser(null);
    }

    if (loading) {
        return (
            <div className="space-y-8 max-w-full">
                <div className="text-center py-12">
                    <p className="text-gray-500">Loading users...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-8 max-w-full">
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">{error}</p>
                    <button 
                        onClick={fetchUsers}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">User Management ({users.length} Total)</h2>
                <button
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-lg transition-colors"
                    onClick={() => {
                        setEditingUser(null);
                        setIsModalOpen(true);
                    }}
                >
                    <Plus className="w-4 h-4" /> Add New User
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name or client ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                />
            </div>
            
            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Client ID
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Points
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="shrink-0 h-10 w-10">
                                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm">
                                                {user.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.clientId}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                    {user.currentPoints.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button 
                                        onClick={() => {
                                            setEditingUser(user);
                                            setIsModalOpen(true);
                                        }}
                                        className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleRemoveUser(user.id)}
                                        className="text-gray-400 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-colors ml-2"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                        No users found matching "{searchTerm}".
                    </div>
                )}
            </div>
            
            {/* Modal Placeholder for Create/Edit */}
            {isModalOpen && (
                <UserModal
                    initialData={editingUser}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveUser}
                />
            )}
        </div>
    );
};

export default UsersManagement;