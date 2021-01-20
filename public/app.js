class App {

    constructor(sessionToken = false){
        this.sessionToken =  sessionToken
    }
    
    request (headers = {}, path = "/", queryString={}, payload={}, method){
        return new Promise((resolve, reject)=>{
            method = typeof(method) === 'string' && ["POST", "GET", "DELETE", "PUT"].includes(method) ? method.toUpperCase() : "GET";
    
            // For each query string parameter sent, add it to the path
            const requestQueryLength = Object.keys(queryString).length;
            const requestUrl = Object.keys(queryString).reduce((acc, curr, index)=>{
                return `${acc}${curr}=${queryString[curr]}${index !== requestQueryLength -1 && "&"}`
            }, path+"?")
    
            // from the http request as a JSON type
            const xhr = new XMLHttpRequest();
            xhr.open(method, requestUrl, true);
            xhr.setRequestHeader("Content-Type", "application/json");
    
            // for each header set add it to the request
            for(let headerKey in headers){
                xhr.setRequestHeader(headerKey, headers[headerKey])
            }
            
            // If there a current session token set, add that as a header
            if(this.sessionToken){
                xhr.setRequestHeader("token", this.sessionToken.id)
            }
    
            // when the request come back, handle the response
            xhr.onreadystatechange = ()=>{  
                if(xhr.readyState === XMLHttpRequest.DONE){
                    const statusCode = xhr.status;
                    const responseReturned = xhr.responseText;


                    try{
                        resolve({statusCode, responseReturned: JSON.parse(responseReturned)})
                    }catch(err){
                        reject(statusCode, false)
                    }
                }
            }
    
            // send the payload as JSON
            xhr.send(JSON.stringify(payload))
    
        })
    }
}


const RequestCus = new App();
RequestCus.request(undefined, "api/users", "GET").then((data)=> console.log(data)).catch(err=> console.log(err));

// test comment