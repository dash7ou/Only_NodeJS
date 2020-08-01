const path = require('path')
const fs = require("fs")
const http = require("http")
const https = require("https")
const url = require("url")
const { list, readData, updateData } = require("./data")
const {} = require("./helper")
const { throws, rejects } = require('assert')
const { resolve } = require('path')

class Worker{
    constructor(){
        this.data = null
        this.moduleToUse = http
        // perepate the iniial check outcome
        this.checkOutCome = {
            error: false,
            responseCode: false
        }
    }

    // Sanity-check the check data
    validateCheckData(){
        return new Promise((resolve, rejects)=>{
            let {
                id,
                protocal,
                userPhone,
                url,
                method,
                sucessCode,
                timeoutSeconds
            } = this.data
    
            protocal = ['http', 'https'].includes(protocal) ? protocal : false
            url = typeof(url) === 'string' && url.length > 0 ? url.trim() : false
            method = ['post','put', 'get', 'delete'].includes(method) ? method : false
            sucessCode = typeof(sucessCode) === 'object' && sucessCode instanceof Array && sucessCode.length > 0 ? sucessCode : false
            timeoutSeconds = typeof(timeoutSeconds) === 'number' && timeoutSeconds % 1 === 0  && timeoutSeconds >= 1 && timeoutSeconds < 5 ? timeoutSeconds : false    
    
            this.data.state = ['up', 'down'].includes(this.data.state) ? this.data.state : 'down'
            this.data.lastChecked = typeof(this.data.lastChecked) === 'number' ? this.data.lastChecked : false
    
    
            if(!protocal || !id || !userPhone || !url || !method || !sucessCode || !timeoutSeconds){
                cosnoel.log("Error: One of the checks is not properly formatted. Skipping it.")
            }else{
                this.performCheck(resolve , rejects)
            }
        })
       
    }

    // Perform the check, send the orginal check data and the outcome of the check process
    performCheck(resolve, reject){
        // mark that the outcome has not been sent yet
        let outcomeSend = false

        // parse the hostname and the path out of the original check data
        const parseUrl = url.parse(`${this.data.protocal}://${this.data.url}`, true)
        const hostName = parseUrl.hostname;
        const path = parseUrl.path // using path not pathname because we want the query string

        // Construct the request
        const requestDetails = {
            protocal: this.data.protocal+":",
            hostname: hostName,
            method: this.data.method.toUpperCase(),
            path,
            timeout: this.data.timeoutSeconds * 1000
        }

        // Instantiate the request object ( using either the http / https module )
        this.moduleToUse = this.data.protocal === 'http' ? http : https
        const req = this.moduleToUse.request(requestDetails, async (res)=>{
            // get the status of the sent request
            const status = res.statusCode

            // Update the checkoutcome and pass the data along
            this.checkOutCome.responseCode = status;
            if(!outcomeSend){
                this.processCheckOutCome(resolve, reject)
                outcomeSend = true
            }
        })

        // the error event 
        req.on('error', (err)=>{
            // Update the checkoutcome and pass the data along
            this.checkOutCome.error= {
                error: true,
                value: err
            }

            if(!outcomeSend){
                this.processCheckOutCome(resolve, reject)
                outcomeSend = true
            }
        })

        // timeout event
        req.on('timeout',  (err)=>{
            // Update the checkoutcome and pass the data along
            this.checkOutCome.error= {
                error: true,
                value: "timeout"
            }

            if(!outcomeSend){
                this.processCheckOutCome(resolve, reject)
                outcomeSend = true
            }
        })

        // end request
        req.end()
    }

    // process the check outcome,update the check data as needed, trigger an alert to the user if needed
    // Special logic for accomodating a check that has never been tested before ( do not alert that one)
    async processCheckOutCome(resolve, reject){
        const state = !this.checkOutCome.error && this.checkOutCome.responseCode && this.data.sucessCode.includes(this.checkOutCome.responseCode) ? 'up' : 'down'

        // Decide if an alert is warranted
        const alertWarranted = this.data.state !== state ? true : false

        // Update the check data
        const newCheckData = this.data
        newCheckData.state = state
        newCheckData.lastChecked = Date.now()

        if(alertWarranted){
            // save the updates
            await updateData("checks", this.data.id, newCheckData)
            this.data = newCheckData
            this.alertUserToStatusChange(resolve, resolve)
        }else{
            console.log("Check outcome has not changed, no alert needed")
            resolve()
        }
    }

    // TODO send sms using twilio
    // alet the user as to a change in their check status
    alertUserToStatusChange(resolve){
        const message = `Alert: Your check for ${this.data.method.toUpperCase()} ${this.data.protocal}://${this.data.url} is currently ${this.data.state}`
        console.log("======>>> send sms <<<==============")
        console.log(message)
        resolve()
    }

    // Lookup all checks, get their data, send to validator
    async gatherAllChecks(){
        try{
            // Get all the checks
            const files = await list("checks")
            if(files.length === 0){
                throw new Error("Error: Could not find any check to process")
            }
            for(let file of files){
                this.checkOutCome = {
                    error: false,
                    responseCode: false
                }
                this.data = await readData("checks", file)
                await this.validateCheckData()
            }
        }catch(err){
            console.log(err)
        }
    }

    // Timer to excute the worker process once per specific time
    loop(){
        setInterval(()=>{
            this.gatherAllChecks()
        }, 1000 * 60 )
    }

    init(){
        // Execute all checks immeduately
        this.gatherAllChecks()

        // Call the loop sp the checks will excute later on
        this.loop()
    }
}


module.exports = Worker