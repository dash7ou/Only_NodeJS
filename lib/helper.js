/**
 * Helpers for various tasks
 * 
*/

const crypto = require("crypto")
const { hashingSecret } = require("../config")

// Create SHA256 hash
exports.hash = (str)=>{
    if(typeof(str) !== 'string' || !str.length > 0 ){
        return false
    }

    const hashit = crypto.createHmac('sha256', hashingSecret).update(str).digest("hex");
    return hashit
}

exports.parseJsonToObject = (str)=>{
    try{
        const obj = JSON.parse(str)
        return obj
    }catch(err){
        return {}
    }
}