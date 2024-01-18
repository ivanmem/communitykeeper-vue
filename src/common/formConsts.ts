const blackListFolderNames = new Set(["все", "all"]);

export const maxFolderLength = 30;

export const folderRules: any[] = [
  (folder: string) => {
    return (
      !blackListFolderNames.has(folder?.trim().toLowerCase()) ||
      "Это название зарезервировано системой."
    );
  },
  (folder: string) => {
    return (
      (folder?.trim().length ?? 0) <= maxFolderLength ||
      `Разрешено до ${maxFolderLength} символов.`
    );
  },
];
