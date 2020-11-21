const { hash, createRandomString, getTemplate, addUnibersalTemplates, getStaticAsset } = require("./helper")
const { readData, writeData, updateData, deleteFile } = require("./data")
const { maxChecks } = require("./config")
const { resolve } = require("path")

// Define the handllers
const handlers = {}

/**
 * 
 * HTML Handlers
 * 
 * 
*/

// Index
exports.index = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (data.method === 'get') {
                const templateData = {
                    'head.title': "This is the title",
                    'head.description': "This is the meta description",
                    'body.title': "Hello bitches",
                    'body.class': 'index'
                }

                let str = await getTemplate('index', templateData);
                str = await addUnibersalTemplates(str, templateData);
                resolve([200, str, 'html'])
            } else {
                resolve([405, undefined, 'html'])
            }
        } catch (err) {
            console.log(err)
            reject([500, "server error", 'html'])
        }
    })
}

// Favicon
exports.favicon = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (data.method === "get") {
                const data = await getStaticAsset('favicon.ico');
                resolve([200, data, 'favicon'])
            } else {
                resolve([405, undefined, 'html']);
            }
        } catch (err) {
            console.log(err)
            reject([500, "server error", 'html'])
        }
    })
}

exports.public = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (data.method === "get") {
                const assetName = data.trimmedPath.replace("public/", "").trim();
                if (assetName) {
                    const assetNameData = await getStaticAsset(assetName)
                    if (!assetNameData) {
                        return resolve([400]);
                    }
                    const allowExt = [".css", ".png", ".jpg", ".ico", ".js"];
                    const contentTypeObj = {
                        "css": "css",
                        "png": "png",
                        "jpg": "jpg",
                        "ico": "favicon"
                    }
                    const arrayOfName = assetName.split(".")
                    if (allowExt.includes(`.${arrayOfName[arrayOfName.length - 1]}`)) {
                        const contentType = arrayOfName[arrayOfName.length - 1]
                        return resolve([200, assetNameData, contentTypeObj[contentType] ? contentTypeObj[contentType] : "plain"])
                    } else {
                        return resolve([404]);
                    }
                } else {
                    return resolve([404]);
                }
            } else {
                return resolve([405, undefined, 'html']);
            }
        } catch (err) {
            reject([500, "server error", 'html'])
        }
    })
}


/**
 * 
 *  JSON API Handlers 

*/


// Users
exports.users = (data) => {
    return new Promise((resolve, rejects) => {
        const acceptableMethods = ['post', 'get', 'put', 'delete']
        if (acceptableMethods.includes(data.method)) {
            handlers._users[data.method](data, resolve, rejects)
        } else {
            rejects([405])
        }
    })
}


// Continer for the users submethods
handlers._users = {}

handlers._users.get = async (data, resolve, reject) => {
    let {
        queryStringObject: {
            phone
        },
        headers: {
            token
        }
    } = data

    phone = typeof (phone) === 'string' && phone.trim().length === 10 ? phone : false
    if (!phone) {
        resolve([400, { error: "Phone not found to find user" }])
    }



    try {
        if (!token) {
            resolve([401, { error: "Invalid token!" }])
        }
        const isInvalid = await handlers._tokens.verfiyToken(token, phone)
        console.log(isInvalid)
        if (!isInvalid) {
            resolve([401, { error: "Invalid token!" }])
        }


        const user = await readData('users', phone)
        if (!user) {
            resolve([404, { "error": "user not found!" }])
        }

        // delete password from returning data
        delete user.password

        resolve([200, { user }])

    } catch (err) {
        console.log(err)
        reject("server error")
    }
}

handlers._users.post = async (data, resolve, reject) => {
    let {
        payload: {
            firstName,
            lastName,
            phone,
            password,
            toAgreement
        }
    } = data;

    // Check that all require field are filled out
    firstName = typeof (firstName) === 'string' && firstName.trim().length > 0 ? firstName : false
    lastName = typeof (lastName) === 'string' && lastName.trim().length > 0 ? lastName : false
    phone = typeof (phone) === 'string' && phone.trim().length === 10 ? phone : false
    password = typeof (password) === 'string' && password.trim().length > 5 ? password : false
    toAgreement = typeof (toAgreement) === 'boolean' && toAgreement === true ? true : false

    if (!firstName || !lastName || !phone || !password || !toAgreement) {
        resolve([400, { error: 'missing require fields' }]);
    }

    // Make sure that user does not exist
    try {
        const user = await readData("users", phone);
        if (user) {
            resolve([400, { error: "This user already exist." }])
        }

        // Hash password
        const hashedPassword = hash(password)

        if (!hashedPassword) {
            throw new Error("There are problem with hashing password.")
        }

        // user object
        const userData = {
            firstName,
            lastName,
            phone,
            password: hashedPassword,
            toAgreement
        }

        // Store to user
        await writeData('users', phone, userData)

        resolve([200])

    } catch (err) {
        console.log(err)
        reject([500, { error: 'Could not create the new user.' }])
    }

}

