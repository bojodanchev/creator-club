import React, { useState } from 'react';
import { Play } from 'lucide-react';

interface VSLSectionProps {
  videoUrl?: string;
  videoId?: string;
  thumbnailUrl?: string;
  headline?: string;
}

const VSLSection: React.FC<VSLSectionProps> = ({
  videoUrl,
  videoId,
  thumbnailUrl,
  headline = "See Creator Club in Action"
}) => {
  const [showVideo, setShowVideo] = useState(false);

  // Construct iframe URL from videoId or use videoUrl directly
  const embedUrl = videoUrl || (videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : '');

  const handlePlayClick = () => {
    setShowVideo(true);
  };

  return (
    <section className="py-20 px-4 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        {/* Headline */}
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-slate-900">
          {headline}
        </h2>

        {/* Video Container */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
          {!showVideo ? (
            // Thumbnail with Play Button Overlay
            <div
              className="relative w-full h-full cursor-pointer group"
              onClick={handlePlayClick}
            >
              {/* Thumbnail Image */}
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <p className="text-white text-xl font-semibold">Click to Play</p>
                </div>
              )}

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-indigo-600 ml-1" fill="currentColor" />
                </div>
              </div>
            </div>
          ) : (
            // Video iFrame
            <iframe
              src={embedUrl}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video Sales Letter"
            />
          )}
        </div>

        {/* Optional Caption */}
        {!showVideo && (
          <p className="text-center text-slate-600 mt-6 text-sm">
            Watch the full demo to see how Creator Club replaces 5+ tools
          </p>
        )}
      </div>
    </section>
  );
};

export default VSLSection;
