import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StarRating({ value, onChange, size = 5, readOnly = false }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange?.(i + 1)}
          className={cn(
            "transition-transform",
            !readOnly && "hover:scale-110 cursor-pointer",
            readOnly && "cursor-default"
          )}
        >
          <Star
            className={cn(
              size === 4 ? "w-4 h-4" : size === 6 ? "w-6 h-6" : "w-5 h-5",
              i < value ? "fill-amber-400 text-amber-400" : "fill-transparent text-white/30"
            )}
          />
        </button>
      ))}
    </div>
  );
}