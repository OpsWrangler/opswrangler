#!/usr/bin/env node

/**
 * ow.js
 * This is the CLI frontend to OpsWrangler functions. 
 * 
 * It:
 * - Parses the CLI command
 * - Pulls out the function name
 * - Sets the rest of the params as args to the function
 * - Executes the function
 * 
 * Example usage:
 * node ow AWSECSWrangleASG [region] [clustername]
 */


export const ow = async (event) => {

    try {
        // Parse the CLI string
        const cliString = Array.from(process.argv);
        const params = cliString.splice(process.execArgv.length + 2);

        // Check to see if there are any arguments to cw.js
        if (params == '') throw "No arguments provided. Please provide at least a function name to execute.";

        // Parse the arguments to cw.js, the first one is the functionName, the others are args to the function
        let functionName = params[0];
        const args = params.slice(1);

        // Run the function and wait
        let functionToRun = await import(`./functions/${functionName}.js`);
        await functionToRun.default(...args);

        } catch (err) {
            console.log("Error", err);
    } 
}

ow();
