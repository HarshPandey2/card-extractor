import { useState } from "react";
import { Camera, SwitchCamera, AlertCircle, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { FileUploader } from "@/components/FileUploader";
import { CameraCapture } from "@/components/CameraCapture";
import { ExtractedDataForm } from "@/components/ExtractedDataForm";
import { useExtractCard } from "@workspace/api-client-react";
import { ExtractCardResponse } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [doubleSided, setDoubleSided] = useState(false);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  
  const [showCameraFor, setShowCameraFor] = useState<"front" | "back" | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractCardResponse | null>(null);

  const { mutate: extractCard, isPending, error } = useExtractCard();

  const handleProcess = () => {
    if (!frontImage) return;

    extractCard(
      { data: { frontImage, backImage: doubleSided ? backImage || undefined : undefined } },
      {
        onSuccess: (response) => {
          setExtractedData(response);
        },
      }
    );
  };

  const handleReset = () => {
    setFrontImage(null);
    setBackImage(null);
    setExtractedData(null);
  };

  const isReadyToProcess = frontImage && (!doubleSided || backImage);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 right-0 h-[500px] w-full z-0 overflow-hidden pointer-events-none">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-overlay"
        />
        <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-transparent to-background"></div>
      </div>

      <Navbar />

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1.5 mb-6 border border-primary/20 text-sm font-semibold text-primary shadow-sm">
            AI-Powered Extraction
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Digitize your visiting cards <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">in seconds.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload or capture an image of a business card. Our intelligent engine will instantly extract the name, company, emails, and phone numbers.
          </p>
        </div>

        {error && (
          <div className="mb-8 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Extraction Failed</h4>
              <p className="text-sm mt-1 opacity-90">{error.message || "An unexpected error occurred."}</p>
            </div>
          </div>
        )}

        {!extractedData ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Mode Toggle */}
            <div className="flex justify-center">
              <div className="inline-flex items-center rounded-full border border-border bg-card p-1 shadow-sm">
                <button
                  onClick={() => setDoubleSided(false)}
                  className={cn(
                    "rounded-full px-6 py-2.5 text-sm font-semibold transition-all",
                    !doubleSided ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Single Sided
                </button>
                <button
                  onClick={() => setDoubleSided(true)}
                  className={cn(
                    "rounded-full px-6 py-2.5 text-sm font-semibold transition-all",
                    doubleSided ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Double Sided
                </button>
              </div>
            </div>

            {/* Upload Grids */}
            <div className={cn(
              "grid gap-6 transition-all duration-500",
              doubleSided ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 max-w-xl mx-auto"
            )}>
              <div className="space-y-4">
                <FileUploader 
                  image={frontImage} 
                  onImageChange={setFrontImage} 
                  label="Front Side" 
                />
                {!frontImage && (
                  <button 
                    onClick={() => setShowCameraFor("front")}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:border-primary/50 hover:bg-accent/10 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                    Use Camera
                  </button>
                )}
              </div>

              {doubleSided && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <FileUploader 
                    image={backImage} 
                    onImageChange={setBackImage} 
                    label="Back Side" 
                  />
                  {!backImage && (
                    <button 
                      onClick={() => setShowCameraFor("back")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:border-primary/50 hover:bg-accent/10 transition-colors"
                    >
                      <Camera className="h-4 w-4" />
                      Use Camera
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            {isReadyToProcess && (
              <div className="flex justify-center pt-6 animate-in slide-in-from-bottom-4">
                <button
                  onClick={handleProcess}
                  disabled={isPending}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-full px-8 py-4 font-bold text-primary-foreground shadow-xl transition-all duration-300",
                    isPending 
                      ? "bg-primary/80 cursor-not-allowed scale-95" 
                      : "bg-primary hover:bg-primary/90 hover:shadow-primary/30 hover:-translate-y-1 active:translate-y-0"
                  )}
                >
                  {isPending ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-r-transparent" />
                      <span>Extracting Information...</span>
                    </>
                  ) : (
                    <>
                      <span>Process Card{doubleSided ? "s" : ""}</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                  
                  {isPending && (
                    <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <ExtractedDataForm data={extractedData.data} />
            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="text-sm font-semibold text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Scan another card
              </button>
            </div>
          </div>
        )}
      </main>

      {showCameraFor && (
        <CameraCapture 
          label={showCameraFor === "front" ? "Front Side" : "Back Side"}
          onCancel={() => setShowCameraFor(null)}
          onCapture={(base64) => {
            if (showCameraFor === "front") setFrontImage(base64);
            else setBackImage(base64);
            setShowCameraFor(null);
          }}
        />
      )}
    </div>
  );
}
