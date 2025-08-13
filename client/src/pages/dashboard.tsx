import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle, 
  Users, 
  Bell, 
  Search, 
  Plus, 
  Home, 
  User, 
  Settings, 
  LogOut,
  Send,
  Heart,
  Share,
  MessageSquare,
  MoreHorizontal,
  Camera,
  Image as ImageIcon,
  Video,
  Smile,
  ThumbsUp,
  UserPlus,
  Globe
} from "lucide-react";
import type { ChatWithParticipants, UserProfile, MessageWithSender } from "@shared/schema";

export default function Dashboard() {
  const [selectedSection, setSelectedSection] = useState("feed");
  const [selectedChatId, setSelectedChatId] = useState<string>();
  const [newPostContent, setNewPostContent] = useState("");
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's chats
  const { data: userChats = [] } = useQuery<ChatWithParticipants[]>({
    queryKey: ["/api/chats"],
    enabled: !!user,
  });

  // Fetch global rooms
  const { data: globalRooms = [] } = useQuery<ChatWithParticipants[]>({
    queryKey: ["/api/chats/global"],
    enabled: !!user,
  });

  // Fetch recent users for friend suggestions
  const { data: suggestedFriends = [] } = useQuery<UserProfile[]>({
    queryKey: ["/api/users/suggested"],
    enabled: !!user,
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("/api/posts", "POST", { content });
    },
    onSuccess: () => {
      setNewPostContent("");
      toast({
        title: "Post created!",
        description: "Your post has been shared successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Redirect to auth page if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded opacity-75"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading ChatGroove...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  const handleLogout = async () => {
    try {
      await apiRequest("/api/auth/logout", "POST");
      setLocation("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    createPostMutation.mutate(newPostContent.trim());
  };

  const renderNavigation = () => (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-gray-900 dark:text-white">ChatGroove</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Social Messaging</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user.profileImageUrl || ""} />
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {user.firstName?.[0] || user.username?.[0] || user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {user.firstName ? `${user.firstName} ${user.lastName}` : user.username}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => setSelectedSection("feed")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                selectedSection === "feed"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Home className="w-5 h-5" />
              <span>News Feed</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setSelectedSection("messages")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                selectedSection === "messages"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              <span>Messages</span>
              {userChats.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {userChats.length}
                </Badge>
              )}
            </button>
          </li>
          <li>
            <button
              onClick={() => setSelectedSection("discover")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                selectedSection === "discover"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Globe className="w-5 h-5" />
              <span>Discover</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setSelectedSection("friends")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                selectedSection === "friends"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Friends</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setSelectedSection("notifications")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                selectedSection === "notifications"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setSelectedSection("profile")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                selectedSection === "profile"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setSelectedSection("settings")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                selectedSection === "settings"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Button onClick={handleLogout} variant="outline" className="w-full">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );

  const renderFeed = () => (
    <div className="flex-1 max-w-2xl mx-auto p-6 space-y-6">
      {/* Create Post */}
      <Card>
        <CardHeader>
          <CardTitle>Share something with your friends</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <Avatar>
              <AvatarImage src={user.profileImageUrl || ""} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {user.firstName?.[0] || user.username?.[0] || user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Camera className="w-4 h-4 mr-2" />
                Photo
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="w-4 h-4 mr-2" />
                Video
              </Button>
              <Button variant="ghost" size="sm">
                <Smile className="w-4 h-4 mr-2" />
                Emoji
              </Button>
            </div>
            <Button 
              onClick={handleCreatePost}
              disabled={!newPostContent.trim() || createPostMutation.isPending}
            >
              {createPostMutation.isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sample Posts */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-3 mb-4">
            <Avatar>
              <AvatarFallback className="bg-green-100 text-green-600">CG</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">ChatGroove Team</h3>
                <Badge variant="secondary">Official</Badge>
              </div>
              <p className="text-sm text-gray-500">2 hours ago</p>
            </div>
          </div>
          <p className="mb-4">
            Welcome to ChatGroove! 🎉 Connect with friends, join global rooms, and enjoy seamless messaging with a modern interface.
          </p>
          <div className="flex items-center space-x-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" size="sm">
              <ThumbsUp className="w-4 h-4 mr-2" />
              Like
            </Button>
            <Button variant="ghost" size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Comment
            </Button>
            <Button variant="ghost" size="sm">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMessages = () => (
    <div className="flex-1 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Chats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Your Conversations
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userChats.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No conversations yet. Start chatting with someone!</p>
            ) : (
              <div className="space-y-3">
                {userChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => setSelectedChatId(chat.id)}
                  >
                    <Avatar>
                      <AvatarImage src={chat.imageUrl || ""} />
                      <AvatarFallback>
                        {chat.name?.[0] || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{chat.name || "Unnamed Chat"}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {chat.lastMessage?.content || "No messages yet"}
                      </p>
                    </div>
                    {chat.unreadCount && chat.unreadCount > 0 && (
                      <Badge className="bg-blue-600">{chat.unreadCount}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Global Rooms */}
        <Card>
          <CardHeader>
            <CardTitle>Global Chat Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {globalRooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => setSelectedChatId(room.id)}
                >
                  <Avatar>
                    <AvatarFallback className="bg-purple-100 text-purple-600">
                      {room.name?.[0] || "R"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{room.name}</p>
                    <p className="text-sm text-gray-500 truncate">{room.description}</p>
                  </div>
                  <Badge variant="outline">{room.category}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDiscover = () => (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Discover New Communities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {globalRooms.map((room) => (
                <Card key={room.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {room.name?.[0] || "R"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{room.name}</h3>
                        <Badge variant="outline" className="text-xs">{room.category}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {room.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {room.participantDetails?.length || 0} members
                      </span>
                      <Button size="sm" onClick={() => setSelectedChatId(room.id)}>
                        Join
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderFriends = () => (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Friend Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestedFriends.map((friend) => (
                <Card key={friend.id}>
                  <CardContent className="p-4 text-center">
                    <Avatar className="w-16 h-16 mx-auto mb-3">
                      <AvatarImage src={friend.profileImageUrl || ""} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {friend.firstName?.[0] || friend.username?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold">
                      {friend.firstName ? `${friend.firstName} ${friend.lastName}` : friend.username}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">@{friend.username}</p>
                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1">
                        <UserPlus className="w-4 h-4 mr-1" />
                        Add Friend
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="flex-1 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.profileImageUrl || ""} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                  {user.firstName?.[0] || user.username?.[0] || user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">
                  {user.firstName ? `${user.firstName} ${user.lastName}` : user.username}
                </h2>
                <p className="text-gray-500">@{user.username}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <Button>
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{userChats.length}</p>
                <p className="text-sm text-gray-500">Conversations</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{user.isOnline ? "Online" : "Offline"}</p>
                <p className="text-sm text-gray-500">Status</p>
              </div>
            </div>

            {user.bio && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Bio</h3>
                  <p className="text-gray-700 dark:text-gray-300">{user.bio}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (selectedSection) {
      case "feed":
        return renderFeed();
      case "messages":
        return renderMessages();
      case "discover":
        return renderDiscover();
      case "friends":
        return renderFriends();
      case "notifications":
        return (
          <div className="flex-1 p-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">No new notifications</p>
              </CardContent>
            </Card>
          </div>
        );
      case "profile":
        return renderProfile();
      case "settings":
        return (
          <div className="flex-1 p-6">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">Settings panel coming soon</p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return renderFeed();
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {renderNavigation()}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}