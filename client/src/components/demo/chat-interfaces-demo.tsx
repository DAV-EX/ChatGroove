import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MessageCircle, 
  Users, 
  Globe, 
  Phone, 
  Video, 
  Info, 
  MoreVertical,
  Send,
  Mic,
  Paperclip,
  Smile,
  Crown,
  Shield
} from "lucide-react";

type ChatType = "global" | "group" | "private" | "discover";

export function ChatInterfacesDemo() {
  const [activeDemo, setActiveDemo] = useState<ChatType>("discover");

  const DemoButton = ({ type, label, icon: Icon }: { type: ChatType; label: string; icon: any }) => (
    <Button
      variant={activeDemo === type ? "default" : "outline"}
      className={`flex items-center space-x-2 ${
        activeDemo === type 
          ? "chatgroove-gradient text-white" 
          : "border-purple-200 text-purple-600 hover:bg-purple-50"
      }`}
      onClick={() => setActiveDemo(type)}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </Button>
  );

  const MessageBubble = ({ 
    message, 
    isOwn, 
    sender, 
    time 
  }: { 
    message: string; 
    isOwn: boolean; 
    sender?: { name: string; avatar?: string; role?: string }; 
    time: string 
  }) => (
    <div className={`flex items-end space-x-2 ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isOwn && (
        <Avatar className="h-8 w-8 mb-1">
          <AvatarImage src={sender?.avatar} />
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm">
            {sender?.name[0] || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-xs`}>
        {!isOwn && (
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {sender?.name}
            </span>
            {sender?.role && (
              <Badge variant="outline" className="text-xs h-4 px-1">
                {sender.role === 'admin' ? <Crown className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
              </Badge>
            )}
          </div>
        )}
        
        <div
          className={`rounded-2xl px-4 py-2 max-w-full break-words shadow-sm ${
            isOwn
              ? 'chatgroove-gradient text-white rounded-br-md'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md'
          }`}
        >
          <p className="text-sm">{message}</p>
        </div>
        
        <span className="text-xs text-gray-400 mt-1 px-2">{time}</span>
      </div>
    </div>
  );

  const ChatHeader = ({ 
    title, 
    subtitle, 
    avatar, 
    type, 
    memberCount 
  }: { 
    title: string; 
    subtitle: string; 
    avatar?: string; 
    type: ChatType; 
    memberCount?: number;
  }) => (
    <div className="p-4 border-b border-purple-200 dark:border-purple-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-700 shadow-lg">
              <AvatarImage src={avatar} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white font-bold">
                {title[0]}
              </AvatarFallback>
            </Avatar>
            {type === "private" && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
            )}
          </div>
          
          <div>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">{title}</h2>
            <div className="flex items-center space-x-2">
              {type === "global" && (
                <>
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300">
                    Global Room
                  </Badge>
                  <span className="text-sm text-gray-500">{memberCount} members</span>
                </>
              )}
              {type === "group" && (
                <span className="text-sm text-gray-500">{memberCount} members</span>
              )}
              {type === "private" && (
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">🟢 Online</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {type === "private" && (
            <>
              <Button variant="ghost" size="icon" className="text-green-600">
                <Phone className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-blue-600">
                <Video className="w-5 h-5" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="text-purple-600">
            <Info className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-600">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  const MessageInput = ({ placeholder }: { placeholder: string }) => (
    <div className="p-4 border-t border-purple-200 dark:border-purple-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="icon" className="text-purple-600">
          <Paperclip className="w-5 h-5" />
        </Button>
        <div className="flex-1 relative">
          <Input
            placeholder={placeholder}
            className="rounded-full border-purple-200 dark:border-purple-700 focus:ring-purple-500 pr-12"
          />
          <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 text-purple-600">
            <Smile className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="text-orange-600">
          <Mic className="w-5 h-5" />
        </Button>
        <Button size="icon" className="chatgroove-gradient text-white rounded-full">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900 dark:to-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-4">
            ChatGroove Interface Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            See how different types of conversations look in ChatGroove
          </p>
        </div>

        {/* Demo Type Selector */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <DemoButton type="discover" label="Global Room Discovery" icon={Globe} />
          <DemoButton type="global" label="Global Room Chat" icon={Globe} />
          <DemoButton type="group" label="Group Chat" icon={Users} />
          <DemoButton type="private" label="Private Chat" icon={MessageCircle} />
        </div>

        {/* Demo Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {activeDemo === "discover" && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
                Global Room Discovery
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    name: "🌍 General Discussion",
                    members: 15420,
                    description: "Talk about anything and everything",
                    category: "General",
                    gradient: "from-blue-500 to-purple-600"
                  },
                  {
                    name: "💻 Tech Talk",
                    members: 8934,
                    description: "Latest in technology and programming",
                    category: "Technology",
                    gradient: "from-green-500 to-blue-600"
                  },
                  {
                    name: "🎮 Gaming Zone",
                    members: 12678,
                    description: "Discuss games and find teammates",
                    category: "Gaming",
                    gradient: "from-purple-500 to-pink-600"
                  },
                  {
                    name: "🎵 Music Lovers",
                    members: 6542,
                    description: "Share and discover music",
                    category: "Music",
                    gradient: "from-orange-500 to-red-600"
                  },
                  {
                    name: "📚 Book Club",
                    members: 3421,
                    description: "Discuss books and share recommendations",
                    category: "Literature",
                    gradient: "from-teal-500 to-cyan-600"
                  },
                  {
                    name: "🏆 Sports Central",
                    members: 9876,
                    description: "All things sports and competitions",
                    category: "Sports",
                    gradient: "from-red-500 to-orange-600"
                  }
                ].map((room, index) => (
                  <Card key={index} className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 overflow-hidden">
                    <CardHeader className={`bg-gradient-to-br ${room.gradient} text-white p-4`}>
                      <CardTitle className="text-lg font-bold">{room.name}</CardTitle>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-white/20 text-white border-0">
                          {room.category}
                        </Badge>
                        <span className="text-sm font-medium">
                          {room.members.toLocaleString()} members
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        {room.description}
                      </p>
                      <Button className="w-full chatgroove-gradient text-white">
                        Join Room
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeDemo === "global" && (
            <div className="flex flex-col h-[600px]">
              <ChatHeader
                title="🌍 General Discussion"
                subtitle="Global Room"
                type="global"
                memberCount={15420}
              />
              
              <ScrollArea className="flex-1 p-4 bg-gradient-to-br from-white via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-black">
                <div className="space-y-2 max-w-4xl mx-auto">
                  <div className="text-center py-4">
                    <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                      Welcome to General Discussion! 15,420 members online
                    </Badge>
                  </div>
                  
                  <MessageBubble
                    message="Hey everyone! How's your day going? 👋"
                    isOwn={false}
                    sender={{ name: "Alex Chen", role: "admin" }}
                    time="2:30 PM"
                  />
                  
                  <MessageBubble
                    message="Great! Just finished a coding project 🚀"
                    isOwn={false}
                    sender={{ name: "Sarah Miller" }}
                    time="2:31 PM"
                  />
                  
                  <MessageBubble
                    message="That's awesome! What kind of project?"
                    isOwn={true}
                    sender={{ name: "You" }}
                    time="2:32 PM"
                  />
                  
                  <MessageBubble
                    message="A ChatGroove clone actually! Love the UI design here 😄"
                    isOwn={false}
                    sender={{ name: "Sarah Miller" }}
                    time="2:33 PM"
                  />
                  
                  <MessageBubble
                    message="Anyone want to collaborate on an open source project?"
                    isOwn={false}
                    sender={{ name: "DevMaster", role: "moderator" }}
                    time="2:35 PM"
                  />
                </div>
              </ScrollArea>
              
              <MessageInput placeholder="Message General Discussion..." />
            </div>
          )}

          {activeDemo === "group" && (
            <div className="flex flex-col h-[600px]">
              <ChatHeader
                title="Team Alpha"
                subtitle="Group Chat"
                type="group"
                memberCount={5}
              />
              
              <ScrollArea className="flex-1 p-4 bg-gradient-to-br from-white via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-black">
                <div className="space-y-2 max-w-4xl mx-auto">
                  <div className="text-center py-4">
                    <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      Team Alpha Project Group
                    </Badge>
                  </div>
                  
                  <MessageBubble
                    message="Meeting tomorrow at 10 AM confirmed?"
                    isOwn={false}
                    sender={{ name: "John Smith" }}
                    time="1:20 PM"
                  />
                  
                  <MessageBubble
                    message="Yes, I'll be there! 👍"
                    isOwn={true}
                    sender={{ name: "You" }}
                    time="1:21 PM"
                  />
                  
                  <MessageBubble
                    message="Perfect. I've prepared the presentation slides"
                    isOwn={false}
                    sender={{ name: "Emma Wilson" }}
                    time="1:22 PM"
                  />
                  
                  <MessageBubble
                    message="Great work Emma! Can you share them in advance?"
                    isOwn={false}
                    sender={{ name: "Mike Johnson" }}
                    time="1:25 PM"
                  />
                  
                  <MessageBubble
                    message="Already uploaded to our shared drive 📁"
                    isOwn={false}
                    sender={{ name: "Emma Wilson" }}
                    time="1:26 PM"
                  />
                </div>
              </ScrollArea>
              
              <MessageInput placeholder="Message Team Alpha..." />
            </div>
          )}

          {activeDemo === "private" && (
            <div className="flex flex-col h-[600px]">
              <ChatHeader
                title="Jessica Thompson"
                subtitle="Online"
                type="private"
                avatar="/placeholder-avatar.jpg"
              />
              
              <ScrollArea className="flex-1 p-4 bg-gradient-to-br from-white via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-black">
                <div className="space-y-2 max-w-4xl mx-auto">
                  <MessageBubble
                    message="Hey! How are you doing? 😊"
                    isOwn={false}
                    sender={{ name: "Jessica" }}
                    time="3:15 PM"
                  />
                  
                  <MessageBubble
                    message="I'm doing great! Just saw your latest project, it looks amazing! 🔥"
                    isOwn={true}
                    sender={{ name: "You" }}
                    time="3:16 PM"
                  />
                  
                  <MessageBubble
                    message="Thank you so much! That means a lot coming from you ❤️"
                    isOwn={false}
                    sender={{ name: "Jessica" }}
                    time="3:17 PM"
                  />
                  
                  <MessageBubble
                    message="Want to grab coffee sometime this week? ☕"
                    isOwn={true}
                    sender={{ name: "You" }}
                    time="3:18 PM"
                  />
                  
                  <MessageBubble
                    message="Absolutely! How about Thursday afternoon?"
                    isOwn={false}
                    sender={{ name: "Jessica" }}
                    time="3:19 PM"
                  />
                  
                  <MessageBubble
                    message="Perfect! I know a great place downtown 🏙️"
                    isOwn={true}
                    sender={{ name: "You" }}
                    time="3:20 PM"
                  />
                </div>
              </ScrollArea>
              
              <MessageInput placeholder="Message Jessica..." />
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 grid md:grid-cols-4 gap-6">
          <div className="text-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Global Rooms</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Massive public communities with thousands of members
            </p>
          </div>
          
          <div className="text-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Group Chats</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Private team discussions with role management
            </p>
          </div>
          
          <div className="text-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Private Chats</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              One-on-one conversations with video/audio calls
            </p>
          </div>
          
          <div className="text-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Video className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Rich Media</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Voice notes, video messages, and file sharing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}