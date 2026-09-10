import React from 'react';
import { Video, ExternalLink } from 'lucide-react';

interface UniversalVideoPlayerProps {
  url: string;
  title?: string;
  className?: string;
  poster?: string;
}

/**
 * Normalizes video URLs to appropriate embed or direct streaming formats:
 * - Direct MP4 / WebM / Cloudinary videos -> HTML5 <video>
 * - YouTube -> Embed iframe
 * - Vimeo -> Embed iframe
 * - Google Drive -> /preview embed iframe
 */
export const UniversalVideoPlayer: React.FC<UniversalVideoPlayerProps> = ({
  url,
  title = 'Apartment Tour Video',
  className = 'w-full h-full',
  poster
}) => {
  const cleanUrl = (url || '').trim();

  if (!cleanUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-900 text-gray-400 p-6 ${className}`}>
        <Video className="w-10 h-10 mb-2 opacity-50 text-gray-500" />
        <p className="text-xs font-medium">No tour video linked</p>
      </div>
    );
  }

  // 1. Direct video formats or Cloudinary video URLs
  const isDirectVideo =
    cleanUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) ||
    cleanUrl.includes('/video/upload/');

  if (isDirectVideo) {
    return (
      <video
        className={`${className} object-cover`}
        src={cleanUrl}
        poster={poster}
        controls
        playsInline
        preload="metadata"
      >
        Your browser does not support HTML5 video playback.
      </video>
    );
  }

  // 2. YouTube
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    let embedUrl = cleanUrl;
    if (cleanUrl.includes('youtube.com/embed/')) {
      embedUrl = cleanUrl;
    } else if (cleanUrl.includes('youtube.com/watch')) {
      const videoId = cleanUrl.split('v=')[1]?.split('&')[0];
      embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : cleanUrl;
    } else if (cleanUrl.includes('youtu.be/')) {
      const videoId = cleanUrl.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : cleanUrl;
    }

    return (
      <iframe
        className={className}
        src={embedUrl}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // 3. Vimeo
  if (cleanUrl.includes('vimeo.com')) {
    let embedUrl = cleanUrl;
    if (!cleanUrl.includes('player.vimeo.com/video/')) {
      const vimeoId = cleanUrl.split('vimeo.com/')[1]?.split(/[?#]/)[0];
      embedUrl = vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : cleanUrl;
    }
    return (
      <iframe
        className={className}
        src={embedUrl}
        title={title}
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // 4. Google Drive
  if (cleanUrl.includes('drive.google.com')) {
    let embedUrl = cleanUrl;
    if (cleanUrl.includes('/view')) {
      embedUrl = cleanUrl.replace(/\/view.*$/, '/preview');
    } else if (!cleanUrl.includes('/preview')) {
      const fileIdMatch = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        embedUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
      }
    }
    return (
      <iframe
        className={className}
        src={embedUrl}
        title={title}
        frameBorder="0"
        allow="autoplay"
        allowFullScreen
      />
    );
  }

  // Fallback: try standard iframe, with link overlay
  return (
    <div className={`relative ${className} bg-black`}>
      <iframe
        className="w-full h-full"
        src={cleanUrl}
        title={title}
        frameBorder="0"
        allowFullScreen
      />
      <a
        href={cleanUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white text-[11px] px-2 py-1 rounded flex items-center gap-1 backdrop-blur-xs"
      >
        Open Video <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};

export default UniversalVideoPlayer;
