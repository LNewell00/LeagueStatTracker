import React, { useState, useEffect } from "react";
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

export const ItemTooltip: React.FC<ItemTooltipProps> = ({
  itemId,
  size = "md",
  isTrinket = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [itemInfo, setItemInfo] = useState<ItemInfo | null>(() => getItemDataSync(itemId));

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
      className="relative shrink-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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

      {/* Floating Tooltip */}
      {isHovered && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-2xl bg-riot-darkest/95 backdrop-blur-xl border border-riot-accent/40 shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          {/* Header with Name and Cost */}
          <div className="flex items-start justify-between gap-2 border-b border-riot-border/60 pb-2">
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

          {/* Body Description / Stats */}
          {formattedDesc ? (
            <div className="mt-2 text-[11px] text-slate-300 leading-relaxed font-sans whitespace-pre-line max-h-48 overflow-y-auto">
              {formattedDesc}
            </div>
          ) : (
            <p className="mt-2 text-[10px] text-slate-500 italic">
              Loading item details...
            </p>
          )}

          {/* Sell Value */}
          {itemInfo?.gold?.sell ? (
            <div className="mt-2 pt-1.5 border-t border-riot-border/40 flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span>Sell Value:</span>
              <span className="text-amber-300 font-semibold">
                {itemInfo.gold.sell.toLocaleString()}g
              </span>
            </div>
          ) : null}

          {/* Small Arrow indicator */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-riot-darkest border-r border-b border-riot-accent/40 rotate-45" />
        </div>
      )}
    </div>
  );
};

