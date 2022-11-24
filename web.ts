import { createServer, Server, Socket } from "node:net";

export function createWebServer(handleRequest: (req: Req, res: Res) => void) {
  const server = createServer(handleConnection);

  function handleConnection(socket: Socket) {
    socket.on("data", (chunk: Buffer) => {
      // Request
      const req = getRequestObject(chunk);
      // Response

      let httpVersion = "HTTP/1.1",
        status = 200,
        statusText = "OK",
        isHeaderSent = false,
        isChunked = false;

      const resHeaders = new Map<string, string>();

      const res: Res = {
        write: (chunk?: Buffer | string | number) => {
          if (!isHeaderSent) {
            isChunked = true;
            setHeader("transfer-encoding", "chunked");
            sendHeaders();
          }
          if (isChunked) {
            if (chunk) {
              const sizeHex = chunk.toString().length.toString(16);
              socket.write(`${sizeHex}\r\n`);
            }
            socket.write(`${chunk}\r\n`);
          } else {
            socket.write(`${chunk}\r\n`);
          }
        },
        end: (chunk?: Buffer | string | number) => {
          if (!isHeaderSent) {
            const size = chunk ? chunk.toString().length.toString() : "0";
            setHeader("content-length", size);
            sendHeaders();
          }
          if (isChunked) {
            if (chunk) {
              const sizeHex = chunk.toString().length.toString(16);
              socket.write(`${sizeHex}\r\n`);
              socket.write(`${chunk}\r\n`);
            }
            socket.end(`0\r\n\r\n`);
          } else {
            socket.end(`${chunk}`);
          }
        },
        setStatus: (newStatus: number, newStatusText: string) => {
          status = newStatus;
          statusText = newStatusText;
        },
        setHeader,
        json: (chunk?: Object) => {
          if (isHeaderSent) throw new Error("Headers aready sent");

          const json = Buffer.from(JSON.stringify(chunk));
          setHeader("content-length", json.length.toString());
          setHeader("content-type", "application/json; charset=utf-8");
          sendHeaders();

          socket.end(`${json}`);
        },
      };

      function setHeader(key: string, value: string) {
        resHeaders.set(key, value);
      }

      function sendHeaders() {
        if (!isHeaderSent) {
          isHeaderSent = true;

          socket.write(`${httpVersion} ${status} ${statusText}\r\n`);
          setHeader("server", "my-server");
          setHeader("date", new Date().toString());

          resHeaders.forEach((value, key) => {
            socket.write(`${key}: ${value}\r\n`);
          });

          socket.write("\r\n");
        }
      }

      function getRequestObject(chunk: Buffer): Req {
        const index = chunk.indexOf("\r\n\r\n");

        const httpReqHeader = Buffer.from(
          Uint8Array.prototype.slice.call(chunk, 0, index)
        ).toString();

        const httpReqBody = Buffer.from(
          Uint8Array.prototype.slice.call(chunk, index + 4)
        );

        const reqHeaders = httpReqHeader.split("\r\n");

        const req: Req = {
          method: "",
          url: "",
          httpVersion: "",
          headers: {},
          body: Buffer.from([]),
        };

        let firstHeader: string | string[] = reqHeaders.shift() as string;
        firstHeader = firstHeader.split(" ");

        req.method = firstHeader[0];
        req.url = firstHeader[1];
        req.httpVersion = firstHeader[2];

        req.headers = reqHeaders.reduce((prev, curr) => {
          const header = curr.split(":");
          const key = header[0].trim().toLocaleLowerCase();
          const value = header[1].trim();
          return { ...prev, [key]: value };
        }, {});

        req.body = Buffer.concat([httpReqBody]);

        return req;
      }

      handleRequest(req, res);
    });
  }

  return {
    listen: (port: number, cb: () => void) => server.listen(port, cb),
  };
}