handlers._users.put = async (data, resolve, reject) => {
    let {
        queryStringObject: {
            phone
        },
        payload: {
            firstName,
            lastName,
            password
        },
        headers: {
            token
        }
    } = data

    phone = typeof (phone) === 'string' && phone.trim().length === 10 ? phone : false
    if (!phone) {
        resolve([400, { error: "Phone not found to find user" }])
    }

    try {
        if (!token) {
            return resolve([401, { error: "Invalid token!" }])
        }
        const isInvalid = await handlers._tokens.verfiyToken(token, phone)
        console.log(isInvalid)
        if (!isInvalid) {
            return resolve([401, { error: "Invalid token!" }])
        }


        const user = await readData('users', phone)
        if (!user) {
            resolve([404, { "error": "user not found!" }])
        }

        // Check that all field are filled out
        firstName = typeof (firstName) === 'string' && firstName.trim().length > 0 ? firstName : false
        lastName = typeof (lastName) === 'string' && lastName.trim().length > 0 ? lastName : false
        password = typeof (password) === 'string' && password.trim().length > 5 ? password : false

        // check if no add to update
        if (!firstName && !lastName && !password) {
            resolve([400, { error: "No field found to update it." }])
        }

        if (firstName) user.firstName = firstName
        if (lastName) user.lastName = lastName
        if (password) user.password = hash(password)

        await updateData("users", user.phone, user)

        resolve([200])

    } catch (err) {
        console.log(err)
        reject("server error")
    }

}

handlers._users.delete = async (data, resolve, reject) => {
    let {
        queryStringObject: {
            phone
        },
        headers: {
            token
        }
    } = data

    phone = typeof (phone) === 'string' && phone.trim().length === 10 ? phone : false
    if (!phone) {
        resolve([400, { error: "Phone not found to find user" }])
    }

    try {
        if (!token) {
            return resolve([401, { error: "Invalid token!" }])
        }
        const isInvalid = await handlers._tokens.verfiyToken(token, phone)
        if (!isInvalid) {
            return resolve([401, { error: "Invalid token!" }])
        }

        const user = await readData('users', phone)
        if (!user) {
            resolve([404, { "error": "user not found!" }])
        }

        // delete all checks user
        for (let check of user.checks) {
            await deleteFile("checks", check)
        }

        // delete user
        await deleteFile("users", phone)
        resolve([200])
    } catch (err) {
        console.log(err)
        reject("server error")
    }

}


// tokens
exports.tokens = (data) => {
    return new Promise((resolve, rejects) => {
        const acceptableMethods = ['post', 'get', 'put', 'delete']
        if (acceptableMethods.includes(data.method)) {
            handlers._tokens[data.method](data, resolve, rejects)
        } else {
            rejects([405])
        }
    })
}

// container for all the token methods 
handlers._tokens = {}

handlers._tokens.get = async (data, resolve, reject) => {
    let {
        queryStringObject: {
            token
        }
    } = data

    if (!token) {
        resolve([400, { error: "required field missing" }])
    }

    try {
        const tokenObject = await readData("tokens", token)
        if (!tokenObject) {
            resolve([404, { error: "not found token" }])
        }

        resolve([200, { tokenDate: tokenObject }])

    } catch (err) {
        console.log(err)
        reject([500, { error: "server error" }])
    }
}

