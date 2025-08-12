import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Send, MessageCircle, Users, Shield } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-telegram-blue/10 to-purple-100 dark:from-telegram-dark dark:to-telegram-dark-secondary">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-24 h-24 bg-telegram-blue rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce-gentle">
            <Send className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome to <span className="text-telegram-blue">TeleClone</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            A modern messaging platform built for seamless communication. 
            Connect with friends, create groups, and share moments instantly.
          </p>
          <Button
            onClick={handleLogin}
            size="lg"
            className="bg-telegram-blue hover:bg-telegram-blue-dark text-white px-8 py-4 text-lg rounded-xl transition-all duration-200 transform hover:scale-105"
            data-testid="button-login"
          >
            Get Started
          </Button>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center p-6 border-0 shadow-lg bg-white/80 dark:bg-telegram-dark-secondary/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-telegram-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-telegram-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-time Messaging</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Send and receive messages instantly with our fast, reliable messaging system.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 border-0 shadow-lg bg-white/80 dark:bg-telegram-dark-secondary/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-telegram-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-telegram-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Group Chats</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create groups and collaborate with multiple people in organized conversations.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 border-0 shadow-lg bg-white/80 dark:bg-telegram-dark-secondary/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-telegram-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-telegram-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your conversations are protected with modern security standards.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to start messaging?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Join TeleClone today and connect with people around the world.
          </p>
          <Button
            onClick={handleLogin}
            size="lg"
            variant="outline"
            className="border-telegram-blue text-telegram-blue hover:bg-telegram-blue hover:text-white px-8 py-4 text-lg rounded-xl transition-all duration-200"
            data-testid="button-login-secondary"
          >
            Sign In Now
          </Button>
        </div>
      </div>
    </div>
  );
}
