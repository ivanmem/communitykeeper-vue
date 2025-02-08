import { IGroupsExport } from "@/store/groups/types";
import { isNumber, isPlainObject } from "es-toolkit/compat";

export function isGroupsExport(data: any): data is IGroupsExport {
  const exportObj = data as IGroupsExport;
  return (
    isPlainObject(exportObj) &&
    isPlainObject(exportObj.groupIdsDictByFolderName) &&
    !Object.values(exportObj.groupIdsDictByFolderName).some(
      (x) => !Array.isArray(x) || x.some((id) => !isNumber(id)),
    )
  );
}
