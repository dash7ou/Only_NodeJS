/**
 * Helpers for various tasks
 * 
*/

const crypto = require("crypto")

exports.hash = (str)=>{
    if(typeof(str) !== 'string' || !str.length > 0 ){
        return false
    }

    const hashit = crypto.createHmac('sha256', config.hashSercet).update(str).digest("hex");
    return hashit
}