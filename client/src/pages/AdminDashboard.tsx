import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, MessageSquare, Globe, BarChart3, Trash2, Shield, UserCog, LogIn, UserX, Ban, Unlock, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface AdminStats {
  totalUsers: number;
  onlineUsers: number;
  totalChats: number;
  totalMessages: number;
}

interface AdminUser {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'user' | 'admin' | 'moderator';
  isOnline: boolean;
  createdAt: string;
  lastSeen: string;
  isRestricted?: boolean;
  isBanned?: boolean;
  restrictionReason?: string;
  banReason?: string;
  restrictedAt?: string;
  bannedAt?: string;
}

interface AdminChat {
  _id: string;
  name?: string;
  isGroup: boolean;
  isGlobalRoom: boolean;
  participants: string[];
  createdAt: string;
  updatedAt: string;
}

interface AdminMessage {
  _id: string;
  content?: string;
  messageType: string;
  sender: {
    username: string;
    email: string;
  };
  createdAt: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [newRole, setNewRole] = useState<'user' | 'admin' | 'moderator'>('user');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState('');
  const [banReason, setBanReason] = useState('');

  // Check for existing token on component mount
  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        setIsAuthenticated(true);
        toast({ title: 'Success', description: 'Logged in successfully' });
      } else {
        toast({ title: 'Error', description: data.message || 'Login failed', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Login failed', variant: 'destructive' });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    toast({ title: 'Success', description: 'Logged out successfully' });
  };

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: isAuthenticated,
  });

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
    refetchInterval: 60000, // Refresh every minute
    enabled: isAuthenticated,
  });

  // Fetch chats
  const { data: chats, isLoading: chatsLoading } = useQuery<AdminChat[]>({
    queryKey: ['/api/admin/chats'],
    refetchInterval: 60000,
    enabled: isAuthenticated,
  });

  // Fetch messages
  const { data: messages, isLoading: messagesLoading } = useQuery<AdminMessage[]>({
    queryKey: ['/api/admin/messages'],
    refetchInterval: 60000,
    enabled: isAuthenticated,
  });

  // Mutations for admin actions
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest('PUT', `/api/admin/users/${userId}/role`, { role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: 'Success', description: 'User role updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update user role', variant: 'destructive' });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: 'Success', description: 'User deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    },
  });

  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/chats/${chatId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: 'Success', description: 'Chat deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete chat', variant: 'destructive' });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/messages/${messageId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: 'Success', description: 'Message deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete message', variant: 'destructive' });
    },
  });

  // Restrict user mutation
  const restrictUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}/restrict`, { reason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setRestrictionReason('');
      toast({ title: 'Success', description: 'User restricted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to restrict user', variant: 'destructive' });
    },
  });

  // Unrestrict user mutation
  const unrestrictUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}/unrestrict`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: 'Success', description: 'User unrestricted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to unrestrict user', variant: 'destructive' });
    },
  });

  // Ban user mutation
  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}/ban`, { reason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setBanReason('');
      toast({ title: 'Success', description: 'User banned successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to ban user', variant: 'destructive' });
    },
  });

  // Unban user mutation
  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}/unban`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: 'Success', description: 'User unbanned successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to unban user', variant: 'destructive' });
    },
  });

  const handleUpdateRole = () => {
    if (selectedUser && newRole) {
      updateUserRoleMutation.mutate({ userId: selectedUser, role: newRole });
      setSelectedUser('');
    }
  };

  const StatCard = ({ title, value, icon: Icon, description }: { title: string; value: number; icon: any; description: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  // Login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <Shield className="h-6 w-6" />
              <CardTitle className="text-2xl">Admin Login</CardTitle>
            </div>
            <CardDescription>
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@chatgroove.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-admin-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-admin-password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoggingIn}
                data-testid="button-admin-login"
              >
                {isLoggingIn ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </>
                )}
              </Button>
            </form>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                Demo credentials:<br />
                <strong>admin@chatgroove.com / admin123</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ChatGroove Admin
                </h1>
                <p className="text-muted-foreground">Manage your community platform</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="text-sm px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              <Shield className="h-4 w-4 mr-1" />
              Admin Access
            </Badge>
            <Button variant="outline" onClick={handleLogout} className="hover:bg-red-50 hover:border-red-200 hover:text-red-600" data-testid="button-admin-logout">
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats?.totalUsers?.toLocaleString() || 0}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Registered community members</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Online Users</CardTitle>
              <div className="relative">
                <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats?.onlineUsers?.toLocaleString() || 0}</div>
              <p className="text-xs text-green-600 dark:text-green-400">Currently active</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Chats</CardTitle>
              <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats?.totalChats?.toLocaleString() || 0}</div>
              <p className="text-xs text-purple-600 dark:text-purple-400">Active chat rooms</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Messages</CardTitle>
              <Globe className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats?.totalMessages?.toLocaleString() || 0}</div>
              <p className="text-xs text-orange-600 dark:text-orange-400">Messages exchanged</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-slate-800 shadow-sm">
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="chats" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chats
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              <Globe className="h-4 w-4 mr-2" />
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card className="shadow-sm border-l-4 border-l-blue-500">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <div className="flex items-center space-x-2">
                  <UserCog className="h-5 w-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-blue-900 dark:text-blue-100">User Management</CardTitle>
                    <CardDescription className="text-blue-700 dark:text-blue-300">Manage user accounts, roles, and permissions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-md border-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Username</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Email</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Role</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Joined</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((user) => (
                        <TableRow key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">{user.username}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">{user.email}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={user.role === 'admin' ? 'default' : user.role === 'moderator' ? 'secondary' : 'outline'}
                              className={
                                user.role === 'admin' 
                                  ? 'bg-blue-600 text-white' 
                                  : user.role === 'moderator' 
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' 
                                  : 'border-slate-300 text-slate-600'
                              }
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            <Badge variant={user.isOnline ? 'default' : 'secondary'}>
                              {user.isOnline ? 'Online' : 'Offline'}
                            </Badge>
                            {user.isBanned && (
                              <Badge variant="destructive" className="text-xs">
                                <Ban className="h-3 w-3 mr-1" />
                                Banned
                              </Badge>
                            )}
                            {user.isRestricted && !user.isBanned && (
                              <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                                <UserX className="h-3 w-3 mr-1" />
                                Restricted
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {/* Role Management */}
                            <Select value={selectedUser === user._id ? newRole : user.role} onValueChange={(value) => {
                              setSelectedUser(user._id);
                              setNewRole(value as 'user' | 'admin' | 'moderator');
                            }}>
                              <SelectTrigger className="w-24 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="moderator">Mod</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            {selectedUser === user._id && newRole !== user.role && (
                              <Button size="sm" onClick={handleUpdateRole} className="h-8" data-testid={`button-update-role-${user._id}`}>
                                <UserCog className="h-3 w-3" />
                              </Button>
                            )}
                            
                            {/* Restriction Actions */}
                            {!user.isBanned && !user.isRestricted && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-8" data-testid={`button-restrict-user-${user._id}`}>
                                    <UserX className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Restrict User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Restrict {user.username} from certain actions. Provide a reason:
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="py-4">
                                    <Input
                                      placeholder="Reason for restriction..."
                                      value={restrictionReason}
                                      onChange={(e) => setRestrictionReason(e.target.value)}
                                    />
                                  </div>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => restrictUserMutation.mutate({ userId: user._id, reason: restrictionReason })}
                                      disabled={!restrictionReason.trim()}
                                    >
                                      Restrict User
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            
                            {user.isRestricted && !user.isBanned && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8" 
                                onClick={() => unrestrictUserMutation.mutate(user._id)}
                                data-testid={`button-unrestrict-user-${user._id}`}
                              >
                                <Unlock className="h-3 w-3" />
                              </Button>
                            )}
                            
                            {/* Ban Actions */}
                            {!user.isBanned && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm" className="h-8" data-testid={`button-ban-user-${user._id}`}>
                                    <Ban className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Ban User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Ban {user.username} from the platform. Provide a reason:
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="py-4">
                                    <Input
                                      placeholder="Reason for ban..."
                                      value={banReason}
                                      onChange={(e) => setBanReason(e.target.value)}
                                    />
                                  </div>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => banUserMutation.mutate({ userId: user._id, reason: banReason })}
                                      disabled={!banReason.trim()}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Ban User
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            
                            {user.isBanned && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 border-green-500 text-green-600 hover:bg-green-50" 
                                onClick={() => unbanUserMutation.mutate(user._id)}
                                data-testid={`button-unban-user-${user._id}`}
                              >
                                <Unlock className="h-3 w-3" />
                              </Button>
                            )}
                            
                            {/* Delete Action */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="h-8" data-testid={`button-delete-user-${user._id}`}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {user.username}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteUserMutation.mutate(user._id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chat Management</CardTitle>
              <CardDescription>Manage chat rooms and groups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chats?.map((chat) => (
                      <TableRow key={chat._id}>
                        <TableCell className="font-medium">
                          {chat.name || (chat.isGroup ? 'Group Chat' : 'Direct Message')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={chat.isGlobalRoom ? 'default' : chat.isGroup ? 'secondary' : 'outline'}>
                            {chat.isGlobalRoom ? 'Global Room' : chat.isGroup ? 'Group' : 'Direct'}
                          </Badge>
                        </TableCell>
                        <TableCell>{chat.participants.length}</TableCell>
                        <TableCell>{formatDistanceToNow(new Date(chat.createdAt), { addSuffix: true })}</TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" data-testid={`button-delete-chat-${chat._id}`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this chat? All messages will be permanently removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteChatMutation.mutate(chat._id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Message Management</CardTitle>
              <CardDescription>Monitor and moderate messages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Sender</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages?.map((message) => (
                      <TableRow key={message._id}>
                        <TableCell className="max-w-xs truncate">
                          {message.content || `[${message.messageType}]`}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{message.messageType}</Badge>
                        </TableCell>
                        <TableCell>{message.sender.username}</TableCell>
                        <TableCell>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" data-testid={`button-delete-message-${message._id}`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Message</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this message? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMessageMutation.mutate(message._id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}