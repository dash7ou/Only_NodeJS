class App {

    constructor(sessionToken = false) {
        this.sessionToken = sessionToken
    }

    request(headers = {}, path = "/", method, queryString = {}, payload = {}) {
        return new Promise((resolve, reject) => {
            method = typeof (method) === 'string' && ["POST", "GET", "DELETE", "PUT"].includes(method) ? method.toUpperCase() : "GET";

            // For each query string parameter sent, add it to the path
            const requestQueryLength = Object.keys(queryString).length;
            const requestUrl = Object.keys(queryString).reduce((acc, curr, index) => {
                return `${acc}${curr}=${queryString[curr]}${index !== requestQueryLength -1 && "&"}`
            }, path + "?")

            // from the http request as a JSON type
            const xhr = new XMLHttpRequest();
            xhr.open(method, requestUrl, true);
            xhr.setRequestHeader("Content-Type", "application/json");

            // for each header set add it to the request
            for (let headerKey in headers) {
                xhr.setRequestHeader(headerKey, headers[headerKey])
            }

            // If there a current session token set, add that as a header
            if (this.sessionToken) {
                xhr.setRequestHeader("token", this.sessionToken.id)
            }

            // when the request come back, handle the response
            xhr.onreadystatechange = () => {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    const statusCode = xhr.status;
                    const responseReturned = xhr.responseText;


                    try {
                        resolve({
                            statusCode,
                            responseReturned: JSON.parse(responseReturned)
                        })
                    } catch (err) {
                        return reject(statusCode, false)
                    }
                }
            }

            // send the payload as JSON
            xhr.send(JSON.stringify(payload))

        })
    }

    // Bind the forms
    bindForms() {
        document.querySelector("form").addEventListener("submit", function (e) {

            // Stop it from submitting
            e.preventDefault();
            var formId = this.id;
            var path = this.action;
            var method = this.method.toUpperCase();

            // Hide the error message (if it's currently shown due to a previous error)
            document.querySelector("#" + formId + " .formError").style.display = 'hidden';

            // Turn the inputs into a payload
            var payload = {};
            var elements = this.elements;
            for (var i = 0; i < elements.length; i++) {
                if (elements[i].type !== 'submit') {
                    var valueOfElement = elements[i].type == 'checkbox' ? elements[i].checked : elements[i].value;
                    payload[elements[i].name] = valueOfElement;
                }
            }

            console.log(payload)

            // Call the API
            const {
                statusCode,
                responsePayload
            } = await this.request(undefined, path, method, undefined, payload);


            // Display an error on the form if needed
            if (statusCode !== 200) {

                // Try to get the error from the api, or set a default error message
                var error = typeof (responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';

                // Set the formError field with the error text
                document.querySelector("#" + formId + " .formError").innerHTML = error;

                // Show (unhide) the form error field on the form
                document.querySelector("#" + formId + " .formError").style.display = 'block';

            } else {
                // If successful, send to form response processor
                this.formResponseProcessor(formId, payload, responsePayload);
            }

        });
    };

    // Form response processor
    formResponseProcessor(formId, requestPayload, responsePayload) {
        var functionToCall = false;
        if (formId == 'accountCreate') {
            // @TODO Do something here now that the account has been created successfully
            console.log("form submit success :)")
        }
    };


    // Init (bootstrapping)
    async init() {
        // Bind all form submissions
        this.bindForms();
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