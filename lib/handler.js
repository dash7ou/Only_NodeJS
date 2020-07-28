// Define the handllers

// ping handler
exports.ping = ()=>{
    return new Promise((resolve)=>{
        resolve([200])
    })
}


// Not found handler
exports.notFound = (data)=>{
    return new Promise((resolve)=>{
        resolve([404])
    })
}