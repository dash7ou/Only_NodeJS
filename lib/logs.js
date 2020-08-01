const fs = require("fs")
const path = require("path")
const zlib = require("zlib");

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