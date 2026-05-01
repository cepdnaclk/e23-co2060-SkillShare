import { AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ErrorBannerProps {
  error: string | null;
  onDismiss?: () => void;
  className?: string;
}

const ErrorBanner = ({ error, onDismiss, className = "" }: ErrorBannerProps) => (
  <AnimatePresence>
    {error && (
      <motion.div
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.2 }}
        className={`flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm ${className}`}
      >
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span className="flex-1">{error}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-destructive/70 hover:text-destructive transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    )}
  </AnimatePresence>
);

export default ErrorBanner;
