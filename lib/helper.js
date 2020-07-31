/**
 * Helpers for various tasks
 * 
*/

const crypto = require("crypto")
const { hashingSecret, twilio } = require("./config");
const queryString = require("querystring")
const https = require("https");

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

// Send an SMS message via twilio
exports.sendTwilioSms = (phone ,msg)=>{
    return new Promise((resolve, reject)=>{
        phone = typeof(phone) === 'string' && phone.trim().length > 9 ? phone.trim() : false
        msg = typeof(msg) === 'string' && msg.trim().length > 0 && msg.trim().length < 100 ? msg.trim() : false

        if(!phone || !msg){
            reject("missing parameters were missing or invalids")
        }

        // configure the request payload
        const payload = {
            'from': twilio.fromPhone,
            'to': phone,
            'body': msg
        }

        // Stringify the payload
        const stringPayload = queryString.stringify(payload)

        // configure the request details
        const requestDetails = {
            'protocal': 'https',
            'hostname': 'api.twilio.com',
            'method': "POST",
            'path': `/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`,
            'auth': twilio.accountSid + ":" + twilio.authToken,
            'headers': {
                "Content-Type": "application/x-www-from-urlencoded",
                "Content-Length": Buffer.byteLength(stringPayload)
            }
        }

        // Instantiate the request object
        const req = https.request(requestDetails, res =>{
            const status = res.statusCode
            if(status === 200 || status === 201){
                resolve(true)
            }

            reject(status)
        })

        // bind to the error event so it does not get thrown
        req.on("error", (err)=>{
            reject(err)
        })

        // add the payload
        req.write(stringPayload)

        // end the request
        req.end()
    })
}

exports.parseJsonToObject = (str)=>{
    try{
        const obj = JSON.parse(str)
        return obj
    }catch(err){
        return {}
    }
}