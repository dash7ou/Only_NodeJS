
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

handlers._users.post = (data, resolve, reject)=>{
    const {
        payload:{
            firstName,
            lastName,
            phone,
            password,
            toAgreement
        }
    } = data;

    // Check that all require field are filled out
    const firstName = typeof(firstName) === 'string' && firstName.trim().length > 0 ? firstName : false
    const lastName = typeof(lastName) === 'string' && lastName.trim().length > 0 ? lastName : false
    const phone = typeof(phone) === 'string' && phone.length.trim() === 10 ? phone : false
    const password = typeof(password) === 'string' && phone.length.trim() > 5 ? password : false
    const toAgreement = typeof(toAgreement) === 'boolean' && toAgreement === true ? true : false

    if(!firstName || !lastName || !phone || !password || !toAgreement ){
        reject([400, {error: 'missing require fields'}]);
    }

    // Make sure that user does not exist
    try{
        const user = await getData("users", phone);
        if(!user){
            reject([400, {error: "This user already exist."}])
        }

        // Hash password
    }catch(err){

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