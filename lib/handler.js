const { hash } = require("./helper")
const { readData, writeData } = require("./data")

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

handlers._users.get = (data, resolve, reject)=>{
    
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
    password = typeof(password) === 'string' && phone.trim().length > 5 ? password : false
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

handlers._users.put = (data, resolve, reject)=>{
    
}

handlers._users.delete = (data, resolve, reject)=>{
    
}

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