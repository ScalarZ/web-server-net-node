import { createWebServer } from "./web";

const webServer = createWebServer((req, res) => {
  console.log(req.body.toString());

  if (req.method === "GET") {
    res.setStatus(200, "OK");
    res.setHeader("content-type", "plain/text");
    res.write("Hello world");
    return res.end("end connection");
  }
  if (req.method === "POST") {
    res.setStatus(200, "OK");
    //"content-type: application/json" header is set by default for json response
    res.setHeader("content-type", "application/json");
    return res.json({ message: "hello world" });
  }
  res.setStatus(404, "Not Found");
  res.end("Not Found");
});

webServer.listen(8080, () => console.log("Listing on port 8080"));
