import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  image: string | null;
  onImageChange: (base64: string | null) => void;
  label: string;
}

export function FileUploader({ image, onImageChange, label }: FileUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onImageChange(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [onImageChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    maxSize: 5242880, // 5MB
  });

  if (image) {
    return (
      <div className="relative overflow-hidden rounded-2xl border-2 border-border bg-card p-2 shadow-sm transition-all hover:shadow-md">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onImageChange(null);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-transform hover:scale-110 hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <p className="font-medium text-white shadow-black drop-shadow-md">{label}</p>
        </div>
        <img src={image} alt={label} className="h-64 w-full rounded-xl object-contain bg-black/5" />
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "group relative flex h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200 ease-in-out",
        isDragActive 
          ? "border-primary bg-primary/5 scale-[1.02]" 
          : "border-border hover:border-primary/50 hover:bg-accent/50"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-4 text-center p-6">
        <div className={cn(
          "rounded-full p-4 transition-colors duration-200",
          isDragActive ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}>
          {isDragActive ? <UploadCloud className="h-8 w-8" /> : <ImageIcon className="h-8 w-8" />}
        </div>
        <div>
          <p className="font-display font-medium text-foreground">
            {isDragActive ? "Drop card here" : `Upload ${label}`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag & drop or click to browse
          </p>
        </div>
        <div className="flex gap-2 text-xs text-muted-foreground/80">
          <span className="rounded bg-secondary/50 px-2 py-1">JPG</span>
          <span className="rounded bg-secondary/50 px-2 py-1">PNG</span>
          <span className="rounded bg-secondary/50 px-2 py-1">Max 5MB</span>
        </div>
      </div>
    </div>
  );
}
