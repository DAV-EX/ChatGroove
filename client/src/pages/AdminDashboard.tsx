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
import { Users, MessageSquare, Globe, BarChart3, Trash2, Shield, UserCog, LogIn } from 'lucide-react';
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your ChatGroove application</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-lg px-3 py-1">
            <Shield className="h-4 w-4 mr-1" />
            Admin Access
          </Badge>
          <Button variant="outline" onClick={handleLogout} data-testid="button-admin-logout">
            Logout
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          description="Registered users"
        />
        <StatCard
          title="Online Users"
          value={stats?.onlineUsers || 0}
          icon={Users}
          description="Currently active"
        />
        <StatCard
          title="Total Chats"
          value={stats?.totalChats || 0}
          icon={MessageSquare}
          description="All chat rooms"
        />
        <StatCard
          title="Total Messages"
          value={stats?.totalMessages || 0}
          icon={Globe}
          description="Messages sent"
        />
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="chats">Chats</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : user.role === 'moderator' ? 'secondary' : 'outline'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isOnline ? 'default' : 'secondary'}>
                            {user.isOnline ? 'Online' : 'Offline'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</TableCell>
                        <TableCell className="space-x-2">
                          <Select value={selectedUser === user._id ? newRole : user.role} onValueChange={(value) => {
                            setSelectedUser(user._id);
                            setNewRole(value as 'user' | 'admin' | 'moderator');
                          }}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          {selectedUser === user._id && newRole !== user.role && (
                            <Button size="sm" onClick={handleUpdateRole} data-testid={`button-update-role-${user._id}`}>
                              <UserCog className="h-4 w-4" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" data-testid={`button-delete-user-${user._id}`}>
                                <Trash2 className="h-4 w-4" />
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
  );
}