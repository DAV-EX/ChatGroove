import { Button } from "@/components/ui/button";
import { ChatGrooveLogo } from "@/components/ui/chatgroove-logo";
import { Sparkles, Users, Globe, MessageCircle, Video, Mic } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900 dark:to-black" data-testid="landing-page">
      {/* Navigation */}
      <nav className="p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <ChatGrooveLogo size="lg" animated={true} />
          <Button asChild size="lg" className="chatgroove-gradient text-white hover:shadow-lg transition-all">
            <a href="/api/login" data-testid="button-login">
              Sign In
            </a>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-6 py-2 mb-8 shadow-lg">
            <Sparkles className="w-5 h-5 text-yellow-500 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">The Future of Messaging is Here</span>
          </div>
          
          <h1 className="text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
              Connect, Share,
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              Groove Together
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience the next generation of messaging with global rooms, multimedia sharing, 
            video calls, and a beautiful interface that brings people closer together.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Button asChild size="lg" className="chatgroove-gradient text-white px-8 py-4 text-lg hover:shadow-xl transition-all">
              <a href="/api/login" data-testid="button-get-started">
                Get Started Free
              </a>
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-2 border-purple-200 hover:bg-purple-50">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-8 text-center shadow-lg hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Global Rooms</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Join massive public rooms and discover communities around your interests. Connect with thousands worldwide.
            </p>
          </div>
          
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-8 text-center shadow-lg hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">HD Video Calls</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Crystal clear video and audio calls with friends. Share your screen and create memorable moments together.
            </p>
          </div>
          
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-8 text-center shadow-lg hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Voice Messages</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Send voice and video notes instantly. Express yourself with multimedia messages and rich content sharing.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-24 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-12">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">10M+</div>
              <div className="text-gray-600 dark:text-gray-400">Messages Sent Daily</div>
            </div>
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">500K+</div>
              <div className="text-gray-600 dark:text-gray-400">Active Global Rooms</div>
            </div>
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">2M+</div>
              <div className="text-gray-600 dark:text-gray-400">Happy Users</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-24">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Join the Groove?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Join millions of users already connecting on ChatGroove. Sign in with your Replit account and start messaging instantly.
          </p>
          <Button asChild size="lg" className="chatgroove-gradient text-white px-12 py-4 text-lg hover:shadow-xl transition-all">
            <a href="/api/login" data-testid="button-join-now">
              Join ChatGroove Now
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}