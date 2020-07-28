const  http = require("http")
const url = require("url")
const { StringDecoder } = require("string_decoder");
const { rejects } = require("assert");
const { resolve } = require("path");


const server = http.createServer((req, res)=>{
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

            res.writeHead(statusCode)
            res.end(payloadString)

            console.log('Returning this response: ', statusCode, payload)


        }catch(err){
            console.log(err)
        }


    })

})

// Start the server
server.listen(3000, ()=>{
    console.log("The server is listenining on port 3000 now!")
})

// Define the handllers
const handlers = {}

// Sample handler
handlers.sample = ()=>{
    return new Promise((resolve)=> {
        resolve([406, {"name": "sample handler"}])
    })
}

// Not found handler
handlers.notFound = (data)=>{
    return new Promise((resolve)=>{
        resolve([404])
    })
}

const router = {
    'sample': handlers.sample
}