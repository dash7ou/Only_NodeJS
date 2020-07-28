/**
 *  Library for storing and editing data
 * 
*/

const fs = require("fs")
const path = require("path")



// Write data to file
exports.writeData = (dir, file , data) =>{
    return new Promise((resolve, reject )=>{
        // check require data found
        if(!dir || !file || !data) reject({ msg: "There are required data missing read doc =)"});

        // Base directory of the data folder
        const baseDir = path.join(__dirname, "/../.data/")

        // Open the file for writing
        fs.open(baseDir+dir+"/"+file+".json", "wx", (err, fileDescriptor)=>{
            if(!err && fileDescriptor){
                // Convert data to string
                const stringData = JSON.stringify(data)

                // write tto file and close it
                fs.writeFile(fileDescriptor, stringData, (err)=>{
                    if(err){
                       reject({msg: "Error writing to new file", err}); 
                    }
                    fs.close(fileDescriptor, err=>{
                        if(!err){
                            reject({msg: "Error closing new file", err})
                        }
                        resolve(true)
                    })
                })
            }else{
                reject({msg:"Could not create new file, it may already exist.", err})
            }
        })
    })
}


// Read data from file
exports.readData = (file)=>{
    return new Promise((resolve, reject)=>{
        // Base directory of the data folder
        const baseDir = path.join(__dirname, "/../.data/")

        fs.readFile(baseDir + dir + "/" + file + ".json", "utf8", (err, data)=>{
            if(err){
                reject(err)
            }

            resolve(data)
        })
    })
}