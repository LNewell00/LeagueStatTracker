import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import {
  getItemIconUrl,
  getItemDataSync,
  fetchAllItems,
  formatItemDescription,
  ItemInfo,
} from "../services/ddragon";
import { Coins } from "lucide-react";

interface ItemTooltipProps {
  itemId: number;
  size?: "xs" | "sm" | "md";
  isTrinket?: boolean;
}

interface TooltipCoords {
  placement: "above" | "below";
  left: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
}

export const ItemTooltip: React.FC<ItemTooltipProps> = ({
  itemId,
  size = "md",
  isTrinket = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [itemInfo, setItemInfo] = useState<ItemInfo | null>(() => getItemDataSync(itemId));
  const [coords, setCoords] = useState<TooltipCoords | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (itemId > 0 && !itemInfo) {
      const sync = getItemDataSync(itemId);
      if (sync) {
        setItemInfo(sync);
      } else {
        fetchAllItems().then((items) => {
          if (items[String(itemId)]) {
            setItemInfo(items[String(itemId)]);
          }
        });
      }
    }
  }, [itemId, itemInfo]);

  const handleMouseEnter = () => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const tooltipWidth = 288;
      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      // Clamp horizontally to stay completely within viewport
      left = Math.max(12, Math.min(window.innerWidth - tooltipWidth - 12, left));

      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;

      // Prefer showing above if there is enough space (> 220px) and it has more or equal room
      if (spaceAbove >= 220 || spaceAbove > spaceBelow) {
        const bottom = window.innerHeight - rect.top + 8;
        const maxHeight = Math.min(390, Math.max(160, rect.top - 20));
        setCoords({ placement: "above", left, bottom, maxHeight });
      } else {
        const top = rect.bottom + 8;
        const maxHeight = Math.min(390, Math.max(160, window.innerHeight - rect.bottom - 20));
        setCoords({ placement: "below", left, top, maxHeight });
      }

      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Size styling
  const sizeClasses = {
    xs: "w-5 h-5 rounded",
    sm: "w-6 h-6 rounded-md",
    md: "w-8 h-8 rounded-lg",
  }[size];

  if (!itemId || itemId === 0) {
    return (
      <div
        className={`${sizeClasses} ${
          isTrinket ? "rounded-full" : ""
        } bg-riot-darkest border border-riot-border/50 overflow-hidden flex items-center justify-center shrink-0`}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
      </div>
    );
  }

  const formattedDesc = itemInfo ? formatItemDescription(itemInfo.description) : "";

  return (
    <div
      ref={anchorRef}
      className="relative shrink-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Item Icon */}
      <div
        className={`${sizeClasses} ${
          isTrinket ? "rounded-full border-riot-gold/40" : "border-riot-border/70"
        } bg-riot-darkest border overflow-hidden flex items-center justify-center cursor-pointer hover:border-riot-accent hover:scale-105 transition-all`}
      >
        <img
          src={getItemIconUrl(itemId)}
          alt={itemInfo?.name || `Item ${itemId}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Floating Tooltip Rendered via Body Portal (Never Clipped by Card or Table Overflows) */}
      {isHovered &&
        coords &&
        ReactDOM.createPortal(
          <div
            style={{
              position: "fixed",
              left: `${coords.left}px`,
              ...(coords.placement === "above"
                ? { bottom: `${coords.bottom}px`, maxHeight: `${coords.maxHeight}px` }
                : { top: `${coords.top}px`, maxHeight: `${coords.maxHeight}px` }),
              zIndex: 99999,
              width: "288px",
            }}
            className="flex flex-col p-3 rounded-2xl bg-riot-darkest/98 backdrop-blur-2xl border border-riot-accent/40 shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
          >
            {/* Header with Name and Cost (Shrink-0 so it's never cut off) */}
            <div className="flex items-start justify-between gap-2 border-b border-riot-border/60 pb-2 shrink-0">
              <div>
                <h4 className="text-xs font-bold text-slate-100 leading-tight">
                  {itemInfo?.name || `Item #${itemId}`}
                </h4>
                {itemInfo?.plaintext && (
                  <p className="text-[10px] text-slate-400 italic mt-0.5">
                    {itemInfo.plaintext}
                  </p>
                )}
              </div>

              {itemInfo?.gold && (
                <div className="flex items-center gap-1 text-[11px] font-mono text-riot-gold font-bold shrink-0">
                  <Coins className="w-3 h-3 text-riot-gold" />
                  <span>{itemInfo.gold.total.toLocaleString()}g</span>
                </div>
              )}
            </div>

            {/* Body Description / Stats (Scrolls internally if text is long) */}
            {formattedDesc ? (
              <div className="mt-2 text-[11px] text-slate-300 leading-relaxed font-sans whitespace-pre-line overflow-y-auto custom-scrollbar flex-1 pr-1.5">
                {formattedDesc}
              </div>
            ) : (
              <p className="mt-2 text-[10px] text-slate-500 italic shrink-0">
                Loading item details...
              </p>
            )}

            {/* Sell Value (Shrink-0 pinned to footer) */}
            {itemInfo?.gold?.sell ? (
              <div className="mt-2 pt-1.5 border-t border-riot-border/40 flex justify-between items-center text-[10px] font-mono text-slate-400 shrink-0">
                <span>Sell Value:</span>
                <span className="text-amber-300 font-semibold">
                  {itemInfo.gold.sell.toLocaleString()}g
                </span>
              </div>
            ) : null}
          </div>,
          document.body
        )}
    </div>
  );
};
