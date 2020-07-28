const http = require("http")
const https = require("https")
const url = require("url")
const fs = require("fs")
const { StringDecoder } = require("string_decoder");
const { httpPort,httpsPort, envName } = require("./config");
const { deleteFile } = require("./lib/data")


// Instantiate the HTTP server
const httpServer = http.createServer((req, res)=>{
    unifiedServer(req, res)
})

// Start the server
httpServer.listen(httpPort, ()=>{
    console.log(`The server is listenining on port ${httpPort} in ${envName} mode!`)
})

// Instantiate the HTTPS server
const httpsServerOprions = {
    key: fs.readFileSync("./https/key.pem"),
    cert: fs.readFileSync("./https/cert.pem")
}

const httpsServer = https.createServer(httpsServerOprions, function(req, res){
    unifiedServer(req, res)
})


// Start the HTTPS server
httpsServer.listen(httpsPort, ()=>{
    console.log(`The server is listenining on port ${httpsPort} in ${envName} mode!`)
})

// logic for http and https server
const unifiedServer = (req, res)=>{
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, "")
    const method = req.method.toLowerCase()
    const query = parsedUrl.query
    const headers = req.headers

    // Get the payload, if any
    const decoder = new StringDecoder("utf-8")
    
    let buffer = ''

    req.on('data', (data)=>{
        buffer += decoder.write(data)
    })

    // some request does not have payload end function always will called
    req.on("end", async()=>{
        buffer += decoder.end()

        // Choose the handler this request should go to.
        const chosenHandler = router[trimmedPath] ? router[trimmedPath] : handlers.notFound

        // Construct the data object to send to the handler
        const data = {
            trimmedPath: trimmedPath,
            queryStringObject: query,
            method,
            headers,
            payload: buffer
        }

        try{
            // Route the request to the handler specified in the router
            let [ statusCode, payload ] =  await chosenHandler()
            // console.log(data)
            // use the status code from promise or return default 200
            statusCode = typeof(statusCode) === 'number' ? statusCode : 200

            // use the payload or default {}
            payload = typeof(payload) === 'object' ? payload : {}

            // convert the payload to string
            const payloadString = JSON.stringify(payload)

            // Return the Response
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(statusCode)
            res.end(payloadString)

            console.log('Returning this response: ', statusCode, payload)
        }catch(err){
            console.log(err)
            res.writeHead(500)
            res.end("server problem!")
        }


    })
}

// Define the handllers
const handlers = {}

// ping handler
handlers.ping = ()=>{
    return new Promise((resolve)=>{
        resolve([200])
    })
}


// Not found handler
handlers.notFound = (data)=>{
    return new Promise((resolve)=>{
        resolve([404])
    })
}

const router = {
    'ping': handlers.ping
}