import { IGroupsExport } from "@/store/groups/types";
import isNumber from "lodash-es/isNumber";
import isPlainObject from "lodash-es/isPlainObject";

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
