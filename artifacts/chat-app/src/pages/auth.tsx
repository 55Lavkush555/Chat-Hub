import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";

const authSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthFormValues = z.infer<typeof authSchema>;

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: AuthFormValues) => {
    if (isLogin) {
      loginMutation.mutate(
        { data },
        {
          onSuccess: (response) => {
            login(response.token);
            setLocation("/chat");
          },
          onError: (error) => {
            const msg = (error?.data as { error?: string })?.error ?? "Invalid credentials";
            toast({
              title: "Login failed",
              description: msg,
              variant: "destructive",
            });
          },
        }
      );
    } else {
      registerMutation.mutate(
        { data },
        {
          onSuccess: (response) => {
            login(response.token);
            setLocation("/chat");
          },
          onError: (error) => {
            const msg = (error?.data as { error?: string })?.error ?? "Could not create account";
            toast({
              title: "Registration failed",
              description: msg,
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background">
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-primary/5 dark:bg-primary/10">
        <div className="max-w-md w-full space-y-8 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 text-primary">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Relay</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Fast, intimate, and polished real-time communication.
          </p>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-none shadow-xl bg-card">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold">
              {isLogin ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription className="text-base">
              {isLogin 
                ? "Enter your details to access your chats" 
                : "Sign up to start messaging instantly"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="johndoe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                  {isPending ? "Please wait..." : isLogin ? "Sign in" : "Sign up"}
                </Button>
              </form>
            </Form>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="text-primary font-semibold hover:underline"
                onClick={() => {
                  setIsLogin(!isLogin);
                  form.reset();
                }}
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
