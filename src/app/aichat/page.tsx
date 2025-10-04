'use client';

import { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { authClient } from '@/lib/auth-client';
import { useChat } from '@ai-sdk/react';
import {
  Conversation,
  ConversationContent,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectValue,
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
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';

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

export default function AichatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    provider: null,
    apiKey: null,
  });
  const [showSetup, setShowSetup] = useState(false);
  const [setupForm, setSetupForm] = useState({ provider: '', apiKey: '' });
  const [selectedModel, setSelectedModel] = useState('');

  const { messages, sendMessage, status } = useChat();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await authClient.getSession();
        if (session.data?.user) {
          setUser(session.data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Session check failed:', error);
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
      document.cookie = `selectedModel=${selectedModel}; path=/; max-age=86400`; // 24 hours
    }
  }, [selectedModel]);

  useEffect(() => {
    if (status === 'streaming') {
      toast.info('AI is responding...', {
        duration: Infinity,
        id: 'ai-responding',
      });
    } else if (status === 'ready') {
      toast.dismiss('ai-responding');
    }
  }, [status]);

  const fetchApiConfig = async () => {
    try {
      const res = await fetch('/api/user/api-keys');
      if (res.ok) {
        const data = await res.json();
        setApiConfig(data);
        setShowSetup(!data.apiKey);
        // Set default model if not set
        if (data.apiKey && !selectedModel) {
          if (data.provider === 'openai') {
            setSelectedModel('gpt-4o');
          } else if (data.provider === 'openrouter') {
            setSelectedModel('anthropic/claude-3.5-sonnet');
          }
        }
      } else {
        setShowSetup(true);
      }
    } catch (error) {
      console.error('Failed to fetch API config:', error);
      setShowSetup(true);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupForm),
      });
      if (res.ok) {
        await fetchApiConfig();
        // Set a default model based on provider
        if (setupForm.provider === 'openai') {
          setSelectedModel('gpt-4o');
        } else if (setupForm.provider === 'openrouter') {
          setSelectedModel('anthropic/claude-3.5-sonnet');
        }
      } else {
        alert('Failed to save API configuration');
      }
    } catch (error) {
      console.error('Failed to save API config:', error);
      alert('Failed to save API configuration');
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
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
        <SiteHeader user={user} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {showSetup ? (
                <Card className="mx-auto max-w-md">
                  <CardHeader>
                    <CardTitle>Setup AI Chat</CardTitle>
                    <CardDescription>
                      Configure your AI provider and API key to start chatting.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSetupSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="provider">Provider</Label>
                        <Select
                          value={setupForm.provider}
                          onValueChange={value =>
                            setSetupForm({ ...setupForm, provider: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="openrouter">
                              OpenRouter
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                          id="apiKey"
                          type="password"
                          value={setupForm.apiKey}
                          onChange={e =>
                            setSetupForm({
                              ...setupForm,
                              apiKey: e.target.value,
                            })
                          }
                          placeholder="Enter your API key"
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Save Configuration
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <div className="mx-auto w-full max-w-4xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">AI Chat</h1>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowSetup(true)}
                      >
                        Change Provider
                      </Button>
                    </div>
                  </div>
                  <div className="flex min-h-[600px] flex-col space-y-4 rounded-lg border p-4">
                    <Conversation className="flex-1">
                      <ConversationContent>
                        {messages.map(message => (
                          <Message key={message.id} from={message.role}>
                            <MessageContent>
                              <Response>
                                {message.parts.find(p => p.type === 'text')
                                  ?.text || ''}
                              </Response>
                            </MessageContent>
                          </Message>
                        ))}
                      </ConversationContent>
                    </Conversation>
                    <PromptInput
                      onSubmit={message => {
                        if (selectedModel && message.text) {
                          sendMessage({ text: message.text });
                          // Clear the input manually with a timeout to ensure it happens after form processing
                          setTimeout(() => {
                            const textarea = document.querySelector(
                              'textarea[name="message"]',
                            ) as HTMLTextAreaElement;
                            if (textarea) {
                              textarea.value = '';
                            }
                          }, 0);
                        } else if (!selectedModel) {
                          alert('Please select a model first');
                        }
                      }}
                    >
                      <PromptInputBody>
                        <PromptInputTextarea />
                        <PromptInputToolbar>
                          <PromptInputTools>
                            <PromptInputModelSelect
                              value={selectedModel}
                              onValueChange={setSelectedModel}
                            >
                              <PromptInputModelSelectTrigger>
                                <PromptInputModelSelectValue placeholder="Select model" />
                              </PromptInputModelSelectTrigger>
                              <PromptInputModelSelectContent>
                                {apiConfig.provider === 'openai' && (
                                  <>
                                    <PromptInputModelSelectItem value="gpt-4o">
                                      GPT-4o
                                    </PromptInputModelSelectItem>
                                    <PromptInputModelSelectItem value="gpt-4o-mini">
                                      GPT-4o Mini
                                    </PromptInputModelSelectItem>
                                    <PromptInputModelSelectItem value="gpt-4-turbo">
                                      GPT-4 Turbo
                                    </PromptInputModelSelectItem>
                                    <PromptInputModelSelectItem value="gpt-3.5-turbo">
                                      GPT-3.5 Turbo
                                    </PromptInputModelSelectItem>
                                    <PromptInputModelSelectItem value="o3-pro">
                                      GPT o3 Pro
                                    </PromptInputModelSelectItem>
                                  </>
                                )}
                                {apiConfig.provider === 'openrouter' && (
                                  <>
                                    <PromptInputModelSelectItem value="anthropic/claude-3.5-sonnet">
                                      Claude 3.5 Sonnet
                                    </PromptInputModelSelectItem>
                                    <PromptInputModelSelectItem value="anthropic/claude-sonnet-4.5">
                                      Claude Sonnet 4.5
                                    </PromptInputModelSelectItem>
                                    <PromptInputModelSelectItem value="openai/gpt-4o">
                                      GPT-4o
                                    </PromptInputModelSelectItem>
                                    <PromptInputModelSelectItem value="openai/o3-pro">
                                      GPT o3 Pro
                                    </PromptInputModelSelectItem>
                                    <PromptInputModelSelectItem value="x-ai/grok-3">
                                      Grok 3
                                    </PromptInputModelSelectItem>
                                    <PromptInputModelSelectItem value="deepseek/deepseek-v3">
                                      DeepSeek V3
                                    </PromptInputModelSelectItem>
                                    <PromptInputModelSelectItem value="meta-llama/llama-3.1-405b-instruct">
                                      Llama 3.1 405B
                                    </PromptInputModelSelectItem>
                                  </>
                                )}
                              </PromptInputModelSelectContent>
                            </PromptInputModelSelect>
                          </PromptInputTools>
                          <PromptInputSubmit status={status} />
                        </PromptInputToolbar>
                      </PromptInputBody>
                    </PromptInput>
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
