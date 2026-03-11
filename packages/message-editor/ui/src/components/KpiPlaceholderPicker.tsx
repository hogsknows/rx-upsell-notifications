import { KPI_PLACEHOLDERS } from "@uns/shared";
import "./KpiPlaceholderPicker.css";

interface Props {
  onInsert: (token: string) => void;
}

export default function KpiPlaceholderPicker({ onInsert }: Props) {
  return (
    <div className="kpi-picker">
      <span className="kpi-picker__label">Insert placeholder:</span>
      <div className="kpi-picker__chips">
        {KPI_PLACEHOLDERS.map((key) => (
          <button
            key={key}
            type="button"
            className="kpi-chip"
            onClick={() => onInsert(`{{${key}}}`)}
            title={`Insert {{${key}}}`}
          >
            {`{{${key}}}`}
          </button>
        ))}
      </div>
    </div>
  );
}
