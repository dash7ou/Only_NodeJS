/**
 * Helpers for various tasks
 * 
 */

const crypto = require("crypto")
const {
    hashingSecret,
    twilio,
    templateGlobals
} = require("./config");
const queryString = require("querystring")
const https = require("https");
const path = require("path");
const fs = require("fs");
const {
    timeStamp
} = require("console");

// Create SHA256 hash
exports.hash = (str) => {
    if (typeof (str) !== 'string' || !str.length > 0) {
        return false
    }

    const hashit = crypto.createHmac('sha256', hashingSecret).update(str).digest("hex");
    return hashit
}

// create a string of random alphanumeric characters, with given length
exports.createRandomString = (length) => {
    length = typeof (length) === 'number' && length > 0 ? length : false
    if (!length) {
        return false
    }

    // Define all the possible characters
    const possibleChars = 'zxcvbnmlkjhgfdsaqwertyuiop0123456789'
    let str = ''
    for (let i = 0; i < length; i++) {
        // get random char from possible chars
        const randomChar = possibleChars.charAt(Math.floor(Math.random() * possibleChars.length))
        // add random char to str
        str += randomChar
    }

    // return the finial string
    return str
}

// Send an SMS message via twilio
exports.sendTwilioSms = (phone, msg) => {
    return new Promise((resolve, reject) => {
        phone = typeof (phone) === 'string' && phone.trim().length > 9 ? phone.trim() : false
        msg = typeof (msg) === 'string' && msg.trim().length > 0 && msg.trim().length < 100 ? msg.trim() : false

        if (!phone || !msg) {
            return reject("missing parameters were missing or invalids")
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
        const req = https.request(requestDetails, res => {
            const status = res.statusCode
            if (status === 200 || status === 201) {
                resolve(true)
            }

            return reject(status)
        })

        // bind to the error event so it does not get thrown
        req.on("error", (err) => {
            return reject(err)
        })

        // add the payload
        req.write(stringPayload)

        // end the request
        req.end()
    })
}

exports.parseJsonToObject = (str) => {
    try {
        const obj = JSON.parse(str)
        return obj
    } catch (err) {
        return {}
    }
}


exports.parseFormDataToObject = (str) => {
    return str.split("&").reduce((acc, curr) => {
        const keyAndValue = curr.split("=")
        acc[keyAndValue[0]] = keyAndValue[1];
        return acc;
    }, {})
}


exports.getTemplate = (template, data) => {
    return new Promise((resolve, reject) => {
        try {
            if (!template) {
                throw "template name missing!!"
            }
            data = data ? data : {};

            const templateDir = path.join(__dirname, "/../templates/")
            let str = fs.readFileSync(templateDir + template + ".html", 'utf-8')
            str = this.interpolate(str, data);
            resolve(str)
        } catch (err) {
            return reject(err)
        }
    });
}

exports.interpolate = (str, data) => {
    str = str ? str : "";
    data = data ? data : {};

    for (let keyName in templateGlobals) {
        if (templateGlobals.hasOwnProperty(keyName)) {
            data[`global.${keyName}`] = templateGlobals[keyName];
        }
    }

    for (let key in data) {
        const replace = data[key];
        const find = `{${key}}`;
        str = str.replace(find, replace)
    }

    return str;
}

exports.addUnibersalTemplates = async (str, data) => {
    str = str ? str : "";
    data = data ? data : {};
    try {
        const headerStr = await this.getTemplate("_header", data);
        const footerStr = await this.getTemplate("_footer", data);

        // add all tempeletes togther
        const fullStringTemplates = headerStr + str + footerStr;
        return fullStringTemplates
    } catch (err) {
        throw err;
    }
}

// Get the contents of static asset
exports.getStaticAsset = (fileName) => {
    return new Promise((resolve, reject) => {
        if (fileName) {
            try {
                const publicDir = path.join(__dirname, "/../public/");
                const data = fs.readFileSync(publicDir + fileName)
                resolve(data)
            } catch (err) {
                console.log(err);
                return reject("No file could be found")
            }
        } else {
            return reject("A valid file name was not specified")
        }
    })
}