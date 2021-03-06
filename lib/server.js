const http = require("http")
const https = require("https")
const url = require("url")
const fs = require("fs")
const path = require("path")
const {
    StringDecoder
} = require("string_decoder");
const {
    httpPort,
    httpsPort,
    envName
} = require("./config");
const handlers = require("./handler")
const {
    parseJsonToObject,
    parseFormDataToObject
} = require("./helper")
const util = require("util")
const {
    type
} = require("os")
const debug = util.debuglog("server")


class Server {
    constructor() {
        // Instantiate the HTTPS server
        this.httpsServerOprions = {
            key: fs.readFileSync(path.join(__dirname, "/../https/key.pem")),
            cert: fs.readFileSync(path.join(__dirname, "/../https/cert.pem"))
        }

        this.router = {
            '': handlers.index,
            'account/create': handlers.createAccount,
            'account/edit': handlers.accountEdit,
            'account/delete': handlers.accountDeleted,
            'session/create': handlers.sessionCreate,
            'session/delete': handlers.sessionDeleted,
            'checks/all': handlers.checkList,
            'checks/create': handlers.checkCreate,
            'checks/edit': handlers.checkEdit,
            'ping': handlers.ping,
            'api/users': handlers.users,
            'api/tokens': handlers.tokens,
            'api/checks': handlers.checks,
            'favicon.ico': handlers.favicon,
            'public': handlers.public
        }
    }

    // logic for http and https server
    unifiedServer(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const path = parsedUrl.pathname;
        const trimmedPath = path.replace(/^\/+|\/+$/g, "")
        const method = req.method.toLowerCase()
        const query = parsedUrl.query
        const headers = req.headers

        // Get the payload, if any
        const decoder = new StringDecoder("utf-8")

        let buffer = ''

        req.on('data', (data) => {
            buffer += decoder.write(data)
        })

        // some request does not have payload end function always will called
        req.on("end", async () => {
            buffer += decoder.end()

            // Choose the handler this request should go to.
            const chosenHandler = trimmedPath.includes("public/") ? handlers.public : this.router[trimmedPath] ? this.router[trimmedPath] : handlers.notFound


            // Construct the data object to send to the handler
            const data = {
                trimmedPath: trimmedPath,
                queryStringObject: query,
                method,
                headers,
                payload: parseJsonToObject(buffer)
            }

            try {
                // Route the request to the handler specified in the router
                let [statusCode, payload, contentType] = await chosenHandler(data)

                // determine the type of response
                contentType = typeof (contentType) === 'string' ? contentType : "json"

                // use the status code from promise or return default 200
                statusCode = typeof (statusCode) === 'number' ? statusCode : 200

                let payloadString = '';
                const otherTypes = {
                    favicon: "image/x-icon",
                    css: "text/css",
                    png: "image/png",
                    jpg: "image/jpeg",
                    plain: "text/plain"
                };
                const otherTypesKeys = Object.keys(otherTypes);

                if (contentType === 'json') {
                    // use the payload or default {}
                    payload = typeof (payload) === 'object' ? payload : {}

                    // convert the payload to string
                    payloadString = JSON.stringify(payload)

                    res.setHeader('Content-Type', 'application/json')
                } else if (contentType === 'html') {
                    payloadString = typeof (payload) == 'string' ? payload : ''

                    res.setHeader('Content-Type', 'text/html')
                } else if (otherTypesKeys.includes(contentType)) {
                    res.setHeader("Content-Type", otherTypes[contentType]);
                    payloadString = payload ? payload : ''
                }



                // Return the response parts that are common to all content-types
                res.writeHead(statusCode)
                res.end(payloadString)

                // If the response is 200, print green otherwise print red
                if (statusCode === 200) {
                    debug('\x1b[32m%s\x1b[0m', method.toUpperCase() + " /" + trimmedPath + " " + statusCode)
                } else {
                    debug('\x1b[31m%s\x1b[0m', method.toUpperCase() + " /" + trimmedPath + " " + statusCode)
                }
            } catch (err) {
                debug(err)
                res.writeHead(500)
                res.end("server problem!")
            }
        })
    }

    startHttpServer() {
        // Instantiate the HTTP server
        const httpServer = http.createServer((req, res) => {
            this.unifiedServer(req, res)
        })

        // Start the server
        httpServer.listen(httpPort, () => {
            console.log('\x1b[35m%s\x1b[0m', `The server is listenining on port ${httpPort} in ${envName} mode!`)
        })
    }

    startHttpsServer() {
        const httpsServer = https.createServer(this.httpsServerOprions, function (req, res) {
            this.unifiedServer(req, res)
        })


        // Start the HTTPS server
        httpsServer.listen(httpsPort, () => {
            console.log('\x1b[36m%s\x1b[0m', `The server is listenining on port ${httpsPort} in ${envName} mode!`)
        })
    }

    init() {
        this.startHttpServer()
        this.startHttpsServer()
    }

}

module.exports = Server