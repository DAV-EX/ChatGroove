import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/components/ui/theme-provider";
import { Search, Moon, Sun, Settings, LogOut, Users, Plus, Globe, Hash, Video, Phone, Mic, Headphones, MessageCircle, Compass, UserPlus, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ChatGrooveLogo } from "@/components/ui/chatgroove-logo";
import { z } from "zod";
import type { ChatWithParticipants, User } from "@shared/schema";

const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(50, "Group name must be less than 50 characters"),
  description: z.string().optional(),
});

interface SidebarProps {
  selectedChatId?: string;
  onSelectChat: (chatId: string) => void;
  onShowProfile: () => void;
  currentUser: User;
  onCloseMobile?: () => void;
}

export function Sidebar({ selectedChatId, onSelectChat, onShowProfile, currentUser, onCloseMobile }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchUsersQuery, setSearchUsersQuery] = useState("");
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createGroupForm = useForm<z.infer<typeof createGroupSchema>>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const { data: chats = [], isLoading: chatsLoading } = useQuery<ChatWithParticipants[]>({
    queryKey: ["/api/chats"],
    refetchInterval: 5000, // Poll for new messages
  });

  const { data: globalRooms = [], isLoading: globalRoomsLoading } = useQuery<ChatWithParticipants[]>({
    queryKey: ["/api/chats/global"],
    refetchInterval: 10000, // Poll for global rooms
  });

  const { data: searchResults = [] } = useQuery<User[]>({
    queryKey: ["/api/users/search", { q: searchUsersQuery }],
    enabled: searchUsersQuery.length >= 2,
  });

  const createDirectChatMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      const response = await apiRequest("POST", "/api/chats/direct", { otherUserId });
      return response.json();
    },
    onSuccess: (chat) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      onSelectChat(chat.id);
      setSearchUsersQuery("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to start chat",
        variant: "destructive",
      });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (groupData: z.infer<typeof createGroupSchema>) => {
      const response = await apiRequest("POST", "/api/chats", { 
        name: groupData.name,
        description: groupData.description,
        isGroup: true,
        participants: [] 
      });
      return response.json();
    },
    onSuccess: (chat) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      setShowCreateGroupDialog(false);
      createGroupForm.reset();
      onSelectChat(chat._id);
      toast({
        title: "Group created!",
        description: `${chat.name} has been created successfully.`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    },
  });

  const onCreateGroup = async (data: z.infer<typeof createGroupSchema>) => {
    try {
      await createGroupMutation.mutateAsync(data);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        window.location.href = "/auth";
      } else {
        // Fallback to direct redirect
        window.location.href = "/api/logout";
      }
    } catch (error) {
      // Fallback to direct redirect
      window.location.href = "/api/logout";
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    
    if (chat.isGroup) {
      return chat.name?.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      // For direct messages, search by other participant's name
      const otherParticipant = chat.participants?.find(p => p !== currentUser._id!);
      if (otherParticipant) {
        return true; // Simplify for now, can add proper user lookup later
      }
    }
    return false;
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getChatName = (chat: ChatWithParticipants) => {
    if (chat.isGroup || chat.isGlobalRoom) {
      return chat.name || "Group Chat";
    } else {
      return "Direct Message"; // Simplify for now
    }
  };

  const getChatAvatar = (chat: ChatWithParticipants) => {
    return chat.imageUrl; // Simplify for now
  };

  const getChatInitials = (chat: ChatWithParticipants) => {
    const name = getChatName(chat);
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black border-r border-purple-200 dark:border-purple-800 flex flex-col shadow-xl">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-purple-200 dark:border-purple-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div className="flex items-center space-x-3 lg:space-x-4">
            <ChatGrooveLogo size="md" animated={true} />
            <Avatar className="h-8 w-8 lg:h-10 lg:w-10 cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all ring-offset-2" onClick={onShowProfile}>
              <AvatarImage src={currentUser.profileImageUrl || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold text-sm lg:text-base">
                {currentUser.firstName?.[0] || currentUser.email?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex items-center space-x-1">
            {/* Mobile Close Button */}
            {onCloseMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onCloseMobile}
                className="lg:hidden hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-600 dark:text-purple-400"
              >
                ×
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-600 dark:text-purple-400"
              data-testid="button-toggle-theme"
            >
              {theme === "dark" ? <Sun className="h-3 w-3 lg:h-4 lg:w-4" /> : <Moon className="h-3 w-3 lg:h-4 lg:w-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout} 
              className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
              data-testid="button-logout"
            >
              <LogOut className="h-3 w-3 lg:h-4 lg:w-4" />
            </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search chats and rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-purple-50 dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder:text-purple-400"
            data-testid="input-search-messages"
          />
        </div>

        {/* User Search */}
        <div className="mt-4">
          <div className="relative">
            <UserPlus className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search users to start chat..."
              value={searchUsersQuery}
              onChange={(e) => setSearchUsersQuery(e.target.value)}
              className="pl-12 bg-green-50 dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder:text-green-500"
              data-testid="input-search-users"
            />
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-2 bg-white dark:bg-telegram-dark-tertiary rounded-lg border border-gray-200 dark:border-gray-600">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                  onClick={() => createDirectChatMutation.mutate(user._id!)}
                  data-testid={`button-start-chat-${user._id}`}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {`${user.firstName || ""} ${user.lastName || ""}`.trim().split(" ").map(n => n[0]).join("").toUpperCase() || user.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Unknown User"}
                      </p>
                      {user.username && (
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl border border-purple-200 dark:border-purple-800">
          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2 text-center">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center space-x-1 text-xs bg-white/70 dark:bg-gray-800/70 hover:bg-purple-100 dark:hover:bg-purple-900 border-purple-200 dark:border-purple-700"
                  data-testid="button-create-group"
                >
                  <Users className="w-3 h-3" />
                  <span>New Group</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Group Chat</DialogTitle>
                </DialogHeader>
                <Form {...createGroupForm}>
                  <form onSubmit={createGroupForm.handleSubmit((data) => createGroupMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={createGroupForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter group name..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createGroupForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter group description..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={createGroupMutation.isPending}>
                      {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onShowProfile}
              className="flex items-center space-x-1 text-xs bg-white/70 dark:bg-gray-800/70 hover:bg-green-100 dark:hover:bg-green-900 border-green-200 dark:border-green-700"
              data-testid="button-profile-settings"
            >
              <Settings className="w-3 h-3" />
              <span>Profile</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs for Chats and Global Rooms */}
      <Tabs defaultValue="chats" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mx-4 mb-4 bg-white dark:bg-gray-800 rounded-2xl p-1 shadow-lg border border-purple-100 dark:border-purple-800">
          <TabsTrigger value="chats" className="flex items-center space-x-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
            <MessageCircle className="w-4 h-4" />
            <span className="font-medium">Chats</span>
          </TabsTrigger>
          <TabsTrigger value="global" className="flex items-center space-x-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
            <Compass className="w-4 h-4" />
            <span className="font-medium">Discover</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center space-x-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">
            <Users className="w-4 h-4" />
            <span className="font-medium">Groups</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chats" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            {chatsLoading ? (
              <div className="p-4 text-center text-gray-500">Loading chats...</div>
            ) : filteredChats.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? "No chats found" : "No chats yet. Start a conversation!"}
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat._id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 transition-colors ${
                    selectedChatId === chat._id ? "bg-telegram-blue/10 dark:bg-telegram-blue/20" : ""
                  }`}
                  onClick={() => onSelectChat(chat._id!)}
                  data-testid={`chat-item-${chat._id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={getChatAvatar(chat) || undefined} />
                        <AvatarFallback className={chat.isGroup ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : ""}>
                          {chat.isGroup ? <Users className="w-5 h-5" /> : getChatInitials(chat)}
                        </AvatarFallback>
                      </Avatar>
                      {!chat.isGroup && !chat.isGlobalRoom && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-telegram-dark-secondary" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {getChatName(chat)}
                        </h3>
                        {chat.lastMessage && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(new Date(chat.lastMessage.createdAt!).toISOString())}
                          </span>
                        )}
                      </div>
                      
                      {chat.lastMessage && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {chat.lastMessage.senderId === currentUser._id ? "You: " : ""}
                          {chat.lastMessage.content || (chat.lastMessage.messageType === "image" ? "📷 Image" : "📎 File")}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center space-x-1">
                          {chat.isGroup && (
                            <span className="text-xs text-gray-500">
                              {chat.participants.length} members
                            </span>
                          )}
                        </div>
                        {chat.unreadCount && chat.unreadCount > 0 && (
                          <Badge className="bg-telegram-blue text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center">
                            {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="global" className="flex-1 mt-0">
          <div className="p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold text-gray-800 dark:text-white">Discover Global Rooms</h3>
            </div>
          </div>
          <ScrollArea className="h-full px-2">
            {globalRoomsLoading ? (
              <div className="p-4 text-center text-gray-500">Loading global rooms...</div>
            ) : globalRooms.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No global rooms available
              </div>
            ) : (
              <div className="space-y-2">
                {globalRooms.map((room) => (
                  <div
                    key={room._id}
                    className={`mx-2 p-4 rounded-2xl cursor-pointer transition-all hover:shadow-lg border ${
                      selectedChatId === room._id 
                        ? "bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 border-green-300 dark:border-green-600 shadow-md" 
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600"
                    }`}
                    onClick={() => onSelectChat(room._id!)}
                    data-testid={`global-room-${room._id}`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <Avatar className="w-14 h-14 border-2 border-white dark:border-gray-700 shadow-lg">
                          <AvatarImage src={room.imageUrl || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 text-white text-lg font-bold">
                            {room.name?.includes('🌍') ? '🌍' :
                             room.name?.includes('🎮') ? '🎮' :
                             room.name?.includes('🎵') ? '🎵' :
                             room.name?.includes('💼') ? '💼' :
                             room.name?.includes('🎨') ? '🎨' :
                             room.name?.includes('🍔') ? '🍔' :
                             <Hash className="w-7 h-7" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-gray-900 dark:text-white truncate text-lg">
                            {room.name}
                          </h3>
                          <Badge variant="outline" className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700 font-medium">
                            {room.category}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {room.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                              👥 {room.participants?.length || 0} members
                            </span>
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                              🟢 Active
                            </span>
                          </div>
                          {room.unreadCount && room.unreadCount > 0 && (
                            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs min-w-[1.5rem] h-6 flex items-center justify-center animate-pulse">
                              {room.unreadCount > 99 ? "99+" : room.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="groups" className="flex-1 mt-0">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-gray-800 dark:text-white">Your Groups</h3>
              </div>
              <Button size="sm" variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50" onClick={() => setShowCreateGroupDialog(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            </div>
          </div>
          <ScrollArea className="h-full px-2">
            {filteredChats.filter(chat => chat.isGroup && !chat.isGlobalRoom).length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">No groups yet</p>
                <p className="text-xs text-gray-400 mt-1">Create or join groups to get started</p>
              </div>
            ) : (
              <div className="space-y-1 pb-4">
                {filteredChats
                  .filter(chat => chat.isGroup && !chat.isGlobalRoom)
                  .map((group) => (
                  <div
                    key={group._id}
                    onClick={() => onSelectChat(group._id!)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedChatId === group._id
                        ? "bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={group.imageUrl} />
                          <AvatarFallback className="bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold">
                            <Users className="w-6 h-6" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {group.name}
                          </h3>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            👥 {group.participants?.length || 0} members
                          </p>
                          {group.unreadCount && group.unreadCount > 0 && (
                            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs min-w-[1.5rem] h-6 flex items-center justify-center">
                              {group.unreadCount > 99 ? "99+" : group.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Create Group Dialog */}
      <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <Form {...createGroupForm}>
            <form onSubmit={createGroupForm.handleSubmit(onCreateGroup)} className="space-y-4">
              <FormField
                control={createGroupForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter group name..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createGroupForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What's this group about?"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateGroupDialog(false)}
                  disabled={createGroupMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createGroupMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
