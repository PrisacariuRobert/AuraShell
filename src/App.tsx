import { useState, useRef, useEffect, KeyboardEvent } from "react";
import logo from './logo.svg';
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import "./App.css";

interface ErrorAnalysis {
  error_type: string;
  explanation: string;
  suggested_fix: string;
  confidence: string;
}

interface SearchSource {
  title: string;
  url: string;
  snippet: string;
}

interface SearchResult {
  answer: string;
  sources: SearchSource[];
}

interface ChatMessage {
  id: string;
  type: "ai" | "user" | "search" | "system";
  content: string;
  timestamp: Date;
  command?: string;
  output?: string;
  needsConfirmation?: boolean;
  error?: string;
  errorAnalysis?: ErrorAnalysis;
  suggestedFix?: string;
  searchResult?: SearchResult;
  groundingMetadata?: GroundingMetadata;
  path?: string;
}

interface Session {
  id: number;
  name: string;
  messages: ChatMessage[];
  commandHistory: string[];
  currentDirectory: string;
}

interface GroundingMetadata {
  webSearchQueries?: string[];
  groundingChunks?: GroundingChunk[];
  groundingSupports?: GroundingSupport[];
}

interface GroundingChunk {
  web?: {
    uri: string;
    title?: string;
  };
}

interface GroundingSupport {
  segment?: {
    startIndex: number;
    endIndex: number;
    text: string;
  };
  groundingChunkIndices?: number[];
}

interface ExecutionResponse {
  output: string;
  error: string | null;
  exit_code: number;
  command_run: string;
  needs_confirmation: boolean;
  was_natural_language: boolean;
  current_dir: string;
  error_analysis: ErrorAnalysis | null;
  suggested_fix: string | null;
  grounding_metadata?: GroundingMetadata;
}

interface SystemStats {
  cpu_usage: number;
  memory_used: number;
  memory_total: number;
  memory_percent: number;
  disk_read: number;
  disk_write: number;
  uptime: number;
}

interface OsInfo {
  os_type: string;
  os_name: string;
  package_manager: string;
  shell: string;
}

