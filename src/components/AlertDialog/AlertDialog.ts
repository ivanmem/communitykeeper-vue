export interface AlertDialogProps {
  title?: string;
  subtitle?: string;
  subtitleStyle?: string;
  mode?: "alert" | "confirm";
  confirmTitle?: string;
  cancelTitle?: string;
  persistent?: boolean;
}
