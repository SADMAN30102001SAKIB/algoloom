"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface HintLog {
  id: string;
  hintLevel: number;
  hintText: string;
  xpSpent: number;
  createdAt: string;
}

interface AIHintsTabProps {
  problemId: string;
  currentCode?: string;
  currentLanguage?: string;
}

export function AIHintsTab({
  problemId,
  currentCode = "",
  currentLanguage = "PYTHON",
}: AIHintsTabProps) {
  const { data: session } = useSession();
  const [hintHistory, setHintHistory] = useState<HintLog[]>([]);
  const [currentHint, setCurrentHint] = useState<HintLog | null>(null);
  const [includeCode, setIncludeCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedHints, setExpandedHints] = useState<Set<string>>(new Set());

  const loadHintHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const response = await fetch(`/api/hints?problemId=${problemId}`);
      if (response.ok) {
        const data = await response.json();
        setHintHistory(data.hints || []);
      }
    } catch (err) {
      console.error("Failed to load hint history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [problemId]);

  // Load hint history on mount
  useEffect(() => {
    loadHintHistory();
  }, [loadHintHistory]);

  // Typing animation effect
  useEffect(() => {
    if (!currentHint || !isTyping || !currentHint.hintText) return;

    const fullText = currentHint.hintText;
    let currentIndex = 0;

    const typeNextChar = () => {
      if (currentIndex < fullText.length) {
        setTypingText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
        setTimeout(typeNextChar, 15); // Fast typing speed
      } else {
        setIsTyping(false);
      }
    };

    typeNextChar();
  }, [currentHint, isTyping]);

  const requestHint = async (level: number) => {
    if (!session) {
      setError("Please sign in to request AI hints");
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentHint(null);
    setTypingText("");

    try {
      const response = await fetch("/api/hints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problemId,
          hintLevel: level,
          ...(includeCode && currentCode.trim()
            ? {
                userCode: currentCode,
                language: currentLanguage,
              }
            : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate hint");
      }

      // Add to history
      const newHint: HintLog = {
        id: data.hint.id,
        hintLevel: data.hint.hintLevel,
        hintText: data.hint.hintText,
        xpSpent: data.hint.xpSpent,
        createdAt: data.hint.createdAt,
      };

      setHintHistory(prev => [newHint, ...prev]);
      setCurrentHint(newHint);
      setIsTyping(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate hint");
    } finally {
      setLoading(false);
    }
  };

  const copyHintToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleHintExpanded = (hintId: string) => {
    setExpandedHints(prev => {
      const newSet = new Set(prev);
      if (newSet.has(hintId)) {
        newSet.delete(hintId);
      } else {
        newSet.add(hintId);
      }
      return newSet;
    });
  };

  const getHintLevelInfo = (
    level: number,
  ): { label: string; color: string; xp: number } => {
    switch (level) {
      case 1:
        return { label: "Subtle Nudge", color: "green", xp: 5 };
      case 2:
        return { label: "Approach Guidance", color: "yellow", xp: 10 };
      case 3:
        return { label: "Detailed Help", color: "red", xp: 15 };
      default:
        return { label: "Unknown", color: "gray", xp: 0 };
    }
  };

  const codeLineCount = currentCode ? currentCode.split("\n").length : 0;

  if (!session) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Sign In Required
          </h3>
          <p className="text-slate-400 mb-4">
            AI-powered hints are available to registered users. Sign in to get
            intelligent, context-aware guidance.
          </p>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white rounded-lg transition font-medium">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (historyLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading AI hints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-700 pb-4">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <span className="text-3xl">🤖</span>
          AI-Powered Hints
        </h2>
        <p className="text-slate-400 text-sm">
          Get progressive, context-aware hints powered by Google Gemini AI.
          Choose your hint level wisely - each costs XP!
        </p>
      </div>

      {/* Code Inclusion Checkbox */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={includeCode}
            onChange={e => setIncludeCode(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-900 text-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
          />
          <div className="flex-1">
            <div className="text-white font-medium group-hover:text-purple-400 transition">
              Include my current code for personalized hints
            </div>
            <div className="text-slate-400 text-sm mt-1">
              {codeLineCount > 0 ? (
                <>
                  Your current code has{" "}
                  <span className="text-cyan-400 font-mono">
                    {codeLineCount} lines
                  </span>
                  . AI will analyze your approach and provide targeted
                  suggestions.
                </>
              ) : (
                "No code written yet. AI will provide general problem-solving guidance."
              )}
            </div>
          </div>
        </label>
      </div>

      {/* Hint Request Buttons */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(level => {
          const info = getHintLevelInfo(level);
          const usedLevels = new Set(hintHistory.map(h => h.hintLevel));
          const isUsed = usedLevels.has(level);
          const isPreviousUsed = level === 1 || usedLevels.has(level - 1);
          const isLocked = !isPreviousUsed && !isUsed;

          // Pro users can regenerate hints (not locked/disabled when used)
          const isPro = session?.user?.isPro;
          const isDisabled =
            loading || (!isPro && isUsed) || (!isPro && isLocked);
          const canRegenerate = isPro && isUsed;

          const colorClasses = {
            green:
              "bg-green-500/10 border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50 text-green-400",
            yellow:
              "bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20 hover:border-yellow-500/50 text-yellow-400",
            red: "bg-red-500/10 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 text-red-400",
          }[info.color];

          return (
            <button
              key={level}
              onClick={() => requestHint(level)}
              disabled={isDisabled}
              className={`p-4 rounded-lg border-2 transition-all ${colorClasses} ${
                isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">
                  {isUsed && !canRegenerate
                    ? "✓"
                    : isLocked && !isPro
                      ? "🔒"
                      : canRegenerate
                        ? "🔄"
                        : ""}{" "}
                  Level {level}
                </div>
                <div className="text-sm opacity-90 mb-2">
                  {canRegenerate
                    ? "Regenerate"
                    : isUsed
                      ? "Used"
                      : isLocked && !isPro
                        ? "Locked"
                        : info.label}
                </div>
                <div className="text-xs opacity-75 flex items-center justify-center gap-1">
                  <span>💰</span>
                  <span>{info.xp} XP</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 border-r-cyan-500 rounded-full animate-spin"></div>
            </div>
            <div>
              <div className="text-white font-medium">
                Generating AI hint...
              </div>
              <div className="text-slate-400 text-sm">
                Analyzing problem and context
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border-2 border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="text-red-400 font-medium mb-1">Error</div>
              <div className="text-red-300 text-sm">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Current Hint Display */}
      {currentHint && (
        <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-lg p-6 border-2 border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🤖</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">AI Hint</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      currentHint.hintLevel === 1
                        ? "bg-green-500/20 text-green-400"
                        : currentHint.hintLevel === 2
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                    }`}>
                    Level {currentHint.hintLevel}
                  </span>
                </div>
                <div className="text-slate-400 text-xs mt-0.5">
                  {new Date(currentHint.createdAt).toLocaleString()} • Cost:{" "}
                  {currentHint.xpSpent} XP
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyHintToClipboard(currentHint.hintText)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition">
                📋 Copy
              </button>
              {currentHint.hintLevel < 3 && (
                <button
                  onClick={() => requestHint(currentHint.hintLevel + 1)}
                  disabled={loading}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition disabled:opacity-50">
                  Next Level →
                </button>
              )}
            </div>
          </div>

          <div className="text-slate-200 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_strong]:text-white [&_code]:text-purple-300 [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-slate-800 [&_pre]:p-3 [&_pre]:rounded [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_p]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_.katex]:text-purple-300">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}>
              {isTyping ? typingText + "▏" : currentHint.hintText}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Hint History */}
      {hintHistory.length > 0 && (
        <div className="border-t border-slate-700 pt-6">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full text-left mb-4 group">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>📚</span>
              Hint History
              <span className="text-sm text-slate-500 font-normal">
                ({hintHistory.length} hints)
              </span>
            </h3>
            <span
              className={`text-slate-500 transition-transform ${showHistory ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>

          {showHistory && (
            <div className="space-y-3">
              {historyLoading ? (
                <div className="text-center py-8 text-slate-400">
                  Loading history...
                </div>
              ) : (
                hintHistory.map(hint => {
                  const hintText = hint.hintText || "";
                  const isExpanded = expandedHints.has(hint.id);
                  const needsExpansion = hintText.length > 100;

                  return (
                    <div
                      key={hint.id}
                      className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                hint.hintLevel === 1
                                  ? "bg-green-500/20 text-green-400"
                                  : hint.hintLevel === 2
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-red-500/20 text-red-400"
                              }`}>
                              L{hint.hintLevel}
                            </span>
                            <span className="text-slate-400 text-xs">
                              {new Date(hint.createdAt).toLocaleString()}
                            </span>
                            <span className="text-slate-500 text-xs">
                              • {hint.xpSpent} XP
                            </span>
                          </div>
                          {needsExpansion && (
                            <button
                              onClick={() => toggleHintExpanded(hint.id)}
                              className="text-purple-400 hover:text-purple-300 text-xs transition">
                              {isExpanded ? "Show less" : "Show more"}
                            </button>
                          )}
                        </div>

                        {isExpanded ? (
                          <div className="text-slate-300 text-sm [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_strong]:text-white [&_code]:text-purple-300 [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0.5 [&_p]:mb-2 [&_.katex]:text-purple-300">
                            <ReactMarkdown
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[rehypeKatex]}>
                              {hintText}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-slate-300 text-sm">
                            {hintText.replace(/[*#`$]/g, "").substring(0, 100)}
                            {hintText.length > 100 && "..."}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div className="text-sm text-blue-200">
            <div className="font-medium mb-1">How AI Hints Work</div>
            <ul className="space-y-1 text-blue-300/80 list-disc list-inside">
              <li>Level 1: Subtle conceptual nudges (5 XP)</li>
              <li>Level 2: Approach and algorithm suggestions (10 XP)</li>
              <li>Level 3: Detailed guidance with examples (15 XP)</li>
              <li>Free: 3 hints per problem (sequential), 5 hints/day total</li>
              <li>Pro: Unlimited hints, can regenerate any level</li>
              <li>Include code for personalized analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