function App() {
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: 1,
      name: "Session 1",
      messages: [
        {
          id: "welcome-1",
          type: "ai",
          content:
            "Welcome to AuraShell! Describe what you want to do in plain English, and I'll translate it into a command for you.",
          timestamp: new Date(),
        },
      ],
      commandHistory: [],
      currentDirectory: "~",
    },
  ]);

  const [activeSessionId, setActiveSessionId] = useState(1);
  const [input, setInput] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    cpu_usage: 0,
    memory_used: 0,
    memory_total: 16,
    memory_percent: 0,
    disk_read: 0,
    disk_write: 0,
    uptime: 0,
  });
  const [pendingDangerousCommand, setPendingDangerousCommand] = useState<{ 
    command: string;
    messageId: string;
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showMonitorPanel, setShowMonitorPanel] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [collapsedOutputs, setCollapsedOutputs] = useState<Set<string>>(new Set());
  const [commandSuggestions, setCommandSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [executingCommand, setExecutingCommand] = useState<string | null>(null);
  const [streamingOutput, setStreamingOutput] = useState<string>("");
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [executionPanelCollapsed, setExecutionPanelCollapsed] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [recentlyInstalledPackages, setRecentlyInstalledPackages] = useState<Array<{name: string, timestamp: number}>>([]);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [osInfo, setOsInfo] = useState<OsInfo | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const executionOutputRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId)!;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession.messages]);

  // Auto-scroll execution output
  useEffect(() => {
    if (executionOutputRef.current && streamingOutput) {
      executionOutputRef.current.scrollTop = executionOutputRef.current.scrollHeight;
    }
  }, [streamingOutput]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fetch OS info on mount
  useEffect(() => {
    const fetchOsInfo = async () => {
      try {
        const info = await invoke<OsInfo>("get_os_info");
        setOsInfo(info);
      } catch (error) {
        console.error("Failed to get OS info:", error);
      }
    };
    fetchOsInfo();
  }, []);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("aura-theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    const savedAiEnabled = localStorage.getItem("aura-ai-enabled");
    if (savedAiEnabled !== null) {
      setAiEnabled(savedAiEnabled === "true");
    }
  }, []);

  // Apply theme to document and save to localStorage
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("aura-theme", theme);
  }, [theme]);

  // Save AI enabled state to localStorage
  useEffect(() => {
    localStorage.setItem("aura-ai-enabled", String(aiEnabled));
  }, [aiEnabled]);

  // Load current directory on mount (starting from home directory)
  useEffect(() => {
    const loadCurrentDir = async () => {
      try {
        // First set the working directory to user's home
        await invoke<string>("set_home_directory");

        // Then load and display the current directory
        const dir = await invoke<string>("get_current_directory");
        updateSessionDirectory(dir);
      } catch (error) {
        console.error("Failed to initialize directory:", error);
      }
    };
    loadCurrentDir();
  }, []);

  // Listen for streaming command output and progress updates
  useEffect(() => {
    const setupListeners = async () => {
      // Listen for stdout
      const unlistenOutput = await listen<string>("command-output", (event) => {
        setStreamingOutput((prev) => prev + event.payload + "\n");
      });

      // Listen for stderr
      const unlistenError = await listen<string>("command-error", (event) => {
        setStreamingOutput((prev) => prev + event.payload + "\n");
      });

      // Listen for progress updates
      const unlistenProgress = await listen<{message: string, stage: string}>("progress-update", (event) => {
        setProgressMessage(event.payload.message);
      });

      return () => {
        unlistenOutput();
        unlistenError();
        unlistenProgress();
      };
    };

    let cleanup: (() => void) | undefined;
    setupListeners().then((fn) => (cleanup = fn));

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // Update system stats every 2 seconds
  useEffect(() => {
    const updateStats = async () => {
      try {
        const stats = await invoke<SystemStats>("get_system_stats");
        setSystemStats(stats);
      } catch (error) {
        console.error("Failed to get system stats:", error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateSessionDirectory = (dir: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId ? { ...s, currentDirectory: dir } : s
      )
    );
  };

  const addMessage = (message: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
    };

    // Auto-collapse long outputs
    if (message.output) {
      const lines = message.output.split('\n');
      if (lines.length > 20) {
        setCollapsedOutputs((prev) => new Set(prev).add(newMessage.id));
      }
    }

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, messages: [...s.messages, newMessage] }
          : s
      )
    );
  };

  const addToHistory = (command: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, commandHistory: [...s.commandHistory, command] }
          : s
      )
    );
  };

  const buildConversationHistory = (): string => {
    const recentMessages = activeSession.messages.slice(-10);
    return recentMessages
      .map((msg) => {
        if (msg.type === "user") {
          return `User: ${msg.content}`;
        } else if (msg.command) {
          return `System executed: ${msg.command}${ 
            msg.output ? `\nOutput: ${msg.output}` : "" 
          }`;
        }
        return null;
      })
      .filter(Boolean)
      .join("\n");
  };

  // Helper function to add timeout to promises
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      ),
    ]);
  };

  // Check if input is an information request (question)
  const isInformationRequest = (text: string): boolean => {
    const lower = text.trim().toLowerCase();

    // Question mark is a strong indicator
    if (lower.includes('?')) return true;

    // Question patterns
    const patterns = [
      'who is', 'who are', 'who was', 'who were', 'who won', 'who invented',
      'what is', 'what are', 'what was', 'what were', 'what happened', 'what does',
      'when is', 'when was', 'when did', 'when does', 'when will',
      'where is', 'where are', 'where was', 'where can',
      'why is', 'why are', 'why did', 'why does',
      'how many', 'how much', 'how old', 'how tall', 'how long',
      'tell me about', 'information about', 'explain what', 'explain who',
      'search for', 'search on', 'search the', 'search internet', 'search web',
      'find information', 'find on internet', 'look up', 'google',
      'latest news', 'current', 'news about',
    ];

    return patterns.some(pattern => lower.startsWith(pattern) || lower.includes(` ${pattern}`));
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    setHistoryIndex(-1);

    // Update suggestions
    if (value.trim().length > 0) {
      const matches = activeSession.commandHistory
        .filter((cmd) => cmd.toLowerCase().includes(value.toLowerCase()))
        .filter((cmd, index, self) => self.indexOf(cmd) === index) // Remove duplicates
        .slice(-5) // Get last 5 matches
        .reverse(); // Most recent first

      setCommandSuggestions(matches);
      setSelectedSuggestionIndex(matches.length > 0 ? 0 : -1);
    } else {
      setCommandSuggestions([]);
      setSelectedSuggestionIndex(-1);
    }
  };

  const executeCommand = async (inputText: string, forceExecute = false) => {
    if (!inputText.trim()) return;

    // Clear suggestions
    setCommandSuggestions([]);
    setSelectedSuggestionIndex(-1);

    // Add to command history
    addToHistory(inputText);
    setHistoryIndex(-1);

    // Add user message
    addMessage({
      type: "user",
      content: inputText,
    });

    // Handle clear command specially
    if (inputText.trim() === "clear" || inputText.trim() === "cls") {
      clearSession();
      return;
    }

    // Check if this is an information request (question) - only if AI is enabled
    if (aiEnabled && isInformationRequest(inputText)) {
      setIsSearching(true);
      setInput("");

      // Show searching message
      addMessage({
        type: "ai",
        content: "🔍 Searching the web...",
      });

      try {
        const searchResult = await withTimeout(
          invoke<SearchResult>("search_information", {
            query: inputText,
          }),
          30000,
          "Search request timed out."
        );

        // Add search result message
        addMessage({
          type: "search",
          content: searchResult.answer,
          searchResult: searchResult,
        });
      } catch (error) {
        addMessage({
          type: "ai",
          content: `Search error: ${error}`,
          error: String(error),
        });
      } finally {
        setIsSearching(false);
        inputRef.current?.focus();
      }
      return;
    }

    setIsExecuting(true);
    setInput("");

    // Initialize streaming state
    const streamingMsgId = `streaming-${Date.now()}`;
    setStreamingMessageId(streamingMsgId);
    setStreamingOutput("");

    // If AI is disabled, execute directly as a command
    if (!aiEnabled) {
      try {
        // Set the executing command for display
        setExecutingCommand(inputText);

        const result = await withTimeout(
          invoke<ExecutionResponse>("execute_input", {
            input: inputText,
            forceExecute: true, // Always force execute when AI is disabled
            conversationHistory: null,
          }),
          60000,
          "Request timed out. The command took too long to execute."
        );

        // Update current directory
        if (result.current_dir) {
          updateSessionDirectory(result.current_dir);
        }

        // Add response with command output
        // Don't show the full output in content - it's already in the output field
        let responseContent = result.exit_code === 0
          ? "Command completed successfully."
          : "Command completed with errors.";

        addMessage({
          type: "ai",
          content: responseContent,
          command: result.command_run,
          output: result.output,
          error: result.error || undefined,
          errorAnalysis: result.error_analysis || undefined,
          suggestedFix: result.suggested_fix || undefined,
          groundingMetadata: result.grounding_metadata || undefined,
        });

        // Track successful installations
        if (result.exit_code === 0 && result.command_run) {
          const installMatch = result.command_run.match(/(?:brew|apt|apt-get|yum|dnf|npm|pip|pip3|cargo|gem)\s+install\s+(?:-g\s+)?(\S+)/);
          if (installMatch) {
            const packageName = installMatch[1];
            setRecentlyInstalledPackages(prev => [...prev.slice(-9), {name: packageName, timestamp: Date.now()}]);
          }
        }

        // Only show error message if exit code indicates failure
        if (result.error && result.exit_code !== 0) {
          // Check if this is a "Command Not Found" error for a recently installed package
          const isCommandNotFound = result.error_analysis?.error_type === "Command Not Found" ||
                                     result.error.includes("command not found") ||
                                     result.error.includes("not recognized");

          if (isCommandNotFound && result.command_run) {
            // Extract the command name (first word)
            const commandName = result.command_run.split(/\s+/)[0];

            // Check if this command or a similar package was recently installed
            const recentlyInstalled = recentlyInstalledPackages.find(
              pkg => pkg.name === commandName ||
                     commandName.includes(pkg.name) ||
                     pkg.name.includes(commandName)
            );

            if (recentlyInstalled) {
              // This is a post-installation failure - auto-search for usage instructions
              addMessage({
                type: "ai",
                content: `🔍 Package "${recentlyInstalled.name}" was just installed but the command "${commandName}" failed. Searching for usage instructions...`,
              });

              try {
                const searchResult = await withTimeout(
                  invoke<SearchResult>("search_information", {
                    query: `how to run ${recentlyInstalled.name} after installing on ${osInfo?.os_name || "your system"}`,
                  }),
                  30000,
                  "Search request timed out."
                );

                addMessage({
                  type: "search",
                  content: searchResult.answer,
                  searchResult: searchResult,
                });
              } catch (searchError) {
                addMessage({
                  type: "ai",
                  content: `Search error: ${searchError}`,
                  error: String(searchError),
                });
              }
            } else {
              // Normal error - show the error message
              addMessage({
                type: "ai",
                content: `Error: ${result.error}`,
                error: result.error,
              });
            }
          } else {
            // Not a command not found error - show the error message
            addMessage({
              type: "ai",
              content: `Error: ${result.error}`,
              error: result.error,
            });
          }
        }
      } catch (error) {
        addMessage({
          type: "ai",
          content: `Error: ${error}`,
          error: String(error),
        });
      } finally {
        setIsExecuting(false);
        setExecutingCommand(null);
        setStreamingMessageId(null);
        setProgressMessage(null);
        setStreamingOutput("");
        inputRef.current?.focus();
      }
      return;
    }

    const conversationHistory = buildConversationHistory();

    try {
      // Add 60 second timeout to prevent infinite waiting
      const result = await withTimeout(
        invoke<ExecutionResponse>("execute_input", {
          input: inputText,
          forceExecute,
          conversationHistory: conversationHistory || null,
        }),
        60000, // 60 seconds
        "Request timed out. The AI service took too long to respond. Please try again."
      );

      // Set the executing command for display
      if (result.command_run) {
        setExecutingCommand(result.command_run);
      }

      // Update current directory
      if (result.current_dir) {
        updateSessionDirectory(result.current_dir);
      }

      // Check if confirmation is needed
      if (result.needs_confirmation) {
        const msgId = Date.now().toString();
        setPendingDangerousCommand({
          command: result.command_run,
          messageId: msgId,
        });

        addMessage({
          type: "ai",
          content: `This command could cause data loss or system damage.`, 
          command: result.command_run,
          needsConfirmation: true,
        });
      } else {
        // Add AI response with command output
        // Don't show the full output in content - it's already in the output field
        let responseContent = result.exit_code === 0
          ? "Command completed successfully."
          : "Command completed with errors.";

        addMessage({
          type: "ai",
          content: responseContent,
          command: result.command_run,
          output: result.output,
          error: result.error || undefined,
          errorAnalysis: result.error_analysis || undefined,
          suggestedFix: result.suggested_fix || undefined,
          groundingMetadata: result.grounding_metadata || undefined,
        });

        // Track successful installations
        if (result.exit_code === 0 && result.command_run) {
          const installMatch = result.command_run.match(/(?:brew|apt|apt-get|yum|dnf|npm|pip|pip3|cargo|gem)\s+install\s+(?:-g\s+)?(\S+)/);
          if (installMatch) {
            const packageName = installMatch[1];
            setRecentlyInstalledPackages(prev => [...prev.slice(-9), {name: packageName, timestamp: Date.now()}]);
          }
        }

        // Check if this is a package not found error and auto-search
        const isPackageNotFound = result.error && (
          result.error.includes("No available formula") ||
          result.error.includes("not found") ||
          result.error.includes("not recognized") ||
          result.error.includes("Unable to locate package")
        );

        if (isPackageNotFound && result.command_run) {
          // Extract package name from command (e.g., "brew install qwen" -> "qwen")
          const packageMatch = result.command_run.match(/(?:brew|apt|yum|npm|pip|cargo)\s+install\s+(\S+)/);
          if (packageMatch) {
            const packageName = packageMatch[1];
            addMessage({
              type: "ai",
              content: `🔍 Package "${packageName}" not found locally. Searching the web for installation instructions...`,
            });

            try {
              const searchResult = await withTimeout(
                invoke<SearchResult>("search_information", {
                  query: `how to install ${packageName} package`,
                }),
                30000,
                "Search request timed out."
              );

              addMessage({
                type: "search",
                content: searchResult.answer,
                searchResult: searchResult,
              });

              // Extract the installation command from search results and execute it
              try {
                addMessage({
                  type: "ai",
                  content: "📦 Extracting installation command...",
                });

                const extractedCommand = await withTimeout(
                  invoke<string>("extract_command_from_search", {
                    searchAnswer: searchResult.answer,
                    packageName: packageName,
                  }),
                  20000,
                  "Command extraction timed out."
                );

                addMessage({
                  type: "ai",
                  content: `✅ Found installation command: ${extractedCommand}`,
                });

                addMessage({
                  type: "ai",
                  content: "🚀 Executing installation...",
                });

                // Execute the extracted command
                await executeCommand(extractedCommand, false);

              } catch (extractError) {
                addMessage({
                  type: "ai",
                  content: `⚠️ Could not auto-install: ${extractError}. Please try the command manually from the search results above.`,
                });
              }
            } catch (searchError) {
              addMessage({
                type: "ai",
                content: `Search error: ${searchError}`,
                error: String(searchError),
              });
            }
          }
        } else if (result.error && result.exit_code !== 0) {
          // Check if this is a "Command Not Found" error for a recently installed package
          const isCommandNotFound = result.error_analysis?.error_type === "Command Not Found" ||
                                     result.error.includes("command not found") ||
                                     result.error.includes("not recognized");

          if (isCommandNotFound && result.command_run) {
            // Extract the command name (first word)
            const commandName = result.command_run.split(/\s+/)[0];

            // Check if this command or a similar package was recently installed
            const recentlyInstalled = recentlyInstalledPackages.find(
              pkg => pkg.name === commandName ||
                     commandName.includes(pkg.name) ||
                     pkg.name.includes(commandName)
            );

            if (recentlyInstalled) {
              // This is a post-installation failure - auto-search for usage instructions
              addMessage({
                type: "ai",
                content: `🔍 Package "${recentlyInstalled.name}" was just installed but the command "${commandName}" failed. Searching for usage instructions...`,
              });

              try {
                const searchResult = await withTimeout(
                  invoke<SearchResult>("search_information", {
                    query: `how to run ${recentlyInstalled.name} after installing on ${osInfo?.os_name || "your system"}`,
                  }),
                  30000,
                  "Search request timed out."
                );

                addMessage({
                  type: "search",
                  content: searchResult.answer,
                  searchResult: searchResult,
                });
              } catch (searchError) {
                addMessage({
                  type: "ai",
                  content: `Search error: ${searchError}`,
                  error: String(searchError),
                });
              }
            } else {
              // Normal error - show the error message
              addMessage({
                type: "ai",
                content: `Error: ${result.error}`,
                error: result.error,
              });
            }
          } else {
            // Not a command not found error - show the error message
            addMessage({
              type: "ai",
              content: `Error: ${result.error}`,
              error: result.error,
            });
          }
        }
      }
    } catch (error) {
      addMessage({
        type: "ai",
        content: `Error: ${error}`,
        error: String(error),
      });
    } finally {
      setIsExecuting(false);
      setExecutingCommand(null);
      setStreamingMessageId(null);
      setStreamingOutput("");
      inputRef.current?.focus();
    }
  };

  const stopCommand = async () => {
    try {
      await invoke("stop_command");
      setExecutingCommand(null);
      setStreamingMessageId(null);
      setStreamingOutput("");
      setIsExecuting(false);
      setProgressMessage(null);
      addMessage({
        type: "ai",
        content: "Command stopped by user.",
      });
    } catch (error) {
      addMessage({
        type: "ai",
        content: `Failed to stop command: ${error}`,
        error: String(error),
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(input);
  };

  const handleConfirmDangerous = async () => {
    if (!pendingDangerousCommand) return;

    setPendingDangerousCommand(null);
    await executeCommand(pendingDangerousCommand.command, true);
  };

  const handleCancelDangerous = () => {
    addMessage({
      type: "ai",
      content: "Command cancelled by user.",
    });
    setPendingDangerousCommand(null);
  };

  const handleApplyFix = async (suggestedFix: string) => {
    // Add a message showing what fix is being applied
    addMessage({
      type: "system",
      content: `Applying suggested fix: ${suggestedFix}`,
    });

    // Execute the fix command
    await executeCommand(suggestedFix, false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Handle suggestions navigation
    if (commandSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < commandSuggestions.length - 1 ? prev + 1 : prev
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (selectedSuggestionIndex > 0) {
          setSelectedSuggestionIndex((prev) => prev - 1);
        }
        return;
      }

      if (e.key === "Tab" || e.key === "Enter") {
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          setInput(commandSuggestions[selectedSuggestionIndex]);
          setCommandSuggestions([]);
          setSelectedSuggestionIndex(-1);
          return;
        }
      }

      if (e.key === "Escape") {
        setCommandSuggestions([]);
        setSelectedSuggestionIndex(-1);
        return;
      }
    }

    // Up arrow - previous command (when no suggestions)
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (activeSession.commandHistory.length === 0) return;

      const newIndex =
        historyIndex === -1
          ? activeSession.commandHistory.length - 1
          : Math.max(0, historyIndex - 1);

      setHistoryIndex(newIndex);
      setInput(activeSession.commandHistory[newIndex]);
    }

    // Down arrow - next command (when no suggestions)
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;

      const newIndex = historyIndex + 1;

      if (newIndex >= activeSession.commandHistory.length) {
        setHistoryIndex(-1);
        setInput("");
      } else {
        setHistoryIndex(newIndex);
        setInput(activeSession.commandHistory[newIndex]);
      }
    }
  };

  const addNewSession = () => {
    const newId = Math.max(...sessions.map((s) => s.id)) + 1;
    const newSession: Session = {
      id: newId,
      name: `Session ${newId}`,
      messages: [
        {
          id: `welcome-${newId}`,
          type: "ai",
          content: "New session started. What would you like to do?",
          timestamp: new Date(),
        },
      ],
      commandHistory: [],
      currentDirectory: activeSession.currentDirectory,
    };

    setSessions([...sessions, newSession]);
    setActiveSessionId(newId);
  };

  const switchSession = (sessionId: number) => {
    setActiveSessionId(sessionId);
    setInput("");
    setHistoryIndex(-1);
  };

  const closeSession = (sessionId: number) => {
    // Don't close if it's the last session
    if (sessions.length === 1) {
      return;
    }

    // If closing the active session, switch to another one first
    if (sessionId === activeSessionId) {
      const remainingSessions = sessions.filter((s) => s.id !== sessionId);
      setActiveSessionId(remainingSessions[0].id);
    }

    // Remove the session
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const clearSession = () => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: [
                {
                  id: `welcome-cleared-${Date.now()}`,
                  type: "ai",
                  content: "Session cleared. What would you like to do?",
                  timestamp: new Date(),
                },
              ],
            }
          : s
      )
    );
  };

  const toggleOutputCollapse = (messageId: string) => {
    setCollapsedOutputs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const renderOutput = (output: string, messageId: string) => {
    const lines = output.split('\n');
    const isLong = lines.length > 20;
    const isCollapsed = collapsedOutputs.has(messageId);

    if (!isLong) {
      return <p style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>{output}</p>;
    }

    const displayedOutput = isCollapsed ? lines.slice(0, 10).join('\n') : output;
    const hiddenLines = lines.length - 10;

    return (
      <>
        <p style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>{displayedOutput}</p>
        <button
          onClick={() => toggleOutputCollapse(messageId)}
          style={{
            marginTop: "0.5rem",
            padding: "0.25rem 0.5rem",
            fontSize: "0.75rem",
            background: "var(--bg-tertiary)",
            border: "none",
            borderRadius: "0.25rem",
            color: "var(--primary-color)",
            cursor: "pointer",
          }}
        >
          {isCollapsed ? `▼ Show ${hiddenLines} more lines` : "▲ Collapse"}
        </button>
      </>
    );
  };

  const exportSessionLog = async () => {
    try {
      // Generate log content
      let logContent = `AuraShell Session Log\n`;
      logContent += `Session: ${activeSession.name}\n`;
      logContent += `Exported: ${new Date().toLocaleString()}\n`;
      logContent += `Total Commands: ${activeSession.commandHistory.length}\n`;
      logContent += `\n${"=".repeat(80)}\n\n`;

      activeSession.messages.forEach((message, index) => {
        logContent += `[${message.timestamp.toLocaleString()}] `;

        if (message.type === "user") {
          logContent += `USER: ${message.content}\n`;
        } else {
          logContent += `AURA AI: ${message.content}\n`;

          if (message.command) {
            logContent += `  Command: ${message.command}\n`;
          }

          if (message.output) {
            logContent += `  Output:\n${message.output.split('\n').map(line => `    ${line}`).join('\n')}\n`;
          }

          if (message.error) {
            logContent += `  Error: ${message.error}\n`;
          }
        }

        logContent += `\n`;
      });

      // Open save dialog
      const filePath = await save({
        filters: [{
          name: 'Text',
          extensions: ['txt']
        }],
        defaultPath: `aurashell-session-${Date.now()}.txt`
      });

      if (filePath) {
        await writeTextFile(filePath, logContent);
        addMessage({
          type: "ai",
          content: `Session log exported successfully to ${filePath}`,
        });
      }
    } catch (error) {
      addMessage({
        type: "ai",
        content: `Failed to export session log: ${error}`,
        error: String(error),
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatBytes = (bytes: number) => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <img src={logo} className="app-icon" alt="logo" />
          <h1 className="app-name">AuraShell</h1>
        </div>

        <div className="header-center">
          {sessions.map((session) => (
            <button
              key={session.id}
              className={`session-tab ${ 
                session.id === activeSessionId ? "active" : "" 
              }`}
              onClick={() => switchSession(session.id)}
            >
              {session.name}
              {sessions.length > 1 && (
                <button
                  className="session-close-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeSession(session.id);
                  }}
                >
                  ✕
                </button>
              )}
            </button>
          ))}
          <button className="add-session-btn" onClick={addNewSession}>
            +
          </button>
        </div>

        <button className="settings-btn" onClick={clearSession} title="Clear session">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
          </svg>
        </button>
        <button className="settings-btn" onClick={() => setShowSettings(true)} title="Settings">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <button className={`settings-btn ${!showMonitorPanel ? "rotated" : ""}`} onClick={() => setShowMonitorPanel(!showMonitorPanel)} title={showMonitorPanel ? "Hide monitor panel" : "Show monitor panel"}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
        </button>
      </header>

      {/* Main Content */}
      <main className={`main-content ${!showMonitorPanel ? "panel-hidden" : ""}`}>
        {/* Chat Panel */}
        <div className="chat-panel">
          <div className="chat-messages">
            {activeSession.messages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                {message.type === "ai" && (
                  <div
                    className="message-avatar"
                    style={{
                      backgroundImage:
                        `url(${logo})`,
                    }}
                  />
                )}
                {message.type === "user" && <div className="message-avatar" />}

                <div className="message-content">
                  <div className="message-header">
                    <span className="message-author">
                      {message.type === "ai" ? "Aura AI" : "user"}
                    </span>
                    {message.type === 'user' && message.path && (
                      <span className="path">
                        in {message.path}
                      </span>
                    )}
                    <span className="message-time">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>

                  <div className="message-bubble">
                    {message.needsConfirmation ? (
                      <div className="warning-box">
                        <div className="warning-header">
                          <span className="warning-icon">⚠</span>
                          <div>
                            <h3 className="warning-title">
                              Confirmation Required
                            </h3>
                            <p className="warning-text">{message.content}</p>
                          </div>
                        </div>
                        <div
                          className="code-block"
                          style={{ marginTop: "0.5rem", marginBottom: "0.75rem" }}
                        >
                          {message.command}
                        </div>
                        <div className="warning-actions">
                          <button
                            className="warning"
                            onClick={handleConfirmDangerous}
                          >
                            ✓ Confirm
                          </button>
                          <button onClick={handleCancelDangerous}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="message-text">{message.content}</p>
                        {message.command && message.type === "ai" && (
                          <div className="action-section">
                            <p className="action-title">Command Executed</p>
                            <div className="code-block">
                              <p>
                                <span className="prompt">aura</span>$ {message.command}
                              </p>
                              {message.output && renderOutput(message.output, message.id)}
                              {!message.output && !message.error && (
                                <p
                                  className="muted"
                                  style={{ marginTop: "0.5rem" }}
                                >
                                  ...complete
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        {message.groundingMetadata && message.groundingMetadata.groundingChunks && message.groundingMetadata.groundingChunks.length > 0 && (
                          <div className="search-results">
                            <div className="search-sources">
                              <p className="sources-title">Sources (via Google Search):</p>
                              <div className="sources-list">
                                {message.groundingMetadata.groundingChunks.map((chunk, idx) => (
                                  chunk.web && (
                                    <a
                                      key={idx}
                                      href={chunk.web.uri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="source-link"
                                    >
                                      <span className="source-number">{idx + 1}</span>
                                      <span className="source-title">{chunk.web.title || chunk.web.uri}</span>
                                      <span className="external-icon">↗</span>
                                    </a>
                                  )
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        {message.searchResult && (
                          <div className="search-results">
                            {message.searchResult.sources && message.searchResult.sources.length > 0 && (
                              <div className="search-sources">
                                <p className="sources-title">Sources:</p>
                                <div className="sources-list">
                                  {message.searchResult.sources.map((source, idx) => (
                                    <a
                                      key={idx}
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="source-link"
                                    >
                                      <span className="source-number">{idx + 1}</span>
                                      <span className="source-title">{source.title}</span>
                                      <span className="external-icon">↗</span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {message.errorAnalysis && (
                          <div className="warning-box" style={{ background: "rgba(255, 100, 100, 0.1)", borderLeft: "4px solid #ff6464" }}>
                            <div className="warning-header">
                              <span className="warning-icon" style={{ color: "#ff6464" }}>✗</span>
                              <div>
                                <h3 className="warning-title" style={{ color: "#ff6464" }}>
                                  {message.errorAnalysis.error_type}
                                </h3>
                                <p className="warning-text">{message.errorAnalysis.explanation}</p>
                              </div>
                            </div>
                            <div
                              className="code-block"
                              style={{ marginTop: "0.5rem", marginBottom: "0.75rem", marginLeft: "2rem" }}
                            >
                              <p style={{ whiteSpace: "pre-wrap", fontSize: "0.8rem" }}>
                                {message.errorAnalysis.suggested_fix}
                              </p>
                            </div>
                            {message.suggestedFix && (
                              <>
                                <div style={{ marginLeft: "2rem", marginTop: "0.75rem", marginBottom: "0.5rem" }}>
                                  <p style={{ fontSize: "0.85rem", color: "var(--primary-color)", marginBottom: "0.25rem", fontWeight: "500" }}>
                                    Suggested fix:
                                  </p>
                                  <div className="code-block" style={{ marginTop: "0.25rem" }}>
                                    <p>
                                      <span className="prompt">aura</span>$ {message.suggestedFix}
                                    </p>
                                  </div>
                                </div>
                                <div className="warning-actions" style={{ display: "flex", gap: "0.75rem", marginLeft: "2rem", marginTop: "0.75rem" }}>
                                  <button
                                    className="translate-btn"
                                    onClick={() => handleApplyFix(message.suggestedFix!)}
                                    style={{ minWidth: "auto", background: "var(--primary-color)", color: "var(--deep-charcoal)" }}
                                  >
                                    ✓ Run Fix
                                  </button>
                                <button
                                  className="translate-btn"
                                  onClick={() => {}}
                                  style={{
                                    minWidth: "auto",
                                    background: "rgba(255, 100, 100, 0.2)",
                                    color: "#ff6464",
                                    border: "1px solid #ff6464"
                                  }}
                                >
                                  ✗ Ignore
                                </button>
                              </div>
                              </>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isExecuting && (
              <div className="message ai">
                <div
                  className="message-avatar"
                  style={{
                    backgroundImage:
                    `url(${logo})`,
                  }}
                />
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-author">Aura AI</span>
                    <span className="message-time">
                      {formatTime(new Date())}
                    </span>
                  </div>
                  <div className="message-bubble">
                    <p className="message-text loading-message">
                      <span className="terminal-cursor">▊</span> {progressMessage || (executingCommand ? `Executing command...` : "Processing...")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Execution Panel */}
          {(isExecuting && executingCommand) || (executingCommand && streamingOutput) ? (
            <div className="execution-panel">
              <div className="execution-panel-header">
                <button
                  className="execution-panel-collapse-btn"
                  onClick={() => setExecutionPanelCollapsed(!executionPanelCollapsed)}
                  title={executionPanelCollapsed ? "Expand" : "Collapse"}
                >
                  {executionPanelCollapsed ? "▶" : "▼"}
                </button>
                <span className="execution-panel-title">
                  <span className="terminal-cursor">▊</span> Executing: {executingCommand}
                </span>
                <button
                  className="execution-panel-stop-btn"
                  onClick={stopCommand}
                  disabled={!isExecuting}
                  title="Stop command"
                >
                  ⏹ Stop
                </button>
              </div>
              {!executionPanelCollapsed && (
                <div className="execution-panel-content" ref={executionOutputRef}>
                  {streamingOutput ? (
                    <pre className="execution-output">{streamingOutput}</pre>
                  ) : (
                    <div className="execution-waiting">Waiting for output...</div>
                  )}
                </div>
              )}
            </div>
          ) : null}

          <div className="chat-input-container">
            {commandSuggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: 0,
                  right: 0,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "0.5rem 0.5rem 0 0",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 10,
                }}
              >
                {commandSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setInput(suggestion);
                      setCommandSuggestions([]);
                      setSelectedSuggestionIndex(-1);
                      inputRef.current?.focus();
                    }}
                    style={{
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      background:
                        index === selectedSuggestionIndex
                          ? "var(--bg-tertiary)"
                          : "transparent",
                      color: "var(--off-white)",
                      fontSize: "0.875rem",
                      fontFamily: "var(--font-mono)",
                      borderBottom:
                        index < commandSuggestions.length - 1
                          ? "1px solid var(--border-color)"
                          : "none",
                    }}
                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="chat-input-wrapper">
                <span className="input-prompt">
                  <span className="prompt">aura</span>:
                  <span className="path">{activeSession.currentDirectory}</span>$
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="chat-input"
                  placeholder={aiEnabled ? "Type a command or describe what you want..." : "Type a command..."}
                  disabled={isExecuting}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="submit"
                  className="translate-btn"
                  disabled={isExecuting || !input.trim()}
                >
                  <span className="translate-btn-icon">▶</span>
                  <span className="translate-btn-text">Execute</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {showMonitorPanel && (
          <div className="monitor-panel">
            <div className="monitor-content">
              <div className="monitor-section">
                <p className="section-label">Session Status</p>
                <div className="info-card">
                  <div className="info-row">
                    <span className="info-label">Uptime</span>
                    <span className="info-value">{formatUptime(systemStats.uptime)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Commands Run</span>
                    <span className="info-value">
                      {activeSession.commandHistory.length}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Active Sessions</span>
                    <span className="info-value">{sessions.length}</span>
                  </div>
                </div>
              </div>

              <div className="monitor-section">
                <p className="section-label">Resource Monitoring</p>
                <div className="info-card">
                  <div className="progress-bar-container">
                    <div className="progress-label-row">
                      <p className="progress-label">CPU Usage</p>
                      <p className="info-value">{systemStats.cpu_usage.toFixed(1)}%</p>
                    </div>
                    <div className="progress-bg">
                      <div
                        className="progress-fill"
                        style={{ width: `${systemStats.cpu_usage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="progress-bar-container">
                    <div className="progress-label-row">
                      <p className="progress-label">Memory</p>
                      <p className="info-value">
                        {formatBytes(systemStats.memory_used)} / {formatBytes(systemStats.memory_total)} GB
                      </p>
                    </div>
                    <div className="progress-bg">
                      <div
                        className="progress-fill"
                        style={{ width: `${systemStats.memory_percent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="progress-bar-container">
                    <div className="progress-label-row">
                      <p className="progress-label">Network I/O</p>
                      <p className="info-value">
                        ↓{systemStats.disk_read} MB / ↑{systemStats.disk_write} MB
                      </p>
                    </div>
                    <div className="progress-bg">
                      <div className="progress-fill" style={{ width: "25%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="monitor-section">
                <p className="section-label">Current Directory</p>
                <div className="directory-display">
                  <p className="directory-path">{activeSession.currentDirectory}</p>
                </div>
              </div>

              {activeSession.commandHistory.length > 0 && (
                <div className="monitor-section">
                  <p className="section-label">Recent Commands</p>
                  <div className="info-card">
                    {activeSession.commandHistory
                      .slice(-5)
                      .reverse()
                      .map((cmd, idx) => (
                        <div
                          key={idx}
                          className="info-row"
                          style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.25rem" }}
                        >
                          <span className="info-value" style={{ fontSize: "0.75rem" }}>
                            {cmd}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Settings</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowSettings(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="settings-section">
                <h3 className="settings-label">Theme</h3>
                <div className="theme-selector">
                  <button
                    className={`theme-option ${theme === "dark" ? "active" : ""}`}
                    onClick={() => setTheme("dark")}
                  >
                    <div className="theme-preview dark-preview">
                      <div className="preview-header"></div>
                      <div className="preview-content"></div>
                    </div>
                    <span className="theme-name">Dark Mode</span>
                  </button>

                  <button
                    className={`theme-option ${theme === "light" ? "active" : ""}`}
                    onClick={() => setTheme("light")}
                  >
                    <div className="theme-preview light-preview">
                      <div className="preview-header"></div>
                      <div className="preview-content"></div>
                    </div>
                    <span className="theme-name">Light Mode</span>
                  </button>
                </div>
              </div>

              <div className="settings-section" style={{ marginTop: "1.5rem" }}>
                <h3 className="settings-label">AI Assistant</h3>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem",
                  background: "var(--bg-tertiary)",
                  borderRadius: "0.5rem",
                  marginTop: "0.5rem"
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--off-white)", marginBottom: "0.25rem" }}>
                      Natural Language Translation
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--muted-grey)" }}>
                      {aiEnabled ? "AI will translate natural language to commands" : "All input executed as direct commands"}
                    </div>
                  </div>
                  <button
                    onClick={() => setAiEnabled(!aiEnabled)}
                    style={{
                      position: "relative",
                      width: "3rem",
                      height: "1.5rem",
                      borderRadius: "0.75rem",
                      background: aiEnabled ? "var(--primary-color)" : "var(--muted-grey)",
                      border: "none",
                      cursor: "pointer",
                      transition: "background 0.2s",
                      padding: 0,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "0.125rem",
                        left: aiEnabled ? "1.625rem" : "0.125rem",
                        width: "1.25rem",
                        height: "1.25rem",
                        borderRadius: "50%",
                        background: "white",
                        transition: "left 0.2s",
                      }}
                    />
                  </button>
                </div>
              </div>

              <div className="settings-section" style={{ marginTop: "1.5rem" }}>
                <h3 className="settings-label">Session</h3>
                <button
                  className="primary"
                  onClick={() => {
                    exportSessionLog();
                    setShowSettings(false);
                  }}
                  style={{ width: "100%", marginTop: "0.5rem" }}
                >
                  Export Session Log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;