handlers._tokens.post = async (data, resolve, reject) => {
    let {
        payload: {
            phone,
            password
        }
    } = data

    phone = typeof (phone) === 'string' && phone.trim().length === 10 ? phone : false
    password = typeof (password) === 'string' && password.trim().length > 5 ? password : false

    if (!phone || !password) {
        resolve([400, { error: "there are missing required data" }])
    }

    try {
        const user = await readData("users", phone)
        if (!user) {
            resolve([404, { error: "this user not found" }])
        }

        const hashedPassword = hash(password)
        if (hashedPassword !== user.password) {
            resolve([400, { error: "password not match!" }])
        }

        // create a new token with random name. set experation date 1 hour
        const token = createRandomString(20)
        const expires = Date.now() + 1000 * 60 * 60

        const tokenObject = {
            phone,
            token,
            expires
        }

        // store the token
        await writeData('tokens', token, tokenObject)
        resolve([200, { user: tokenObject }])
    } catch (err) {
        console.log(err);
        reject([500, { error: "server error" }])
    }

}
handlers._tokens.put = async (data, resolve, reject) => {
    let {
        payload: {
            token,
            extend
        }
    } = data

    token = typeof (token) === 'string' && token.trim().length === 20 ? token : false
    extend = extend === true ? true : false
    if (!token || !extend) {
        resolve([400, { error: "missing require fields" }])
    }

    try {
        // lookup the tooken
        const tokenDate = await readData("tokens", token)
        if (!tokenDate) {
            resolve([404, { error: "token does not exist" }])
        }

        if (tokenDate.expires < Date.now()) {
            resolve([400, { error: "token has already expired" }])
        }

        tokenDate.expires = Date.now() + 1000 * 60 * 60
        await updateData("tokens", token, tokenDate)

        resolve([200])
    } catch (err) {
        console.log(err)
        reject([500, { error: "server error" }])
    }
}
handlers._tokens.delete = async (data, resolve, reject) => {
    let {
        queryStringObject: {
            token
        }
    } = data

    if (!token) {
        resolve([400, { error: "required field missing" }])
    }

    try {
        const tokenObject = await readData("tokens", token)
        if (!tokenObject) {
            resolve([404, { error: "not found token" }])
        }

        await deleteFile("tokens", token)
        resolve([200])
    } catch (err) {
        console.log(err)
        reject([500, { error: "server error" }])
    }
}


handlers._tokens.verfiyToken = async (token, phone) => {
    try {
        const tokenData = await readData("tokens", token)
        if (token.expires > Date.now() || tokenData.phone === phone) {
            return true
        }

        return false
    } catch (err) {
        console.log(err)
        return false
    }
}


// Checks
exports.checks = (data) => {
    return new Promise((resolve, rejects) => {
        const acceptableMethods = ['post', 'get', 'put', 'delete']
        if (acceptableMethods.includes(data.method)) {
            handlers._checks[data.method](data, resolve, rejects)
        } else {
            rejects([405])
        }
    })
}

// container for all the token methods 
handlers._checks = {}

handlers._checks.post = async (data, resolve, reject) => {
    let {
        payload: {
            protocal,
            url,
            method,
            sucessCode,
            timeoutSeconds
        },
        headers: {
            token
        }
    } = data

    // validate inputs
    protocal = ['http', 'https'].includes(protocal) ? protocal : false
    url = typeof (url) === 'string' && url.length > 0 ? url.trim() : false
    method = ['post', 'put', 'get', 'delete'].includes(method) ? method : false
    sucessCode = typeof (sucessCode) === 'object' && sucessCode instanceof Array && sucessCode.length > 0 ? sucessCode : false
    timeoutSeconds = typeof (timeoutSeconds) === 'number' && timeoutSeconds % 1 === 0 && timeoutSeconds >= 1 && timeoutSeconds < 5 ? timeoutSeconds : false

    if (!protocal || !url || !method || !sucessCode || !timeoutSeconds) {
        resolve([400, { error: "missing required field" }])
    }

    try {
        if (!token) {
            return resolve([401, { error: "Invalid token!" }])
        }

        // Get user by reading token
        const tokenDate = await readData("tokens", token)
        if (!tokenDate) {
            resolve([403])
        }

        // get user by reading phone from token
        const user = await readData("users", tokenDate.phone)
        if (!user) {
            resolve([403])
        }

        const userChecks = typeof (user.checks) === 'object' && user.checks instanceof Array ? user.checks : []

        // verify that user has less than the number of max checks per user
        if (userChecks.length >= maxChecks) {
            resolve([400, { error: "the user has already the max number of checks" }])
        }

        // create a random id for checks
        const checkId = createRandomString(20)

        // create check object and includes the user phone
        const checkObject = {
            id: checkId,
            userPhone: user.phone,
            protocal,
            url,
            method,
            sucessCode,
            timeoutSeconds
        }

        await writeData("checks", checkId, checkObject)

        // add check id to user object
        user.checks = [...userChecks, checkId]
        await updateData("users", user.phone, user)

        resolve([200, checkObject])
    } catch (err) {
        console.log(err)
        reject([500, { error: "server error" }])
    }
}

