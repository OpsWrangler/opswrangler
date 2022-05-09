# -= ow.js =-
OpsWrangler is: 
- A set of scripts, "Functions", geared toward:
  - cloud ops
  - cluster ops
## -= Running =-
OpsWrangler Functions are intentionally self contained, so they can be run via the CLI or independently interface with your code.

- Via the CLI:

`node cw AWSECSWrangleASG us-west-2 cluster01`

- As an ES6+ module from your code:

```
const wrangle = await import('ow/functions/AWSECSWrangleASG.js');
await wrangle.run('us-east-1', 'cluster01');
```

- As an ES6+ module fron the CLI:
```
OW_CLUSTER=somecluster
OW_REGION=us-west-1
node ./functions/AWSECSWrangleASG.js
```

- As a Lambda cron job, utilizing Serverless framework. To deploy:

```
npm install -g serverless

cd examples/serverlessFramework
npm install
sls deploy --stage prod
```

## -= The Functions =-

### AWSECSRunOnAllTasks
This function takes a cluster name and via ECS Exec runs a cli command on all of the active tasks in said cluster. It returns the console output from each execution.

### AWSECSWrangleASG
As Auto Scaling Groups grow and shrink, they can get into a non-optimal state, whereby there are too many EC2 instances warranted for the tasks demand. `AWSWrangleASG` will analyze an ECS cluster, a given or default ASG, and gracefully downsize that ASG if possible. FYI the condition that this function remedies has spawned a number of old GitHub issues: 
- https://github.com/aws/containers-roadmap/issues/42
- https://github.com/aws/containers-roadmap/issues/105
- https://github.com/aws/containers-roadmap/issues/1150
