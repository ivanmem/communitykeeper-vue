export interface AlertDialogProps {
  title?: string;
  subtitle?: string;
  subtitleStyle?: string;
  mode?: "alert" | "confirm";
  confirmTitle?: string | { id: string | number | boolean; label: string }[];
  cancelTitle?: string;
  persistent?: boolean;
}