handlers._checks.get = async (data, resolve, reject) => {
    let {
        queryStringObject: {
            id
        },
        headers: {
            token
        }
    } = data

    if (!id) {
        resolve([400, { error: "Missing required fields" }])
    }

    try {
        // lookup the check
        const checkData = await readData("checks", id)
        if (!checkData) {
            resolve([404])
        }

        if (!token) {
            return resolve([403, { error: "Invalid token!" }])
        }
        const isInvalid = await handlers._tokens.verfiyToken(token, checkData.userPhone)
        if (!isInvalid) {
            return resolve([403, { error: "Invalid token!" }])
        }

        // return the check data
        resolve([200, { checkData }])
    } catch (err) {
        console.log(err)
        reject("server error")
    }
}

handlers._checks.put = async (data, resolve, reject) => {
    let {
        payload: {
            protocal,
            url,
            method,
            sucessCode,
            timeoutSeconds
        },
        queryStringObject: {
            id
        },
        headers: {
            token
        }
    } = data

    // check require field
    if (!id) {
        resolve([400, { error: "Missing required fields" }])
    }

    // validate inputs
    protocal = ['http', 'https'].includes(protocal) ? protocal : false
    url = typeof (url) === 'string' && url.length > 0 ? url.trim() : false
    method = ['post', 'put', 'get', 'delete'].includes(method) ? method : false
    sucessCode = typeof (sucessCode) === 'object' && sucessCode instanceof Array && sucessCode.length > 0 ? sucessCode : false
    timeoutSeconds = typeof (timeoutSeconds) === 'number' && timeoutSeconds % 1 === 0 && timeoutSeconds >= 1 && timeoutSeconds < 5 ? timeoutSeconds : false

    if (!protocal && !url && !method && !sucessCode && !timeoutSeconds) {
        resolve([400, { error: "Missing field to update it!" }])
    }

    try {
        // lookup the check
        const checkData = await readData("checks", id)
        if (!checkData) {
            resolve([404])
        }

        if (!token) {
            return resolve([403, { error: "Invalid token!" }])
        }
        const isInvalid = await handlers._tokens.verfiyToken(token, checkData.userPhone)
        if (!isInvalid) {
            return resolve([403, { error: "Invalid token!" }])
        }

        // update this data if found it
        if (url) checkData.url = url
        if (protocal) checkData.protocal = protocal
        if (method) checkData.method = methods
        if (timeoutSeconds) checkData.timeoutSeconds = timeoutSeconds

        await updateData("checks", id, checkData)
        resolve([200])
    } catch (err) {
        console.log(err)
        reject([500, { error: "server error" }])
    }
}


handlers._checks.delete = async (data, resolve, reject) => {
    const {
        queryStringObject: {
            id
        },
        headers: {
            token
        }
    } = data


    // check require field
    if (!id) {
        resolve([400, { error: "Missing required fields" }])
    }

    try {
        // lookup the check
        const checkData = await readData("checks", id)
        if (!checkData) {
            resolve([404])
        }

        if (!token) {
            return resolve([403, { error: "Invalid token!" }])
        }
        const isInvalid = await handlers._tokens.verfiyToken(token, checkData.userPhone)
        if (!isInvalid) {
            return resolve([403, { error: "Invalid token!" }])
        }

        await deleteFile("checks", id)


        // get user by reading phone
        const user = await readData("users", checkData.userPhone)
        if (!user) {
            resolve([403])
        }
        // remover check from user
        user.checks = user.checks.filter(checkId => checkId !== id)
        await updateData("users", checkData.userPhone, user)

        resolve([200])
    } catch (err) {
        console.log(err)
        reject([500, { error: "server error" }])
    }
}

// ping handler
exports.ping = () => {
    return new Promise((resolve) => {
        resolve([200])
    })
}


// Not found handler
exports.notFound = () => {
    return new Promise((resolve) => {
        resolve([404])
    })
}