"use client";

interface DateRangeToolbarProps {
  fromDate: string;
  toDate: string;
  guestsAdult: number;
  guestsChild: number;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onGuestsAdultChange: (value: number) => void;
  onGuestsChildChange: (value: number) => void;
}

export default function DateRangeToolbar({
  fromDate,
  toDate,
  guestsAdult,
  guestsChild,
  onFromDateChange,
  onToDateChange,
  onGuestsAdultChange,
  onGuestsChildChange,
}: DateRangeToolbarProps) {
  return (
    <div className="figma-toolbar-var">
      <div className="figma-toolbar-guests justify-start">
        <label className="figma-toolbar-field max-h-36 max-w-48">
          <span className="figma-toolbar-label">from</span>
          <input
            type="date"
            value={fromDate}
            onChange={(event) => onFromDateChange(event.target.value)}
            className="figma-toolbar-input"
            aria-label="From date"
          />
        </label>

        <label className="figma-toolbar-field max-h-36 max-w-48">
          <span className="figma-toolbar-label">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(event) => onToDateChange(event.target.value)}
            className="figma-toolbar-input"
            aria-label="To date"
          />
        </label>
      </div>

      <div className="figma-toolbar-guests">
        <label className="figma-toolbar-field max-h-36 max-w-48">
          <span className="figma-toolbar-label">adults</span>
          <input
            type="number"
            min={1}
            value={guestsAdult}
            onChange={(event) =>
              onGuestsAdultChange(Math.max(1, Number(event.target.value) || 1))
            }
            className="figma-toolbar-input figma-toolbar-input-compact"
            aria-label="Adult guests"
          />
        </label>

        <label className="figma-toolbar-field max-h-36 max-w-48">
          <span className="figma-toolbar-label">children</span>
          <input
            type="number"
            min={0}
            value={guestsChild}
            onChange={(event) =>
              onGuestsChildChange(Math.max(0, Number(event.target.value) || 0))
            }
            className="figma-toolbar-input figma-toolbar-input-compact"
            aria-label="Child guests"
          />
        </label>
      </div>
    </div>
  );
}
