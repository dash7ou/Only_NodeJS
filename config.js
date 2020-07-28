/**
 * Create and export configuration variables
 *
 */


//container for all the environments

const environments = {};

//staging (default) environment
environments.stating = {
    port: 3000,
    envName: 'staging'
};

//production environments
environments.production = {
  port: 5000,
  envName: 'production'
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