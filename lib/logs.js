const fs = require("fs")
const path = require("path")
const zlib = require("zlib");
const { rejects } = require("assert");


// Append a string to a file. create the file if it does not exist.
exports.append = (file , string)=>{
    return new Promise((resolve, reject)=>{
        // Base directory of the data folder
        const baseDir = path.join(__dirname, "/../.logs/")

        try{
            // open the file for appending
            // using a tag for appending and create it if not exist
            const fileDescriptor = fs.openSync(baseDir+file+".log", 'a')

            // append to the file and close it
            fs.appendFileSync(fileDescriptor, string+"\n")
            fs.closeSync(fileDescriptor)
        }catch(err){
            reject(err)
        }

        
    })

}

// List all the logs, and optionally include the compressed logs
exports.list = (includeCompressedLogs)=>{
    return new Promise((resolve, reject)=>{
        try{
            // Base directory of the data folder
            const baseDir = path.join(__dirname, "/../.logs/")

            const files = fs.readdirSync(baseDir)
            const trimmedFileNames = files.map(file =>{
                // return .log files
                if(file.includes(".log")){
                    return file.replace(".log", "")
                }

                // add on the .gz files
                if(file.includes(".gz.b64") && includeCompressedLogs){
                    return file.replace(".gz.b64", "")
                }
            })

            resolve(trimmedFileNames)
        }catch(err){
            reject(err)
        }
    })
}

// Compress the contents of one .log file into a .gz.b64 file within the same dir
exports.compress = (logId, newFileId)=>{
    return new Promise((resolve, reject)=>{
        try{
            // Base directory of the data folder
            const baseDir = path.join(__dirname, "/../.logs/")

            const sourceFile = logId+".log"
            const destinationFile = newFileId+".gz.b64"

            // Read the source file
            const inputString = fs.readFileSync(baseDir+sourceFile, 'utf-8')

            // Compress the data with gzip
            const buffer = zlib.gzipSync(inputString)

            // send the data to the destination file
            const fileDescriptor = fs.openSync(baseDir+destinationFile, "wx")
            fs.writeFileSync(fileDescriptor, buffer.toString("base64"))
            fs.closeSync(fileDescriptor)

            resolve(true)
        }catch(err){
            rejects(err)
        }
    })
}