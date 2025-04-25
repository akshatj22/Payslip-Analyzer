import { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function QAInterface({
  filename,
  chatHistory,
  setChatHistory,
  onReset,
}) {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [displayedAnswer, setDisplayedAnswer] = useState("");
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const answerRef = useRef(null);
  const chatEndRef = useRef(null);

  // Predefined questions with icons
  const predefinedQuestions = [
    { text: "What is my basic salary?", icon: "💰" },
    { text: "Do I have an HRA component?", icon: "🏠" },
    { text: "What tax bracket am I in?", icon: "📊" },
    { text: "What deductions are made?", icon: "➖" },
    { text: "How much is my net pay?", icon: "💸" },
    { text: "What allowances do I get?", icon: "✨" },
  ];

  // Scroll to bottom when chat history updates
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, displayedAnswer]);

  // Typewriter effect for answers
  useEffect(() => {
    if (isTyping && currentCharIndex < answerRef.current.length) {
      const timer = setTimeout(() => {
        setDisplayedAnswer(
          answerRef.current.substring(0, currentCharIndex + 1)
        );
        setCurrentCharIndex(currentCharIndex + 1);
      }, 15); // Speed of typing
      return () => clearTimeout(timer);
    }
  }, [isTyping, currentCharIndex]);

  
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setError("");

    // Add user question immediately
    const newQuestion = {
      question,
      answer: "",
      timestamp: new Date().toISOString(),
      isLoading: true,
    };

    setChatHistory([...chatHistory, newQuestion]);

    try {
      const response = await axios.post(
        "http://localhost:5000/ask",
        {
          question,
          filename: filename.replace(/ /g, '_') // Sanitize filename on client
        },
        {
          headers: {
            "Content-Type": "application/json",
          }
        }
      );

      // Update with the real answer
      const answer = response.data.answer;
      answerRef.current = answer;
      setCurrentCharIndex(0);
      setDisplayedAnswer("");
      setIsTyping(true);

      setChatHistory((prevHistory) =>
        prevHistory.map((item, i) =>
          i === prevHistory.length - 1
            ? { ...item, answer, isLoading: false }
            : item
        )
      );
    } catch (err) {
      setError("Failed to get an answer. Please try again.");
      console.error("Error:", err);

      // Update chat history to show error
      setChatHistory((prevHistory) =>
        prevHistory.map((item, i) =>
          i === prevHistory.length - 1
            ? {
                ...item,
                answer: "Sorry, I couldn't process that question.",
                isLoading: false,
              }
            : item
        )
      );
    } finally {
      setIsLoading(false);
      setQuestion("");
    }
  };

  const handleQuickQuestion = (q) => {
    setQuestion(q.text);
    handleSubmit();
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Analyzing: {filename}
            </h2>
            <p className="text-blue-100 text-sm">
              Ask any questions about your payslip
            </p>
          </div>
          <button
            onClick={onReset}
            className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-lg transition"
          >
            ← Upload new PDF
          </button>
        </div>

        {/* Chat area */}
        <div className="flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">
                  Ask about your payslip
                </h3>
                <p className="text-gray-600 mb-4">
                  Type a question or use one of the quick questions below to get
                  started
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {chatHistory.map((item, index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-3">
                        <span className="text-blue-600 text-sm font-bold">
                          You
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm flex-1">
                        <p className="text-gray-800">{item.question}</p>
                        <span className="text-xs text-gray-500 mt-1 block">
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mr-3">
                        <span className="text-white text-sm font-bold">AI</span>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg rounded-tl-none shadow-sm flex-1">
                        {item.isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            ></div>
                          </div>
                        ) : (
                          <p className="text-gray-800">{item.answer}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Quick questions */}
          <div className="bg-white p-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Quick Questions
            </h3>
            <div className="flex flex-wrap gap-2">
              {predefinedQuestions.map((q) => (
                <button
                  key={q.text}
                  onClick={() => handleQuickQuestion(q)}
                  disabled={isLoading}
                  className="px-3 py-2 text-sm rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 transition flex items-center space-x-1"
                >
                  <span>{q.icon}</span>
                  <span>{q.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input area */}
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-gray-200 bg-white"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 p-3 text-gray-600 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className={`px-4 rounded-lg font-medium flex items-center justify-center ${
                  isLoading || !question.trim()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    ></path>
                  </svg>
                )}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
