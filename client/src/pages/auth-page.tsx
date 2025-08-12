import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { loginSchema, registerSchema, type LoginData, type RegisterData } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Mail, Lock, User, ArrowRight, MessageSquare } from "lucide-react";
import { useEffect } from "react";

// Extend Window type for Google OAuth
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { loginMutation, registerMutation, googleAuthMutation, user } = useAuth();

  // Redirect if already logged in (use useEffect to avoid state update during render)
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const onLogin = async (data: LoginData) => {
    try {
      await loginMutation.mutateAsync(data);
      setLocation("/");
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const onRegister = async (data: RegisterData) => {
    try {
      await registerMutation.mutateAsync(data);
      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account.",
      });
      setLocation("/");
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleGoogleAuth = async () => {
    try {
      // Load Google API script if not already loaded
      if (!window.google) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // Initialize Google OAuth
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1066977440073-3nb0oq5qcp70k0gfnb94o6f6c61kmboe.apps.googleusercontent.com',
          callback: (response: any) => {
            googleAuthMutation.mutate(response.credential);
          },
          use_fedcm_for_prompt: true
        });

        // Try one-tap first, fallback to popup if needed
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // If one-tap doesn't work, create a popup
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'fixed';
            tempDiv.style.top = '50%';
            tempDiv.style.left = '50%';
            tempDiv.style.transform = 'translate(-50%, -50%)';
            tempDiv.style.zIndex = '9999';
            document.body.appendChild(tempDiv);
            
            window.google?.accounts.id.renderButton(tempDiv, {
              theme: 'outline',
              size: 'large',
              width: 300
            });

            // Auto-click the button to open popup
            setTimeout(() => {
              const googleButton = tempDiv.querySelector('div[role="button"]') as HTMLElement;
              if (googleButton) {
                googleButton.click();
              }
              // Remove the temp div after a short delay
              setTimeout(() => {
                document.body.removeChild(tempDiv);
              }, 1000);
            }, 100);
          }
        });
      }
      
    } catch (error) {
      console.error('Google OAuth initialization error:', error);
      toast({
        title: "Google Sign-in Error",
        description: "Failed to initialize Google sign-in. Please try again or use email registration.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left side - Hero section */}
        <div className="text-white space-y-8 lg:pr-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                ChatGroove
              </h1>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
              Connect with your world in a whole new way
            </h2>
            <p className="text-xl text-purple-100 max-w-lg">
              Experience modern messaging with real-time chat, global rooms, 
              voice messages, and so much more. Join thousands of users already chatting.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-300" />
              </div>
              <h3 className="font-semibold">Global Chat Rooms</h3>
              <p className="text-sm text-purple-200">Join public rooms on topics you love</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-blue-300" />
              </div>
              <h3 className="font-semibold">Private Messages</h3>
              <p className="text-sm text-purple-200">Secure one-on-one conversations</p>
            </div>
          </div>
        </div>

        {/* Right side - Auth form */}
        <div className="w-full">
          <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">
                {isLogin ? "Welcome back" : "Create account"}
              </CardTitle>
              <CardDescription>
                {isLogin 
                  ? "Sign in to your ChatGroove account" 
                  : "Join ChatGroove and start connecting"
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Google OAuth Button */}
              <Button
                onClick={handleGoogleAuth}
                variant="outline"
                className="w-full h-11"
                disabled={googleAuthMutation.isPending}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Login Form */}
              {isLogin ? (
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...loginForm.register("email")}
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        data-testid="input-email"
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...loginForm.register("password")}
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        data-testid="input-password"
                      />
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign in"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              ) : (
                /* Register Form */
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        {...registerForm.register("firstName")}
                        id="firstName"
                        placeholder="John"
                        data-testid="input-firstname"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        {...registerForm.register("lastName")}
                        id="lastName"
                        placeholder="Doe"
                        data-testid="input-lastname"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...registerForm.register("username")}
                        id="username"
                        placeholder="johndoe"
                        className="pl-10"
                        data-testid="input-username"
                      />
                    </div>
                    {registerForm.formState.errors.username && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.username.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...registerForm.register("email")}
                        id="reg-email"
                        type="email"
                        placeholder="john@example.com"
                        className="pl-10"
                        data-testid="input-register-email"
                      />
                    </div>
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...registerForm.register("password")}
                        id="reg-password"
                        type="password"
                        placeholder="Create a strong password"
                        className="pl-10"
                        data-testid="input-register-password"
                      />
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    disabled={registerMutation.isPending}
                    data-testid="button-register"
                  >
                    {registerMutation.isPending ? "Creating account..." : "Create account"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              )}

              {/* Switch between login/register */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  data-testid="button-switch-auth"
                >
                  {isLogin 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"
                  }
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}