import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/ui/theme-provider";
import { Search, Moon, Sun, Settings, LogOut, Users, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ChatWithParticipants, User } from "@shared/schema";

interface SidebarProps {
  selectedChatId?: string;
  onSelectChat: (chatId: string) => void;
  onShowProfile: () => void;
  currentUser: User;
}

export function Sidebar({ selectedChatId, onSelectChat, onShowProfile, currentUser }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchUsersQuery, setSearchUsersQuery] = useState("");
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: chats = [], isLoading: chatsLoading } = useQuery<ChatWithParticipants[]>({
    queryKey: ["/api/chats"],
    refetchInterval: 5000, // Poll for new messages
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

  const handleLogout = () => {
    window.location.href = "/api/logout";
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
      const otherParticipant = chat.participants.find(p => p.userId !== currentUser.id);
      if (otherParticipant) {
        const name = `${otherParticipant.user.firstName || ""} ${otherParticipant.user.lastName || ""}`.trim();
        return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               otherParticipant.user.username?.toLowerCase().includes(searchQuery.toLowerCase());
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
    if (chat.isGroup) {
      return chat.name || "Group Chat";
    } else {
      const otherParticipant = chat.participants.find(p => p.userId !== currentUser.id);
      if (otherParticipant) {
        return `${otherParticipant.user.firstName || ""} ${otherParticipant.user.lastName || ""}`.trim() || 
               otherParticipant.user.username || 
               "Unknown User";
      }
      return "Direct Message";
    }
  };

  const getChatAvatar = (chat: ChatWithParticipants) => {
    if (chat.isGroup) {
      return chat.imageUrl;
    } else {
      const otherParticipant = chat.participants.find(p => p.userId !== currentUser.id);
      return otherParticipant?.user.profileImageUrl;
    }
  };

  const getChatInitials = (chat: ChatWithParticipants) => {
    const name = getChatName(chat);
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="w-80 bg-white dark:bg-telegram-dark-secondary border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chats</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              data-testid="button-toggle-theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowProfile}
              data-testid="button-show-profile"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-500 hover:text-red-600"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-100 dark:bg-telegram-dark-tertiary border-0"
            data-testid="input-search-messages"
          />
        </div>

        {/* User Search */}
        <div className="mt-3">
          <div className="relative">
            <Plus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search users to start chat..."
              value={searchUsersQuery}
              onChange={(e) => setSearchUsersQuery(e.target.value)}
              className="pl-10 bg-gray-100 dark:bg-telegram-dark-tertiary border-0"
              data-testid="input-search-users"
            />
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-2 bg-white dark:bg-telegram-dark-tertiary rounded-lg border border-gray-200 dark:border-gray-600">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                  onClick={() => createDirectChatMutation.mutate(user.id)}
                  data-testid={`button-start-chat-${user.id}`}
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
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        {chatsLoading ? (
          <div className="p-4 text-center text-gray-500">Loading chats...</div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? "No chats found" : "No chats yet. Start a conversation!"}
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 transition-colors ${
                selectedChatId === chat.id ? "bg-telegram-blue/10 dark:bg-telegram-blue/20" : ""
              }`}
              onClick={() => onSelectChat(chat.id)}
              data-testid={`chat-item-${chat.id}`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={getChatAvatar(chat) || undefined} />
                    <AvatarFallback className={chat.isGroup ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : ""}>
                      {chat.isGroup ? <Users className="w-5 h-5" /> : getChatInitials(chat)}
                    </AvatarFallback>
                  </Avatar>
                  {!chat.isGroup && chat.participants.find(p => p.userId !== currentUser.id)?.user.isOnline && (
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
                        {formatTime(chat.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  
                  {chat.lastMessage && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {chat.lastMessage.senderId === currentUser.id ? "You: " : ""}
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
    </div>
  );
}
