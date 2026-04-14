import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, X, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onCancel: () => void;
  label: string;
}

export function CameraCapture({ onCapture, onCancel, label }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
          }
        });
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      // Try with default camera if environment fails
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = resolve;
            }
          });
          setIsLoading(false);
        }
      } catch (fallbackErr) {
        console.error("Fallback camera access failed:", fallbackErr);
        setError("Unable to access camera. Please check permissions and ensure you're using HTTPS.");
        setIsLoading(false);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <div className="flex h-16 items-center justify-between px-4 text-white">
        <h2 className="font-display font-medium text-lg">Capture {label}</h2>
        <button
          onClick={() => {
            stopCamera();
            onCancel();
          }}
          className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="relative flex-1 bg-black/90">
        {error ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-white">
            <div className="rounded-xl bg-destructive/20 p-6 text-destructive-foreground border border-destructive/30">
              <p>{error}</p>
              <button 
                onClick={startCamera}
                className="mt-4 rounded-lg bg-destructive px-4 py-2 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex h-full items-center justify-center text-white">
            <div className="text-center">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto"></div>
              <p>Starting camera...</p>
            </div>
          </div>
        ) : capturedImage ? (
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="h-full w-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}

        {/* Overlay guides */}
        {!capturedImage && !error && !isLoading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
            <div className="h-[60%] w-full max-w-md rounded-xl border-2 border-white/50 border-dashed shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
          </div>
        )}
      </div>

      <div className="flex h-32 items-center justify-center gap-8 bg-black pb-8">
        {capturedImage ? (
          <>
            <button
              onClick={retake}
              className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                <RefreshCw className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium">Retake</span>
            </button>
            <button
              onClick={confirm}
              className="flex flex-col items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                <Check className="h-10 w-10" />
              </div>
              <span className="text-xs font-medium">Use Photo</span>
            </button>
          </>
        ) : (
          <button
            onClick={takePhoto}
            className="group relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-white transition-transform hover:scale-105 active:scale-95"
          >
            <div className="h-16 w-16 rounded-full bg-white transition-transform group-active:scale-90" />
          </button>
        )}
      </div>
    </div>
  );
}
