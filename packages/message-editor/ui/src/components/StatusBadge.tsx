import type { MessageStatus } from "@uns/shared";
import "./StatusBadge.css";

interface Props {
  status: MessageStatus;
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );
}
