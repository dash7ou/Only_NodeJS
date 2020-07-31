const Server = require("./lib/server")
const Worker = require("./lib/worker")

// Declare the app
class App {
    init(){
        const server = new Server()
        const worker = new Worker()

        server.init();
        worker.init();
    }
}

const app = new App()
app.init()

module.exports = app;