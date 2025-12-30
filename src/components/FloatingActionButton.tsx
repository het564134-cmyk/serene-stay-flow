import { ReactNode } from "react";
import { createPortal } from "react-dom";

interface FloatingActionButtonProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export const FloatingActionButton = ({
  onClick,
  children,
  className = "floating-button",
  ariaLabel = "Add",
}: FloatingActionButtonProps) => {
  if (typeof document === "undefined") return null;

  return createPortal(
    <button type="button" aria-label={ariaLabel} className={className} onClick={onClick}>
      {children}
    </button>,
    document.body,
  );
};
