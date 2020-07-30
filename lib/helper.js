/**
 * Helpers for various tasks
 * 
*/

const crypto = require("crypto")
const { hashingSecret } = require("./config")

// Create SHA256 hash
exports.hash = (str)=>{
    if(typeof(str) !== 'string' || !str.length > 0 ){
        return false
    }

    const hashit = crypto.createHmac('sha256', hashingSecret).update(str).digest("hex");
    return hashit
}

// create a string of random alphanumeric characters, with given length
exports.createRandomString = (length)=>{
    length = typeof(length) === 'number' && length > 0 ? length : false
    if(!length){
        return false
    }

    // Define all the possible characters
    const possibleChars = 'zxcvbnmlkjhgfdsaqwertyuiop0123456789'
    let str = ''
    for(let i =0; i < length ; i++){
        // get random char from possible chars
        const randomChar = possibleChars.charAt(Math.floor(Math.random()*possibleChars.length))
        // add random char to str
        str += randomChar
    }

    // return the finial string
    return str
}

exports.parseJsonToObject = (str)=>{
    try{
        const obj = JSON.parse(str)
        return obj
    }catch(err){
        return {}
    }
}