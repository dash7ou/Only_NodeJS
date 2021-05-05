class App {

    constructor(sessionToken = false) {
        this.sessionToken = sessionToken
    }

    async request(headers = {}, path = "/", method, queryString = {}, payload = {}) {
        return new Promise((resolve, reject) => {
            method = typeof (method) === 'string' && ["POST", "GET", "DELETE", "PUT"].includes(method) ? method.toUpperCase() : "GET";

            // For each query string parameter sent, add it to the path
            const requestQueryLength = Object.keys(queryString).length;
            const requestUrl = Object.keys(queryString).reduce((acc, curr, index) => {
                return `${acc}${curr}=${queryString[curr]}${index !== requestQueryLength -1 && "&"}`
            }, path + "?")

            // from the http request as a JSON type
            const xhr = new XMLHttpRequest();

            // If there a current session token set, add that as a header
            if (this.sessionToken) {
                xhr.setRequestHeader("token", this.sessionToken.id)
            }

            // when the request come back, handle the response
            xhr.onreadystatechange = () => {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    const statusCode = xhr.status;
                    const responseReturned = xhr.responseText;

                    console.log(responseReturned)

                    try {
                        resolve({
                            statusCode,
                            responsePayload: JSON.parse(responseReturned)
                        })
                    } catch (err) {
                        return reject(statusCode, false)
                    }
                }
            }

            // for each header set add it to the request
            xhr.open(method, requestUrl, true);
            for (let headerKey in headers) {
                xhr.setRequestHeader(headerKey, headers[headerKey])
            }
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            // send the payload as JSON
            xhr.send(JSON.stringify(payload))

        })
    }

    // Bind the forms
    async bindForms() {
        if (document.querySelector("form")) {

            document.querySelector("form").addEventListener("submit", (e) => {
                // Stop it from submitting
                e.preventDefault();

                console.log(e)
                var formId = e.target.id;
                var path = e.target.action;
                var method = e.target.method.toUpperCase();

                // Hide the error message (if it's currently shown due to a previous error)
                document.querySelector("#" + formId + " .formError").style.display = 'hidden';

                // Turn the inputs into a payload
                var payload = {};
                var elements = e.target.elements;
                for (var i = 0; i < elements.length; i++) {
                    if (elements[i].type !== 'submit') {
                        var valueOfElement = elements[i].type == 'checkbox' ? elements[i].checked : elements[i].value;
                        payload[elements[i].name] = valueOfElement;
                    }
                }

                console.log(this)

                // Call the API
                this.request(undefined, path, method, undefined, payload).then(({
                    statusCode,
                    responsePayload
                }) => {
                    // Display an error on the form if needed
                    if (statusCode !== 200) {

                        // Try to get the error from the api, or set a default error message
                        var error = typeof (responsePayload.error) == 'string' ? responsePayload.error : 'An error has occured, please try again';

                        // Set the formError field with the error text
                        document.querySelector("#" + formId + " .formError").innerHTML = error;

                        // Show (unhide) the form error field on the form
                        document.querySelector("#" + formId + " .formError").style.display = 'block';

                    } else {
                        // If successful, send to form response processor
                        this.formResponseProcessor(formId, payload, responsePayload);
                    }
                });
            });
        }
    };

    // Form response processor
    formResponseProcessor(formId, requestPayload, responsePayload) {
        var functionToCall = false;
        if (formId == 'accountCreate') {

        }
    };


    // Init (bootstrapping)
    async init() {
        // Bind all form submissions
        await this.bindForms();
    };
}

// Call the init processes after the window loads
window.onload = function () {
    const app = new App();
    app.init();
};


// const RequestCus = new App();
// RequestCus.request(undefined, "api/users", "GET").then((data) => console.log(data)).catch(err => console.log(err));

// test comment