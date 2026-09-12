import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HelpCircle, GripVertical } from 'lucide-react';

export interface DraggableHelpButtonProps {
  onClick?: () => void;
  onOpenHelp?: () => void;
  onStartTour?: () => void;
  onStartLiveTour?: () => void;
  theme?: any;
}

interface Position {
  x: number;
  y: number;
}

export const DraggableHelpButton: React.FC<DraggableHelpButtonProps> = ({ 
  onClick,
  onOpenHelp,
  onStartTour,
  onStartLiveTour,
  theme 
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [position, setPosition] = useState<Position | null>(null);

  // Helper to calculate exact bottom-right position
  const getBottomRightPosition = useCallback((): Position => {
    const btnWidth = buttonRef.current?.offsetWidth || 165;
    const btnHeight = buttonRef.current?.offsetHeight || 44;
    const margin = 24;
    return {
      x: Math.max(12, window.innerWidth - btnWidth - margin),
      y: Math.max(12, window.innerHeight - btnHeight - margin),
    };
  }, []);

  // Drag interaction tracking
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
    hasMoved: false,
  });

  // Initialize position (bottom-right default or restore from storage if valid)
  useEffect(() => {
    const saved = localStorage.getItem('agrodrone_help_btn_pos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          // Clamp inside current window
          const btnWidth = 165;
          const btnHeight = 44;
          const maxX = Math.max(12, window.innerWidth - btnWidth - 12);
          const maxY = Math.max(12, window.innerHeight - btnHeight - 12);
          setPosition({
            x: Math.min(Math.max(12, parsed.x), maxX),
            y: Math.min(Math.max(12, parsed.y), maxY),
          });
          return;
        }
      } catch (e) {
        console.warn('Failed to parse help button position:', e);
      }
    }

    // Default: bottom right corner of the page
    setPosition(getBottomRightPosition());
  }, [getBottomRightPosition]);

  // Window resize protection to keep button on-screen
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return getBottomRightPosition();
        const btnWidth = buttonRef.current?.offsetWidth || 165;
        const btnHeight = buttonRef.current?.offsetHeight || 44;
        const maxX = Math.max(12, window.innerWidth - btnWidth - 12);
        const maxY = Math.max(12, window.innerHeight - btnHeight - 12);

        return {
          x: Math.min(Math.max(12, prev.x), maxX),
          y: Math.min(Math.max(12, prev.y), maxY),
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getBottomRightPosition]);

  // Save to localStorage when dragged
  const savePosition = useCallback((pos: Position) => {
    try {
      localStorage.setItem('agrodrone_help_btn_pos', JSON.stringify(pos));
    } catch (e) {
      console.warn('Could not save button position:', e);
    }
  }, []);

  // Action triggered on click (not drag)
  const triggerClickAction = () => {
    if (onOpenHelp) {
      onOpenHelp();
    } else if (onClick) {
      onClick();
    }
  };

  // Start drag handler (Mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    e.preventDefault();

    const currentX = position?.x ?? getBottomRightPosition().x;
    const currentY = position?.y ?? getBottomRightPosition().y;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: currentX,
      initY: currentY,
      hasMoved: false,
    };

    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.startX;
      const deltaY = moveEvent.clientY - dragStartRef.current.startY;

      if (Math.hypot(deltaX, deltaY) > 4) {
        dragStartRef.current.hasMoved = true;
      }

      const btnWidth = buttonRef.current?.offsetWidth || 165;
      const btnHeight = buttonRef.current?.offsetHeight || 44;
      const maxX = Math.max(12, window.innerWidth - btnWidth - 12);
      const maxY = Math.max(12, window.innerHeight - btnHeight - 12);

      const nextX = Math.min(Math.max(12, dragStartRef.current.initX + deltaX), maxX);
      const nextY = Math.min(Math.max(12, dragStartRef.current.initY + deltaY), maxY);

      setPosition({ x: nextX, y: nextY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      if (dragStartRef.current.hasMoved) {
        setPosition((current) => {
          if (current) savePosition(current);
          return current;
        });
      } else {
        triggerClickAction();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Start drag handler (Touch for mobile/tablets)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];

    const currentX = position?.x ?? getBottomRightPosition().x;
    const currentY = position?.y ?? getBottomRightPosition().y;

    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initX: currentX,
      initY: currentY,
      hasMoved: false,
    };

    setIsDragging(true);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length !== 1) return;
      const t = moveEvent.touches[0];
      const deltaX = t.clientX - dragStartRef.current.startX;
      const deltaY = t.clientY - dragStartRef.current.startY;

      if (Math.hypot(deltaX, deltaY) > 5) {
        dragStartRef.current.hasMoved = true;
      }

      const btnWidth = buttonRef.current?.offsetWidth || 165;
      const btnHeight = buttonRef.current?.offsetHeight || 44;
      const maxX = Math.max(12, window.innerWidth - btnWidth - 12);
      const maxY = Math.max(12, window.innerHeight - btnHeight - 12);

      const nextX = Math.min(Math.max(12, dragStartRef.current.initX + deltaX), maxX);
      const nextY = Math.min(Math.max(12, dragStartRef.current.initY + deltaY), maxY);

      setPosition({ x: nextX, y: nextY });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);

      if (dragStartRef.current.hasMoved) {
        setPosition((current) => {
          if (current) savePosition(current);
          return current;
        });
      } else {
        triggerClickAction();
      }
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  };

  if (!position) return null;

  return (
    <button
      ref={buttonRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
        userSelect: 'none',
      }}
      className={`fixed z-50 px-4 py-2.5 rounded-full font-black text-xs text-white shadow-2xl border-2 transition-[transform,shadow,background-color] duration-75 flex items-center gap-2 select-none ${
        isDragging
          ? 'cursor-grabbing scale-105 bg-emerald-800 border-amber-300 ring-4 ring-emerald-500/50 shadow-[0_15px_35px_rgba(0,0,0,0.5)] opacity-95'
          : 'cursor-grab bg-emerald-600 hover:bg-emerald-700 border-emerald-300 dark:border-emerald-500 shadow-[0_8px_25px_rgba(16,185,129,0.35)] hover:scale-105 active:scale-95'
      }`}
      title="Ajuda do Perfil (Clique para abrir • Segure e arraste com o mouse para reposicionar)"
      aria-label="Ajuda do Perfil - Botão flutuante arrastável"
    >
      <GripVertical className="w-3.5 h-3.5 text-emerald-200/80 -ml-1 pointer-events-none" />
      <HelpCircle className="w-4 h-4 text-white pointer-events-none" />
      <span className="pointer-events-none whitespace-nowrap tracking-wide font-bold">
        Ajuda do Perfil
      </span>
    </button>
  );
};
