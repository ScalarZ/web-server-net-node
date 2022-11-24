interface Req {
  method: string;
  url: string;
  httpVersion: string;
  headers: Object;
  body: Buffer;
}

interface Res {
  write: (chunk?: Buffer | string | number) => void;
  end: (chunk?: Buffer | string | number) => void;
  json: (chunk?: Object) => void;
  setStatus: (newStatus: number, newStatusText: string) => void;
  setHeader: (key: string, value: string) => void;
}
