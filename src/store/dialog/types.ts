export interface DialogState {
  windows: Map<string, DialogWindow<any>>;
}

export interface DialogWindow<T extends Record<any, any>> {
  key: string;
  options: DialogOpenOptions<T>;
}

export interface DialogOpenOptions<T extends Record<any, any>> {
  component: any;
  props?: T;
}
