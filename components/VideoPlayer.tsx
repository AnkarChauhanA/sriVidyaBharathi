import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import type { Video } from '../types';
import { PlayPlayerIcon, PauseIcon, VolumeHighIcon, VolumeMuteIcon, FullscreenEnterIcon, FullscreenExitIcon, SettingsIcon, CheckCircleIcon, CheckCircleSolidIcon, SparklesIcon } from './Icons';

const AIChatPanel = lazy(() => import('./AIChatPanel'));

interface VideoPlayerProps {
    video: Video;
    onClose: () => void;
    onToggleComplete: (videoId: string) => void;
    onProgressUpdate?: (videoId: string, progress: number, duration: number) => void;
}

const playbackRates = [0.75, 1, 1.25, 1.5];

// Helper to derive quality state from props, ensuring it's available on first render.
const getDerivedQualityState = (videoUrls: { [quality: string]: string } | undefined) => {
    if (!videoUrls) {
        return { qualities: [], initialQuality: '' };
    }
    const qualities = Object.keys(videoUrls).sort((a, b) => {
        const qualityA = parseInt(a.replace('p', ''));
        const qualityB = parseInt(b.replace('p', ''));
        return qualityB - qualityA; // Sort descending
    });
    return { qualities, initialQuality: qualities[0] || '' };
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onClose, onToggleComplete, onProgressUpdate }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const settingsMenuRef = useRef<HTMLDivElement>(null);

    // Derive initial state directly from props to avoid empty src on first render
    const { qualities: initialQualities, initialQuality } = getDerivedQualityState(video.videoUrls);

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [qualities, setQualities] = useState<string[]>(initialQualities);
    const [currentQuality, setCurrentQuality] = useState<string>(initialQuality);
    const [isAiHelperOpen, setIsAiHelperOpen] = useState(false);
    const [activeSettingsMenu, setActiveSettingsMenu] = useState<'main' | 'speed' | 'quality' | null>(null);
    const controlsTimeout = useRef<number | null>(null);
    const progressUpdateThrottle = useRef<number | null>(null);

    const formatTime = (timeInSeconds: number) => {
        if (isNaN(timeInSeconds)) return '00:00';
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
            if (newVolume > 0 && isMuted) {
                setIsMuted(false);
                videoRef.current.muted = false;
            }
        }
    };
    
    const toggleMute = () => {
        if (videoRef.current) {
            const newMutedState = !isMuted;
            videoRef.current.muted = newMutedState;
            setIsMuted(newMutedState);
            if (!newMutedState && volume === 0) {
              setVolume(1); 
              videoRef.current.volume = 1;
            }
        }
    };
    
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const seekTime = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = seekTime;
            setProgress(seekTime);
        }
    };
    
    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        
        const currentVideoTime = videoRef.current.currentTime;
        const currentVideoDuration = videoRef.current.duration;

        setCurrentTime(currentVideoTime);
        setProgress(currentVideoTime);

        if (onProgressUpdate && !progressUpdateThrottle.current) {
            progressUpdateThrottle.current = window.setTimeout(() => {
                onProgressUpdate(video.id, currentVideoTime, currentVideoDuration);
                progressUpdateThrottle.current = null;
            }, 5000); // Update every 5 seconds
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };
    
    const toggleFullScreen = () => {
        if (!playerContainerRef.current) return;
        if (!document.fullscreenElement) {
            playerContainerRef.current.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const handlePlaybackRateChange = (rate: number) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
            setPlaybackRate(rate);
            setActiveSettingsMenu(null);
        }
    };

    const handleQualityChange = (quality: string) => {
        if (!videoRef.current || currentQuality === quality || !video.videoUrls[quality]) {
            setActiveSettingsMenu(null);
            return;
        }

        const videoElement = videoRef.current;
        const currentTime = videoElement.currentTime;
        const wasPlaying = !videoElement.paused;
        const currentRate = videoElement.playbackRate;

        videoElement.src = video.videoUrls[quality];
        videoElement.load();

        const onCanPlay = () => {
            videoElement.currentTime = currentTime;
            videoElement.playbackRate = currentRate;
            if (wasPlaying) {
                videoElement.play().catch(e => console.error("Error resuming playback:", e));
            }
        };

        videoElement.addEventListener('canplay', onCanPlay, { once: true });

        setCurrentQuality(quality);
        setActiveSettingsMenu(null);
    };
    
    const hideControls = () => {
        if (isPlaying) {
            if(controlsTimeout.current) clearTimeout(controlsTimeout.current);
            controlsTimeout.current = window.setTimeout(() => {
                if (!activeSettingsMenu) {
                    setControlsVisible(false);
                }
            }, 3000);
        }
    };

    const showControls = () => {
        if(controlsTimeout.current) clearTimeout(controlsTimeout.current);
        setControlsVisible(true);
        hideControls();
    };
    
    useEffect(() => {
        const player = videoRef.current;
        if (!player) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onFullscreenChange = () => setIsFullScreen(!!document.fullscreenElement);
        
        player.addEventListener('play', onPlay);
        player.addEventListener('pause', onPause);
        document.addEventListener('fullscreenchange', onFullscreenChange);
        
        hideControls();

        return () => {
            player.removeEventListener('play', onPlay);
            player.removeEventListener('pause', onPause);
            document.removeEventListener('fullscreenchange', onFullscreenChange);
            if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
            if (progressUpdateThrottle.current) clearTimeout(progressUpdateThrottle.current);
        };
    }, [isPlaying, activeSettingsMenu]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeSettingsMenu && settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
                setActiveSettingsMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeSettingsMenu]);

    const videoSrc = currentQuality && video.videoUrls ? video.videoUrls[currentQuality] : undefined;

    return (
        <div 
            ref={playerContainerRef} 
            className={`w-full max-w-7xl bg-black rounded-lg overflow-hidden flex transition-all duration-300 ${isAiHelperOpen ? 'max-w-7xl' : 'max-w-4xl'}`}
            onMouseMove={showControls}
            onMouseLeave={hideControls}
        >
            <div className="relative w-full aspect-video">
                <video
                    ref={videoRef}
                    src={videoSrc}
                    poster={video.thumbnailUrl}
                    onClick={togglePlayPause}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full h-full"
                />

                <div className={`absolute inset-0 transition-opacity duration-300 ${!isPlaying ? 'bg-black/40' : 'bg-transparent pointer-events-none opacity-0'}`}>
                    {!isPlaying && (
                        <button onClick={togglePlayPause} aria-label="Play video" className="w-20 h-20 bg-white/30 rounded-full flex items-center justify-center text-white backdrop-blur-sm hover:bg-white/50 transition-colors absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <PlayPlayerIcon className="w-12 h-12" />
                        </button>
                    )}
                </div>

                <div 
                  className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                    <div className="relative w-full h-4 flex items-center group/seek">
                        <input
                            type="range"
                            min="0"
                            max={duration || 1}
                            value={progress}
                            onChange={handleSeek}
                            aria-label="Seek slider"
                            className="w-full h-full appearance-none bg-transparent cursor-pointer relative z-10 seek-input"
                        />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 w-full bg-white/20 rounded-lg group-hover/seek:h-2 transition-all"></div>
                        <div 
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-blue-500 rounded-lg pointer-events-none group-hover/seek:h-2 transition-all" 
                          style={{ width: `${(progress / duration) * 100}%` }}
                        ></div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <button onClick={togglePlayPause} aria-label={isPlaying ? "Pause" : "Play"}>
                                {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayPlayerIcon className="w-6 h-6" />}
                            </button>
                            <div className="flex items-center gap-2 group/volume">
                                 <button onClick={toggleMute} aria-label={isMuted ? "Unmute" : "Mute"}>
                                    {isMuted || volume === 0 ? <VolumeMuteIcon className="w-6 h-6" /> : <VolumeHighIcon className="w-6 h-6" />}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    aria-label="Volume slider"
                                    className="w-0 group-hover/volume:w-20 h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer transition-all duration-300 seek-input"
                                />
                            </div>
                             <span className="text-xs font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4">
                             <h3 className="text-sm font-semibold hidden sm:block truncate max-w-[20ch] sm:max-w-[35ch]">{video.title}</h3>
                             <button
                                onClick={() => onToggleComplete(video.id)}
                                className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-white/20 transition-colors text-sm"
                                title={video.completed ? "Mark as incomplete" : "Mark as complete"}
                            >
                                {video.completed ? (
                                    <CheckCircleSolidIcon className="w-5 h-5 text-green-400" />
                                ) : (
                                    <CheckCircleIcon className="w-5 h-5" />
                                )}
                            </button>
                            
                            <div ref={settingsMenuRef} className="relative">
                                {activeSettingsMenu && (
                                    <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 bg-black/70 rounded-lg p-1 backdrop-blur-sm w-40">
                                        {activeSettingsMenu === 'main' && (
                                            <ul className="text-sm space-y-1">
                                                {qualities.length > 1 && (
                                                    <li>
                                                        <button onClick={() => setActiveSettingsMenu('quality')} className="w-full flex justify-between items-center text-left px-3 py-1.5 rounded hover:bg-white/20">
                                                            <span>Quality</span>
                                                            <span className="text-slate-400">{currentQuality} &gt;</span>
                                                        </button>
                                                    </li>
                                                )}
                                                <li>
                                                    <button onClick={() => setActiveSettingsMenu('speed')} className="w-full flex justify-between items-center text-left px-3 py-1.5 rounded hover:bg-white/20">
                                                        <span>Speed</span>
                                                        <span className="text-slate-400">{playbackRate === 1 ? 'Normal' : `${playbackRate}x`} &gt;</span>
                                                    </button>
                                                </li>
                                            </ul>
                                        )}
                                        {activeSettingsMenu === 'quality' && (
                                            <div>
                                                <button onClick={() => setActiveSettingsMenu('main')} className="w-full flex items-center text-left px-3 py-1.5 rounded hover:bg-white/20 text-slate-300">
                                                    &lt; Quality
                                                </button>
                                                <hr className="border-slate-600 my-1" />
                                                <ul className="text-sm space-y-1">
                                                    {qualities.map(q => (
                                                        <li key={q}>
                                                            <button onClick={() => handleQualityChange(q)} className={`w-full text-left px-3 py-1 rounded hover:bg-white/20 ${currentQuality === q ? 'font-bold text-blue-400' : ''}`}>
                                                                {q}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {activeSettingsMenu === 'speed' && (
                                            <div>
                                                <button onClick={() => setActiveSettingsMenu('main')} className="w-full flex items-center text-left px-3 py-1.5 rounded hover:bg-white/20 text-slate-300">
                                                    &lt; Speed
                                                </button>
                                                <hr className="border-slate-600 my-1" />
                                                <ul className="text-sm space-y-1">
                                                    {playbackRates.map(rate => (
                                                        <li key={rate}>
                                                            <button onClick={() => handlePlaybackRateChange(rate)} className={`w-full text-left px-3 py-1 rounded hover:bg-white/20 ${playbackRate === rate ? 'font-bold text-blue-400' : ''}`}>
                                                                {rate === 1 ? 'Normal' : `${rate}x`}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <button onClick={() => setActiveSettingsMenu(prev => prev ? null : 'main')} aria-label="Settings">
                                    <SettingsIcon className="w-6 h-6" />
                                </button>
                            </div>

                             <button
                                onClick={() => setIsAiHelperOpen(prev => !prev)}
                                className={`transition-colors ${isAiHelperOpen ? 'text-blue-400' : ''}`}
                                aria-label="Ask AI Helper"
                            >
                                <SparklesIcon className="w-6 h-6" />
                            </button>
                             <button onClick={toggleFullScreen} aria-label={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                                {isFullScreen ? <FullscreenExitIcon className="w-6 h-6" /> : <FullscreenEnterIcon className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                <button onClick={onClose} aria-label="Close player" className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition z-20">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
             {isAiHelperOpen && (
                <div className="w-full max-w-sm border-l border-slate-700">
                    <Suspense fallback={
                        <div className="flex items-center justify-center h-full bg-white dark:bg-slate-800">
                            <div className="text-center">
                                <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-blue-500 mx-auto"></div>
                                <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Loading AI Helper...</p>
                            </div>
                        </div>
                    }>
                        <AIChatPanel video={video} onClose={() => setIsAiHelperOpen(false)} />
                    </Suspense>
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;