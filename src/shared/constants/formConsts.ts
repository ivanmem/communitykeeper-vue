import { t } from "@/i18n";

const blackListFolderNames = new Set(["все", "all"]);

export const maxFolderLength = 30;

export const folderRules: any[] = [
  (folder: string) => {
    return (
      !blackListFolderNames.has(folder?.trim().toLowerCase()) ||
      t("validation.folderNameReserved")
    );
  },
  (folder: string) => {
    return (
      (folder?.trim().length ?? 0) <= maxFolderLength ||
      t("validation.folderMaxLength", { max: maxFolderLength })
    );
  },
];
