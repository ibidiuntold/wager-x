'use client';

import React, { useEffect, useState } from 'react';
import { QrCode, X, Share2, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from "@/lib/utils";
import { useToast } from '@/components/ui/use-toast';

interface QRCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  gameTitle?: string;
  className?: string;
}

const QRCodeDialog: React.FC<QRCodeDialogProps> = ({
  isOpen,
  onClose,
  url,
  gameTitle = 'game session',
  className
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [urlWithDomain, setUrlWithDomain] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Detect device type
    const checkIfMobile = () => {
      const mobile = window.innerWidth <= 768 || 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    // Generate full URL with domain
    const generateFullUrl = () => {
      // If the URL already has a domain, use it as is
      if (url.startsWith('http')) {
        setUrlWithDomain(url);
        return;
      }
      
      // Otherwise, prepend the current domain
      const domain = window.location.origin;
      // Check if URL starts with a slash
      const separator = url.startsWith('/') ? '' : '/';
      setUrlWithDomain(`${domain}${separator}${url}`);
    };

    checkIfMobile();
    generateFullUrl();

    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, [url]);

  // Check if QR code URL is valid
  const isValidUrl = urlWithDomain && (
    urlWithDomain.startsWith('http://') || 
    urlWithDomain.startsWith('https://')
  );

  // Handle copying URL to clipboard
  const handleCopyLink = async () => {
    if (!isValidUrl) {
      toast({
        title: "Error",
        description: "Cannot copy invalid URL",
        variant: "destructive"
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(urlWithDomain);
      toast({
        title: "Success",
        description: "✅ Link copied to clipboard!",
      });
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle sharing URL
  const handleShare = async () => {
    if (!isValidUrl) {
      toast({
        title: "Error",
        description: "Cannot share invalid URL",
        variant: "destructive"
      });
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my ${gameTitle}`,
          text: `Scan this QR code or click the link to join my ${gameTitle}`,
          url: urlWithDomain
        });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Share cancelled by user');
          return;
        }
        console.error('Error sharing:', err);
        handleCopyLink(); // Fallback to copy
      }
    } else {
      // Fallback for browsers that don't support native share
      handleCopyLink();
    }
  };

  if (!isOpen) return null;

  const deviceText = isMobile 
    ? "Continue on your laptop" 
    : "Continue on your mobile device";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={cn(
        "bg-slate-900 rounded-xl p-6 max-w-sm w-full relative",
        className
      )}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center gap-4">
          {isValidUrl ? (
            <QRCodeSVG
              value={urlWithDomain}
              size={200}
              level="H"
              className="bg-white p-2 rounded-lg"
            />
          ) : (
            <div className="w-[200px] h-[200px] bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white/60">Invalid URL</span>
            </div>
          )}
          
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">{deviceText}</h3>
            <p className="text-sm text-white/70 mb-4">
              Scan this QR code to continue playing on your {isMobile ? "laptop" : "mobile device"}
            </p>
            
            <div className="flex items-center justify-center space-x-2 mt-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4 mr-2" />
                <span className="text-sm">Copy Link</span>
              </button>
              
              <button
                onClick={handleShare}
                className="flex items-center px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4 mr-2" />
                <span className="text-sm">Share</span>
              </button>
            </div>
            
            <div className="mt-4 text-xs text-white/60 text-center break-all">
              {urlWithDomain.substring(0, 50)}{urlWithDomain.length > 50 ? '...' : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDialog;