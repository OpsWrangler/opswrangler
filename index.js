#!/usr/bin/env node

const wrangle = await import('./functions/AWSECSWrangleASG.js');

// Set the region for Cloud Wrangler function
process.env.CW_VAR_1 = 'us-west-2';

const clusters = ['engine-stg', 'engine-stg']

const main = async () => {

  for (var aCluster in clusters) {
    try {
      
      // Set env vars for Cloud Wrangler function
      process.env.CW_VAR_2 = aCluster;
      
      // Run the function and wait
      await wrangle.run();
      
        } catch (err) {
          console.error("Error", err);
      }    
  }
};

main();
