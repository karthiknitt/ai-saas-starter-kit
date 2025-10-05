'use client';

import { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { authClient } from '@/lib/auth-client';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageAvatar,
} from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputModelSelect,
} from '@/components/ai-elements/prompt-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Key,
  Zap,
  Shield,
  ExternalLink,
  Copy,
  CheckCheck,
  MessageSquare,
  Bot,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const setupFormSchema = z
  .object({
    provider: z.string().min(1, 'Please select an AI provider'),
    apiKey: z.string().min(1, 'API key is required'),
  })
  .refine(
    data => {
      if (data.provider === 'openai') {
        return /^sk(?:-proj|-svcacct)?-[a-zA-Z0-9_-]{20,}$/.test(data.apiKey);
      } else if (data.provider === 'openrouter') {
        return /^sk-or-v1-[a-f0-9]{64}$/.test(data.apiKey);
      }
      return false;
    },
    {
      message: 'Please enter a valid API key for the selected provider',
      path: ['apiKey'],
    },
  );

type SetupFormValues = z.infer<typeof setupFormSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
}

interface ApiConfig {
  provider: string | null;
  apiKey: string | null;
}

interface Model {
  id: string;
  name: string;
  provider: string;
  contextLength?: number;
  description?: string;
}

export default function AichatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    provider: null,
    apiKey: null,
  });
  const [showSetup, setShowSetup] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [models, setModels] = useState<Model[]>([]);

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupFormSchema),
    defaultValues: {
      provider: '',
      apiKey: '',
    },
  });

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ messages }) => {
        // Convert messages to the format expected by the API
        return {
          body: {
            messages: messages.map(msg => ({
              role: msg.role,
              content:
                msg.parts
                  ?.map(p => (p.type === 'text' ? p.text : ''))
                  .join('') || '',
            })),
            model: selectedModel,
          },
        };
      },
    }),
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await authClient.getSession();
        if (session.data?.user) {
          setUser(session.data.user);
        } else {
          setUser(null);
        }
      } catch (_error) {
        console.error('Session check failed:', _error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (user) {
      fetchApiConfig();
    }
  }, [user]);

  useEffect(() => {
    if (selectedModel) {
      document.cookie = `selectedModel=${selectedModel}; path=/; max-age=86400`;
    }
  }, [selectedModel]);

  useEffect(() => {
    if (status === 'streaming') {
      toast.info('AI is thinking...', {
        duration: Infinity,
        id: 'ai-responding',
      });
    } else {
      toast.dismiss('ai-responding');
    }
  }, [status]);

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/models');
      if (res.ok) {
        const data = await res.json();
        setModels(data.models || []);

        // Set default model if none selected
        if (!selectedModel && data.models.length > 0) {
          setSelectedModel(data.models[0].id);
        }
      } else {
        toast.error('Failed to load models');
      }
    } catch (_error) {
      console.error('Failed to fetch models:', _error);
      toast.error('Failed to load models');
    }
  };

  const fetchApiConfig = async () => {
    try {
      const res = await fetch('/api/user/api-keys');
      if (res.ok) {
        const data = await res.json();
        setApiConfig(data);
        setShowSetup(!data.apiKey);
        if (data.apiKey) {
          // Fetch available models
          await fetchModels();
        }
      } else {
        setShowSetup(true);
      }
    } catch (_error) {
      console.error('Failed to fetch API config:', _error);
      setShowSetup(true);
    }
  };

  const handleSetupSubmit = async (values: SetupFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        toast.success('AI provider configured successfully!');
        await fetchApiConfig();
        form.reset();
        setShowSetup(false);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to save API configuration');
      }
    } catch (_error) {
      console.error('Failed to save API config:', _error);
      toast.error('Network error. Please check your connection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    toast.success('Chat cleared');
  };

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast.success('Message copied to clipboard');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {
      toast.error('Failed to copy message');
    }
  };

  const handleSendMessage = (message: { text?: string }) => {
    if (!selectedModel) {
      toast.error('Please select a model first');
      return;
    }
    if (!message.text?.trim()) {
      toast.error('Please enter a message');
      return;
    }
    sendMessage({ text: message.text });
    // Clear input after sending
    setInput('');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader user={user} pageTitle="AI Chat" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {showSetup ? (
                <Card className="mx-auto w-full max-w-lg">
                  <CardHeader className="text-center">
                    <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                      <Zap className="text-primary h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl">Setup AI Chat</CardTitle>
                    <CardDescription className="text-base">
                      Connect your AI provider to start having intelligent
                      conversations. Your API keys are securely encrypted and
                      stored.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(handleSetupSubmit)}
                        className="space-y-6"
                      >
                        <FormField
                          control={form.control}
                          name="provider"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-medium">
                                AI Provider
                              </FormLabel>
                              <FormDescription>
                                Choose your preferred AI service provider
                              </FormDescription>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Select your AI provider" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="openai">
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-6 w-6 items-center justify-center rounded bg-green-100 dark:bg-green-900">
                                        <span className="text-xs font-bold text-green-700 dark:text-green-300">
                                          O
                                        </span>
                                      </div>
                                      OpenAI
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="openrouter">
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 dark:bg-blue-900">
                                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                          OR
                                        </span>
                                      </div>
                                      OpenRouter
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="apiKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-base font-medium">
                                <Key className="h-4 w-4" />
                                API Key
                              </FormLabel>
                              <FormDescription>
                                Your API key is required to access AI services.{' '}
                                <a
                                  href={
                                    form.watch('provider') === 'openai'
                                      ? 'https://platform.openai.com/api-keys'
                                      : 'https://openrouter.ai/keys'
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary inline-flex items-center gap-1 hover:underline"
                                >
                                  Get your key here{' '}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </FormDescription>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="sk-... or sk-or-v1-..."
                                  className="h-12 font-mono text-sm"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Shield className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium">
                                Security Notice
                              </p>
                              <p className="text-muted-foreground text-xs">
                                Your API key is encrypted and stored securely.
                                We never share your keys with third parties.
                              </p>
                            </div>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="h-12 w-full text-base font-medium"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Setting up...
                            </>
                          ) : (
                            <>
                              <Zap className="mr-2 h-4 w-4" />
                              Connect AI Provider
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              ) : (
                <div className="mx-auto w-full max-w-5xl space-y-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                        <MessageSquare className="text-primary h-5 w-5" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold">AI Chat</h1>
                        <p className="text-muted-foreground text-sm">
                          {apiConfig.provider === 'openai'
                            ? 'OpenAI'
                            : 'OpenRouter'}{' '}
                          • {selectedModel || 'No model selected'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSetup(true)}
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Change Provider
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearChat}
                        disabled={messages.length === 0}
                      >
                        Clear Chat
                      </Button>
                    </div>
                  </div>

                  <div className="bg-background flex min-h-[calc(100vh-16rem)] flex-col rounded-lg border shadow-sm">
                    <Conversation className="flex-1">
                      <ConversationContent>
                        {messages.length === 0 ? (
                          <ConversationEmptyState
                            icon={<Bot className="h-12 w-12" />}
                            title="Start a conversation"
                            description="Send a message to begin chatting with AI"
                          />
                        ) : (
                          messages.map(message => {
                          {messages.map(message => {
-                            const content = message.parts
-                              .map(part =>
-                                part.type === 'text' ? part.text : '',
-                              )
                            const content =
                              message.parts?.length
                                ? message.parts
                                    .map(part =>
                                      part.type === 'text' ? part.text : '',
                                    )
                                    .join('')
                                : typeof message.content === 'string'
                                  ? message.content
                                  : '';

                            return (
                              <Message key={message.id} from={message.role}>
                                {message.role === 'assistant' ? (
                                  <div className="bg-primary/10 ring-border flex h-8 w-8 items-center justify-center rounded-full ring-1">
                                    <Bot className="text-primary h-5 w-5" />
                                  </div>
                                ) : (
                                  <MessageAvatar
                                    src={
                                      user?.image || '/api/placeholder/32/32'
                                    }
                                    name={user?.name || 'User'}
                                  />
                                )}
                                <MessageContent variant="flat">
                                  <div className="group relative">
                                    {message.role === 'assistant' ? (
                                      <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown
                                          remarkPlugins={[remarkGfm]}
                                          components={{
                                            /* … */
                                          }}
                                        >
                                          {content}
                                        </ReactMarkdown>
                                      </div>
                                    ) : (
                                      <Response>{content}</Response>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="absolute -top-2 -right-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                                      onClick={() =>
                                        handleCopyMessage(content, message.id)
                                      }
                                    >
                                      {copiedMessageId === message.id ? (
                                        <CheckCheck className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </MessageContent>
                              </Message>
                            );
                          })
                        )}
                      </ConversationContent>
                      <ConversationScrollButton />
                    </Conversation>

                    <div className="bg-muted/30 border-t p-4">
                      <PromptInput onSubmit={handleSendMessage}>
                        <PromptInputBody>
                          <PromptInputTextarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Type your message..."
                            disabled={status === 'streaming' || !selectedModel}
                          />
                          <PromptInputToolbar>
                            <PromptInputTools>
                              <PromptInputModelSelect
                                value={selectedModel}
                                onValueChange={setSelectedModel}
                                models={models}
                                placeholder="Select model"
                              />
                            </PromptInputTools>
                            <PromptInputSubmit status={status} />
                          </PromptInputToolbar>
                        </PromptInputBody>
                      </PromptInput>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
