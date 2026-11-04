import React, { useState, useEffect, useRef } from "react";
import { convertFileSrc, isTauri } from "@tauri-apps/api/core";
import { logger } from "../services/logger";
import {
  screenRecorder,
  saveRecordingLocally,
  fetchDiskRecordings,
  deleteDiskRecording,
  openRecordingsFolder,
  fetchRoflReplays,
  launchRoflReplay,
  highlightFileInExplorer,
  downloadVodFile,
  RecordingMeta,
  RoflReplayMeta,
  QualityPreset,
  getStoredVodBlob,
} from "../services/screenRecorder";
import {
  Video,
  Play,
  Pause,
  Square,
  FolderOpen,
  Mic,
  MicOff,
  Clock,
  Trash2,
  Download,
  Bookmark,
  Plus,
  Maximize2,
  RotateCcw,
  RotateCw,
  Film,
  HardDrive,
  Radio,
  Sliders,
  CheckCircle2,
  AlertCircle,
  VideoOff,
} from "lucide-react";

interface BookmarkItem {
  id: string;
  timeSec: number;
  label: string;
}

interface RecordingTabProps {
  isEnabled?: boolean;
  onEnable?: () => void;
  onOpenSettings?: () => void;
}

export const RecordingTab: React.FC<RecordingTabProps> = ({
  isEnabled = true,
  onEnable,
  onOpenSettings,
}) => {
  // Recorder states
  const [recorderState, setRecorderState] = useState<"idle" | "recording" | "paused">("idle");
  const [recordedSec, setRecordedSec] = useState<number>(0);
  const [quality, setQuality] = useState<QualityPreset>("720p");
  const [includeMic, setIncludeMic] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "info" | "success" | "error"; text: string } | null>(null);

  // Library & playback states
  const [diskVods, setDiskVods] = useState<RecordingMeta[]>([]);
  const [roflReplays, setRoflReplays] = useState<RoflReplayMeta[]>([]);
  const [libraryTab, setLibraryTab] = useState<"all" | "rofl" | "vods">("all");
  const [activeVodUrl, setActiveVodUrl] = useState<string | null>(null);
  const [activeVodTitle, setActiveVodTitle] = useState<string>("Select a recording to review");

  // Video Player Controls
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [newBookmarkLabel, setNewBookmarkLabel] = useState<string>("");

  // Sync recorder reactive events
  useEffect(() => {
    const unsubState = screenRecorder.onStateChange((st) => setRecorderState(st));
    const unsubDuration = screenRecorder.onDurationUpdate((sec) => setRecordedSec(sec));
    return () => {
      unsubState();
      unsubDuration();
    };
  }, []);

  // Load recordings on mount
  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    const vods = await fetchDiskRecordings();
    setDiskVods(vods);
    const rofls = await fetchRoflReplays();
    setRoflReplays(rofls);
  };

  const formatSeconds = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const h = Math.floor(m / 60);
    const remM = m % 60;
    if (h > 0) {
      return `${h}:${String(remM).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  // Pause / Resume
  const handleTogglePause = () => {
    if (recorderState === "recording") {
      screenRecorder.pause();
    } else if (recorderState === "paused") {
      screenRecorder.resume();
    }
  };

  // Stop recording & save
  const handleStopRecording = async () => {
    try {
      setStatusMessage({ type: "info", text: "Finalizing video encode and saving to disk..." });
      const { blob, durationSec } = await screenRecorder.stop();
      const dateStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const fileName = `LoL_Game_${dateStr}.webm`;

      const result = await saveRecordingLocally(blob, fileName, durationSec);

      // Create playback URL immediately
      const url = URL.createObjectURL(blob);
      setActiveVodUrl(url);
      setActiveVodTitle(fileName);
      setBookmarks([]);

      setStatusMessage({
        type: "success",
        text: `Recording saved successfully! ${result.path ? `Saved to: ${result.path}` : "Saved to local library."}`,
      });

      // Reload recordings library
      await loadLibrary();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.message || "Failed to finalize recording." });
    }
  };

  // Play a specific VOD
  const handlePlayVod = async (vod: RecordingMeta) => {
    setActiveVodTitle(vod.name);
    setBookmarks([]);
    logger.log("info", "RecordingTab", `Selected VOD for playback: ${vod.name} (${vod.path})`);

    // Check if we have blob in IndexedDB
    const storedBlob = await getStoredVodBlob(vod.name);
    if (storedBlob) {
      const url = URL.createObjectURL(storedBlob);
      setActiveVodUrl(url);
    } else {
      let url = vod.path;
      try {
        if (isTauri()) {
          url = convertFileSrc(vod.path);
          logger.log("info", "RecordingTab", `Converted path via asset protocol: ${url}`);
        } else {
          url = vod.path.startsWith("file://") ? vod.path : `file://${vod.path}`;
        }
      } catch (err: any) {
        logger.log("error", "RecordingTab", `Failed convertFileSrc: ${err?.message || err}`);
        url = vod.path.startsWith("file://") ? vod.path : `file://${vod.path}`;
      }
      setActiveVodUrl(url);
    }

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  // Delete VOD
  const handleDeleteVod = async (vod: RecordingMeta) => {
    if (confirm(`Are you sure you want to delete ${vod.name}?`)) {
      await deleteDiskRecording(vod.path);
      if (activeVodTitle === vod.name) {
        setActiveVodUrl(null);
        setActiveVodTitle("Select a recording to review");
      }
      await loadLibrary();
    }
  };

  const handleExportVod = async (vod: RecordingMeta) => {
    const storedBlob = await getStoredVodBlob(vod.name);
    if (storedBlob) {
      downloadVodFile(storedBlob, vod.name);
      setStatusMessage({ type: "success", text: `Exported ${vod.name} to browser downloads!` });
    } else {
      await highlightFileInExplorer(vod.path);
    }
  };

  const handleLaunchReplay = async (rep: RoflReplayMeta) => {
    try {
      setStatusMessage({
        type: "info",
        text: `Booting League of Legends client with replay: ${rep.file_name}...`,
      });
      await launchRoflReplay(rep.path);
      setStatusMessage({
        type: "success",
        text: `Replay launched! League of Legends spectator camera starting up.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Could not launch League client. Check if League is installed.",
      });
    }
  };

  const handleShowReplayInFolder = async (rep: RoflReplayMeta) => {
    await highlightFileInExplorer(rep.path);
  };

  // Video playback controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSkip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(videoDuration, videoRef.current.currentTime + seconds)
    );
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookmarkLabel.trim()) return;
    const bm: BookmarkItem = {
      id: String(Date.now()),
      timeSec: Math.floor(currentTime),
      label: newBookmarkLabel.trim(),
    };
    setBookmarks((prev) => [...prev, bm].sort((a, b) => a.timeSec - b.timeSec));
    setNewBookmarkLabel("");
  };

  const handleSeekToBookmark = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  if (!isEnabled) {
    return (
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0e14] rounded p-12 text-center max-w-xl mx-auto shadow-sm space-y-5 font-mono animate-in fade-in my-12">
        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center mx-auto text-neutral-400">
          <VideoOff className="w-8 h-8 text-neutral-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
            Game Detection & Recordings Disabled
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
            Enable option in settings to see recordings, automatically detect live League of Legends games in the background, and review match VODs with smart bookmarks.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          {onEnable && (
            <button
              onClick={onEnable}
              className="px-5 py-2.5 rounded-sm bg-riot-red hover:bg-riot-redHover text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer active:scale-95"
            >
              Enable Option to See Recordings
            </button>
          )}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="px-4 py-2.5 rounded-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-riot-red font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Open Settings
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-mono">
      {/* ========================================================= */}
      {/* 1. RECORDER COMMAND DECK                                  */}
      {/* ========================================================= */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0e14] rounded p-4 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Status & Duration Timer */}
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border text-xs font-bold uppercase tracking-wider select-none ${
              recorderState === "recording"
                ? "bg-riot-red/15 border-riot-red text-riot-red animate-pulse"
                : recorderState === "paused"
                ? "bg-amber-500/15 border-amber-500 text-amber-500"
                : "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-500"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>
              {recorderState === "recording"
                ? "LIVE RECORDING"
                : recorderState === "paused"
                ? "RECORDING PAUSED"
                : "RECORDER STANDBY"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span className="text-xl font-black text-neutral-900 dark:text-neutral-100 tabular-nums">
              {formatSeconds(recordedSec)}
            </span>
            {recorderState === "recording" && (
              <span className="text-[11px] text-neutral-400 tabular-nums">
                (~{(recordedSec * 0.35).toFixed(1)} MB est.)
              </span>
            )}
          </div>
        </div>

        {/* Center: Recording Actions */}
        <div className="flex items-center gap-2">
          {recorderState !== "idle" ? (
            <>
              <button
                onClick={handleTogglePause}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-neutral-100 dark:bg-neutral-800 hover:border-amber-500 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                {recorderState === "recording" ? (
                  <>
                    <Pause className="w-4 h-4 text-amber-500" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-emerald-500" />
                    <span>Resume</span>
                  </>
                )}
              </button>

              <button
                onClick={handleStopRecording}
                className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop & Save VOD</span>
              </button>
            </>
          ) : (
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Automated recording active • Captures on game launch</span>
            </div>
          )}

          <button
            onClick={openRecordingsFolder}
            className="flex items-center gap-1.5 px-3 py-2 rounded-sm bg-neutral-100 dark:bg-neutral-800 hover:border-riot-red border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            title="Open folder in Windows Explorer"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Open Folder</span>
          </button>
        </div>

        {/* Right: Quality & Mic Settings */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-sm p-1">
            <Sliders className="w-3.5 h-3.5 text-neutral-400 ml-1" />
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as QualityPreset)}
              disabled={recorderState !== "idle"}
              className="bg-transparent text-neutral-800 dark:text-neutral-200 font-bold text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="720p">720p 30fps (Ultra-light, ~2.5Mbps)</option>
              <option value="1080p">1080p 30fps (Balanced, ~5Mbps)</option>
              <option value="1080p60">1080p 60fps (High Quality)</option>
            </select>
          </div>

          <button
            onClick={() => setIncludeMic(!includeMic)}
            disabled={recorderState !== "idle"}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-sm border text-xs font-bold transition-all cursor-pointer ${
              includeMic
                ? "bg-riot-red/10 border-riot-red text-riot-red"
                : "bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
            title="Toggle microphone recording"
          >
            {includeMic ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            <span>Mic</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`px-4 py-2.5 rounded-sm border text-xs font-bold flex items-center justify-between gap-2 ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
              : statusMessage.type === "error"
              ? "bg-riot-red/10 border-riot-red/40 text-riot-red"
              : "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : statusMessage.type === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <Film className="w-4 h-4 shrink-0 text-riot-red" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MAIN VOD REVIEW & REPLAY STUDIO (SPLIT VIEW)           */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left 2 Cols: High-Density Interactive Video Review Player */}
        <div className="xl:col-span-2 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0e14] rounded p-4 shadow-sm space-y-3">
          {/* Active VOD Title */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-riot-red" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 truncate max-w-md">
                {activeVodTitle}
              </h3>
            </div>
            {videoDuration > 0 && (
              <span className="text-xs text-neutral-400 tabular-nums">
                Total Duration: {formatSeconds(videoDuration)}
              </span>
            )}
          </div>

          {/* Video Player Display */}
          <div className="relative bg-black rounded overflow-hidden aspect-video flex items-center justify-center border border-neutral-800">
            {activeVodUrl ? (
              <video
                key={activeVodUrl}
                ref={videoRef}
                src={activeVodUrl}
                autoPlay
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setCurrentTime(videoRef.current.currentTime);
                  }
                }}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    const dur = videoRef.current.duration || 0;
                    setVideoDuration(dur);
                    logger.log("info", "VideoPlayer", `Loaded metadata: duration=${dur.toFixed(1)}s`);
                  }
                }}
                onCanPlay={() => {
                  if (videoRef.current) {
                    videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                  }
                }}
                onError={() => {
                  const mediaErr = videoRef.current?.error;
                  logger.log(
                    "error",
                    "VideoPlayer",
                    `Playback error for ${activeVodUrl}: code=${mediaErr?.code} msg=${mediaErr?.message || "unknown"}`
                  );
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-contain"
                playsInline
              />
            ) : (
              <div className="text-center p-8 space-y-2">
                <Video className="w-12 h-12 text-neutral-600 mx-auto" />
                <p className="text-sm font-bold text-neutral-400">
                  No recording currently loaded
                </p>
                <p className="text-xs text-neutral-500">
                  Select a match recording from your library on the right to review playback and bookmarks.
                </p>
              </div>
            )}
          </div>

          {/* Integrated Video Playback Toolbar */}
          {activeVodUrl && (
            <div className="space-y-2 pt-1">
              {/* Scrub timeline slider */}
              <div className="flex items-center gap-2 text-xs tabular-nums text-neutral-500">
                <span>{formatSeconds(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={videoDuration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => {
                    const t = Number(e.target.value);
                    setCurrentTime(t);
                    if (videoRef.current) videoRef.current.currentTime = t;
                  }}
                  className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-none accent-riot-red cursor-pointer"
                />
                <span>{formatSeconds(videoDuration)}</span>
              </div>

              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={togglePlay}
                    className="p-1.5 rounded-sm bg-riot-red hover:bg-riot-redHover text-white transition-all cursor-pointer"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>

                  <button
                    onClick={() => handleSkip(-5)}
                    className="p-1.5 rounded-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-riot-red transition-all cursor-pointer"
                    title="Skip backward 5 seconds"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleSkip(5)}
                    className="p-1.5 rounded-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-riot-red transition-all cursor-pointer"
                    title="Skip forward 5 seconds"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-sm p-0.5 text-xs">
                  {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleRateChange(rate)}
                      className={`px-1.5 py-0.5 rounded-sm font-bold transition-all cursor-pointer ${
                        playbackRate === rate
                          ? "bg-riot-red text-white"
                          : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                {/* Fullscreen Button */}
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      if (document.fullscreenElement) {
                        document.exitFullscreen();
                      } else {
                        videoRef.current.requestFullscreen().catch(() => {});
                      }
                    }
                  }}
                  className="p-1.5 rounded-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-riot-red transition-all cursor-pointer"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Timestamp Bookmarking / Notes */}
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <form onSubmit={handleAddBookmark} className="flex items-center gap-2">
                  <Bookmark className="w-3.5 h-3.5 text-riot-red" />
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 tabular-nums">
                    [{formatSeconds(currentTime)}]:
                  </span>
                  <input
                    type="text"
                    value={newBookmarkLabel}
                    onChange={(e) => setNewBookmarkLabel(e.target.value)}
                    placeholder="Add bookmark note (e.g. Level 6 Fight, Dragon throw)..."
                    className="flex-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-sm px-2.5 py-1 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-riot-red"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs uppercase cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Bookmark</span>
                  </button>
                </form>

                {bookmarks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {bookmarks.map((bm) => (
                      <button
                        key={bm.id}
                        onClick={() => handleSeekToBookmark(bm.timeSec)}
                        className="px-2 py-0.5 rounded-sm bg-neutral-100 dark:bg-[#161a24] hover:border-riot-red border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <span className="text-riot-red tabular-nums">{formatSeconds(bm.timeSec)}</span>
                        <span>•</span>
                        <span>{bm.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Library (VOD Clips & ROFL Replays) */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0e14] rounded p-4 shadow-sm flex flex-col space-y-3">
          {/* Library Sub-Tabs */}
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
            <div className="flex items-center gap-1 text-xs font-mono">
              <button
                onClick={() => setLibraryTab("vods")}
                className={`px-3 py-1 rounded-sm font-bold uppercase transition-all cursor-pointer ${
                  libraryTab === "vods"
                    ? "bg-riot-red text-white"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
              >
                VOD Clips ({diskVods.length})
              </button>
              <button
                onClick={() => setLibraryTab("rofl")}
                className={`px-3 py-1 rounded-sm font-bold uppercase transition-all cursor-pointer ${
                  libraryTab === "rofl"
                    ? "bg-riot-red text-white"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
              >
                Riot Replays ({roflReplays.length})
              </button>
            </div>

            <button
              onClick={loadLibrary}
              className="text-[11px] text-neutral-400 hover:text-riot-red font-bold uppercase"
              title="Refresh list"
            >
              Refresh
            </button>
          </div>

          {/* VOD Clips List */}
          {libraryTab === "vods" && (
            <div className="space-y-2 overflow-y-auto max-h-[540px] custom-scrollbar pr-1">
              {diskVods.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500">
                  <Film className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
                  <p className="font-bold">No saved VODs found</p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Your screen recordings will be saved automatically to Videos/LeagueStatTracker.
                  </p>
                </div>
              ) : (
                diskVods.map((vod) => {
                  const isCurrent = activeVodTitle === vod.name;
                  return (
                    <div
                      key={vod.path}
                      className={`p-2.5 rounded-sm border transition-all text-xs ${
                        isCurrent
                          ? "bg-neutral-100 dark:bg-[#161a24] border-riot-red shadow-sm"
                          : "bg-neutral-50 dark:bg-[#0f121a] border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="truncate flex-1">
                          <p className="font-black text-neutral-900 dark:text-neutral-100 truncate">
                            {vod.name}
                          </p>
                          <p className="text-[10px] text-neutral-400 mt-0.5 tabular-nums">
                            {formatBytes(vod.size_bytes)} •{" "}
                            {vod.created_at > 0
                              ? new Date(vod.created_at * 1000).toLocaleDateString()
                              : "Recent"}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handlePlayVod(vod)}
                            className="p-1.5 rounded-sm bg-riot-red hover:bg-riot-redHover text-white transition-all cursor-pointer"
                            title="Play in reviewer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                          <button
                            onClick={() => handleExportVod(vod)}
                            className="p-1.5 rounded-sm bg-neutral-200 dark:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white text-neutral-500 transition-all cursor-pointer"
                            title="Export file / Show in folder"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteVod(vod)}
                            className="p-1.5 rounded-sm bg-neutral-200 dark:bg-neutral-800 hover:text-riot-red text-neutral-500 transition-all cursor-pointer"
                            title="Delete file"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ROFL Replays List */}
          {libraryTab === "rofl" && (
            <div className="space-y-2 overflow-y-auto max-h-[540px] custom-scrollbar pr-1">
              {/* Informational Guidance Banner */}
              <div className="p-2.5 rounded-sm bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-mono space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Riot In-Engine Replays (.rofl)</span>
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  These are 3D spectator replays generated by the League client. Click <strong>Launch</strong> below to boot directly into the game's spectator mode with free camera!
                </p>
              </div>

              {roflReplays.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500">
                  <HardDrive className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
                  <p className="font-bold">No .rofl replay files found</p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    When you download a replay from your Match History inside the official League client, it appears in Documents/League of Legends/Replays.
                  </p>
                </div>
              ) : (
                roflReplays.map((rep) => (
                  <div
                    key={rep.path}
                    className="p-2.5 rounded-sm border bg-neutral-50 dark:bg-[#0f121a] border-neutral-200 dark:border-neutral-800 text-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate flex-1">
                        <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {rep.file_name}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-0.5 tabular-nums">
                          {formatBytes(rep.size_bytes)} •{" "}
                          {rep.modified_at > 0
                            ? new Date(rep.modified_at * 1000).toLocaleDateString()
                            : "Recent"}
                        </p>
                      </div>

                      {/* Action buttons to launch replay or locate file */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleLaunchReplay(rep)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-riot-red hover:bg-riot-redHover text-white text-[11px] font-bold uppercase cursor-pointer transition-all shadow-sm"
                          title="Launch in League of Legends Spectator"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Launch</span>
                        </button>
                        <button
                          onClick={() => handleShowReplayInFolder(rep)}
                          className="p-1.5 rounded-sm bg-neutral-200 dark:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white text-neutral-500 transition-all cursor-pointer"
                          title="Show file in Windows Explorer"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
