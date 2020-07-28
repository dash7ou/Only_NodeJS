/**
 * Create and export configuration variables
 *
 */

//container for all the environments

const environments = {};

//staging (default) environment
environments.stating = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "stating",
  hashingSecret: "thisIsAlsoSecret",
  maxChecks: 5,
  twilio: {
    accountSid: "AC91ecf92684ed4074a4c1ab75a8c3eb53",
    authToken: "f02d1f9497c279f689fd5d670f4917d4",
    fromPhone: "+17207535490"
  }
};

//production environments
environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: "production",
  hashingSecret: "thisIsAlsoSecret",
  maxChecks: 5,
  twilio: {
    accountSid: "",
    authToken: "",
    fromPhone: ""
  }
};

//Determine which environment was passed as a command-line argument
let currentEnvironment =
  typeof process.env.NODE_ENV == "string"
    ? process.env.NODE_ENV.toLowerCase()
    : "";

//check that the current environment is one of the above, if nor, default to staging
let environmentToExport =
  typeof environments[currentEnvironment] == "object"
    ? environments[currentEnvironment]
    : environments.stating;

//Export the module
module.exports = environmentToExport;