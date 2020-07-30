const { hash, createRandomString } = require("./helper")
const { readData, writeData, updateData, deleteFile } = require("./data")

// Define the handllers
const handlers = {}


// Users
exports.users = (data)=>{
    return new Promise((resolve, rejects)=>{
        const acceptableMethods = ['post', 'get', 'put', 'delete']
        if(acceptableMethods.includes(data.method)){
            handlers._users[data.method](data, resolve, rejects)
        }else{
            rejects([405])
        }
    })
}


// Continer for the users submethods
handlers._users = {}

handlers._users.get = async (data, resolve, reject)=>{
    let {
        queryStringObject: {
            phone
        }
    } = data

    phone = typeof(phone) === 'string' && phone.trim().length === 10 ? phone : false
    if(!phone){
        resolve([400, {error: "Phone not found to find user"}])
    }
    try{
        const user = await readData('users', phone)
        if(!user){
            resolve([404, {"error": "user not found!"}])
        }

        // delete password from returning data
        delete user.password

        resolve([200, {user}])

    }catch(err){
        console.log(err)
        reject("server error")
    }
}

handlers._users.post = async (data, resolve, reject)=>{
    let {
        payload:{
            firstName,
            lastName,
            phone,
            password,
            toAgreement
        }
    } = data;

    // Check that all require field are filled out
    firstName = typeof(firstName) === 'string' && firstName.trim().length > 0 ? firstName : false
    lastName = typeof(lastName) === 'string' && lastName.trim().length > 0 ? lastName : false
    phone = typeof(phone) === 'string' && phone.trim().length === 10 ? phone : false
    password = typeof(password) === 'string' && password.trim().length > 5 ? password : false
    toAgreement = typeof(toAgreement) === 'boolean' && toAgreement === true ? true : false

    if(!firstName || !lastName || !phone || !password || !toAgreement ){
       resolve([400, {error: 'missing require fields'}]);
    }

    // Make sure that user does not exist
    try{
        const user = await readData("users", phone);
        if(user){
            resolve([400, {error: "This user already exist."}])
        }

        // Hash password
        const hashedPassword = hash(password)

        if(!hashedPassword){
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

    }catch(err){
        console.log(err)
        reject([500, {error: 'Could not create the new user.'}])
    }

}

handlers._users.put = async (data, resolve, reject)=>{
    let {
        queryStringObject: {
            phone
        },
        payload:{
            firstName,
            lastName,
            password
        }
    } = data

    phone = typeof(phone) === 'string' && phone.trim().length === 10 ? phone : false
    if(!phone){
        resolve([400, {error: "Phone not found to find user"}])
    }

    try{
        const user = await readData('users', phone)
        if(!user){
            resolve([404, {"error": "user not found!"}])
        }

        // Check that all field are filled out
        firstName = typeof(firstName) === 'string' && firstName.trim().length > 0 ? firstName : false
        lastName = typeof(lastName) === 'string' && lastName.trim().length > 0 ? lastName : false
        password = typeof(password) === 'string' && password.trim().length > 5 ? password : false

        // check if no add to update
        if(!firstName && !lastName && !password){
            resolve([400, {error: "No field found to update it."}])
        }

        if(firstName) user.firstName = firstName
        if(lastName) user.lastName = lastName
        if(password) user.password = hash(password)

        await updateData("users", user.phone, user)

        resolve([200])

    }catch(err){
        console.log(err)
        reject("server error")
    }
    
}

handlers._users.delete = async (data, resolve, reject)=>{
    let {
        queryStringObject: {
            phone
        }
    } = data

    phone = typeof(phone) === 'string' && phone.trim().length === 10 ? phone : false
    if(!phone){
        resolve([400, {error: "Phone not found to find user"}])
    }

    try{
        const user = await readData('users', phone)
        if(!user){
            resolve([404, {"error": "user not found!"}])
        }

        // delete user
        await deleteFile("users", phone)
        
        resolve([200])

    }catch(err){
        console.log(err)
        reject("server error")
    }
    
}


// tokens
exports.tokens = (data)=>{
    return new Promise((resolve, rejects)=>{
        const acceptableMethods = ['post', 'get', 'put', 'delete']
        if(acceptableMethods.includes(data.method)){
            handlers._tokens[data.method](data, resolve, rejects)
        }else{
            rejects([405])
        }
    })
}

// container for all the token methods 
handlers._tokens = {}

handlers._tokens.get  = async (data, resolve, reject)=>{
    let {
        queryStringObject: {
            token
        }
    } = data

    if(!token){
        resolve([400, {error: "required field missing"}])
    }

    try{
        const tokenObject = await readData("tokens", token)
        if(!tokenObject){
            resolve([404, {error: "not found token"}])
        }

        resolve([200, {tokenDate : tokenObject}])

    }catch(err){
        console.log(err)
        reject([500, {error: "server error"}])
    }
}

handlers._tokens.post  = async (data, resolve, reject)=>{
    let {
        payload: {
            phone,
            password
        }
    } = data

    phone = typeof(phone) === 'string' && phone.trim().length === 10 ? phone : false
    password = typeof(password) === 'string' && password.trim().length > 5 ? password : false

    if(!phone || !password){
        resolve([400, {error: "there are missing required data"}])
    }

    try{
        const user = await readData("users", phone )
        if(!user){
            resolve([404, {error: "this user not found"}])
        }

        const hashedPassword = hash(password)
        if(hashedPassword !== user.password){
            resolve([400, {error: "password not match!"}])
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
        await writeData('tokens', token,  tokenObject)
        resolve([200, { user: tokenObject }])
    }catch(err){
        console.log(err);
        reject([500, {error: "server error"}])
    }
    
}
handlers._tokens.put  = async (data, resolve, reject)=>{
    let {
        payload:{
            token,
            extend
        }
    } = data
    
    token = typeof(token) === 'string' && token.trim().length === 20 ? token : false
    extend = extend === true ? true : false
    if(!token || !extend){
        resolve([400, {error: "missing require fields"}])
    }

    try{
        // lookup the tooken
        const tokenDate = await readData("tokens", token)
        if(!tokenDate){
            resolve([404, {error: "token does not exist"}])
        }

        if(tokenDate.expires < Date.now()){
            resolve([400, {error: "token has already expired"}])
        }

        tokenDate.expires = Date.now() + 1000 * 60 * 60
        await updateData("tokens", token, tokenDate)

        resolve([200])
    }catch(err){
        console.log(err)
        reject([500, {error: "server error"}])
    }
}
handlers._tokens.delete  = (data, resolve, reject)=>{}

// ping handler
exports.ping = ()=>{
    return new Promise((resolve)=>{
        resolve([200])
    })
}


// Not found handler
exports.notFound = ()=>{
    return new Promise((resolve)=>{
        resolve([404])
    })
}