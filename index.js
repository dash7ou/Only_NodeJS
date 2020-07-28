const  http = require("http")
const url = require("url")

const server = http.createServer((req, res)=>{
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, "")
    const method = req.method.toLowerCase()
    const query = parsedUrl.query
    const headers = req.headers

    res.end("hello world\n")

    console.log(`Request received on path: ${trimmedPath} with method ${method} and object query`, query)
    console.log(`this is our headers`, headers)
})


server.listen(3000, ()=>{
    console.log("The server is listenining on port 3000 now!")
})