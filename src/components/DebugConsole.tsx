import React, { useState, useEffect, useRef } from "react";
import { logger, LogEntry } from "../services/logger";
import { screenRecorder } from "../services/screenRecorder";
import {
  Terminal,
  X,
  Trash2,
  Copy,
  ExternalLink,
  Check,
  Video,
  AlertTriangle,
} from "lucide-react";

export const DebugConsole: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isOpen]);

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.module}] [${l.level.toUpperCase()}] ${l.message} ${l.data ? JSON.stringify(l.data) : ""}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestCapture = async () => {
    try {
      setTestResult("Requesting display capture test...");
      logger.log("info", "Diagnostics", "Manual Test Screen Capture triggered by user");
      await screenRecorder.start("720p", false);
      setTestResult("SUCCESS: Capture stream initialized!");
      logger.log("success", "Diagnostics", "Manual capture stream started successfully!");

      // Stop after 3 seconds test
      setTimeout(async () => {
        try {
          const { blob, durationSec } = await screenRecorder.stop();
          setTestResult(`SUCCESS: Capture completed (${durationSec}s, ${blob.size} bytes)!`);
          logger.log("success", "Diagnostics", `Test capture finalized: ${blob.size} bytes`);
        } catch (e: any) {
          logger.log("error", "Diagnostics", `Test capture stop error: ${e?.message}`);
        }
      }, 3000);
    } catch (err: any) {
      const msg = `FAILED: ${err?.name || "Error"} - ${err?.message || "Unknown error"}`;
      setTestResult(msg);
      logger.log("error", "Diagnostics", msg, { stack: err?.stack });
    }
  };

  const errorCount = logs.filter((l) => l.level === "error").length;

  return (
    <>
      {/* Floating Trigger Pill */}
      <div className="fixed bottom-3 right-4 z-50 flex items-center gap-2 font-mono select-none">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg transition-all cursor-pointer border ${
            errorCount > 0
              ? "bg-riot-red text-white border-riot-red animate-pulse"
              : "bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 border-neutral-700 backdrop-blur"
          }`}
          title="Toggle In-App Diagnostics & Recorder Log Console"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Debug Logs</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
            {logs.length}
          </span>
          {errorCount > 0 && (
            <span className="flex items-center gap-0.5 text-amber-300 text-[10px]">
              <AlertTriangle className="w-3 h-3" />
              {errorCount}
            </span>
          )}
        </button>
      </div>

      {/* Slide-Up Drawer */}
      {isOpen && (
        <div className="fixed bottom-12 right-4 z-50 w-[95vw] sm:w-[640px] max-h-[460px] bg-[#0b0d13] border border-neutral-700 rounded-lg shadow-2xl flex flex-col font-mono text-xs overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="px-3 py-2 bg-[#121520] border-b border-neutral-800 flex items-center justify-between text-neutral-300">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-riot-red" />
              <span className="font-bold text-xs uppercase tracking-wider text-white">
                Diagnostics & Telemetry Log
              </span>
              <span className="text-[10px] text-neutral-400">
                ({logs.length} events)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleTestCapture}
                className="px-2 py-1 rounded bg-riot-red hover:bg-riot-redHover text-white text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer transition-all"
                title="Test screen capture immediately"
              >
                <Video className="w-3 h-3" />
                <span>Test Capture</span>
              </button>

              <button
                onClick={handleCopyLogs}
                className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] flex items-center gap-1 cursor-pointer"
                title="Copy all logs to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => logger.openNativeLog()}
                className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] flex items-center gap-1 cursor-pointer"
                title="Open debug_recording.log in Notepad"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => logger.clear()}
                className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
                title="Clear in-memory logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Test Status Banner if active */}
          {testResult && (
            <div className="px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[11px] text-amber-300 flex items-center justify-between">
              <span>{testResult}</span>
              <button
                onClick={() => setTestResult(null)}
                className="text-neutral-500 hover:text-white text-[10px]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Log Lines Container */}
          <div className="flex-1 p-3 overflow-y-auto space-y-1.5 custom-scrollbar text-[11px] leading-relaxed select-text bg-[#08090d]">
            {logs.length === 0 ? (
              <div className="text-neutral-600 text-center py-8">
                No telemetry events logged yet.
              </div>
            ) : (
              logs.map((l) => (
                <div
                  key={l.id}
                  className={`flex items-start gap-2 font-mono rounded px-1.5 py-0.5 ${
                    l.level === "error"
                      ? "bg-riot-red/15 text-riot-red border-l-2 border-riot-red"
                      : l.level === "warn"
                      ? "bg-amber-500/10 text-amber-400 border-l-2 border-amber-500"
                      : l.level === "success"
                      ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500"
                      : "text-neutral-400"
                  }`}
                >
                  <span className="text-neutral-500 shrink-0 text-[10px]">
                    {l.timestamp}
                  </span>
                  <span
                    className={`font-bold shrink-0 text-[10px] uppercase px-1 py-0.2 rounded-sm ${
                      l.level === "error"
                        ? "bg-riot-red text-white"
                        : l.level === "warn"
                        ? "bg-amber-500 text-black"
                        : l.level === "success"
                        ? "bg-emerald-600 text-white"
                        : "bg-neutral-800 text-neutral-300"
                    }`}
                  >
                    {l.module}
                  </span>
                  <span className="break-all flex-1 text-neutral-200">
                    {l.message}
                    {l.data && (
                      <span className="text-neutral-500 block text-[10px] mt-0.5">
                        {typeof l.data === "object" ? JSON.stringify(l.data) : String(l.data)}
                      </span>
                    )}
                  </span>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          {/* Footer note */}
          <div className="px-3 py-1.5 bg-[#10121a] border-t border-neutral-800 text-[10px] text-neutral-500 flex items-center justify-between">
            <span>Also saved to <code className="text-neutral-400">debug_recording.log</code></span>
            <span>Tauri WebView2 Native Diagnostic Channel</span>
          </div>
        </div>
      )}
    </>
  );
};

