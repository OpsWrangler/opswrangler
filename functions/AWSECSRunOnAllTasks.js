/**
 * @name AWSECSRunOnAllTasks
 * 
 * Takes a cluster name, and a command to run, and:
 * - Enumerates the active tasks
 * - For each task:
 *   - Utilizes ECS Exec to run a command on the task
 *   - Waits for the command to complete
 *   - echo's the logs from the command execution
 *   - Waits for x number of seconds
 *   - Runs the command on the next task
 * 
 * @param {String} OW_REGION The region name
 * @param {String} OW_CLUSTER The cluster name
 * @param {String} OW_COMMANDTORUN The command to run
 * 
 */

// These 2 imports are used to check if the function is run directly from the CLI vs as an ES6 module
import { fileURLToPath } from 'url';
import process from 'process';

import {
    ECSClient,
    ListTasksCommand,
    ExecuteCommandCommand,
    DescribeTasksCommand,
    DescribeTaskDefinitionCommand
} from "@aws-sdk/client-ecs";

import { 
    CloudWatchLogsClient, 
    GetLogEventsCommand 
} from "@aws-sdk/client-cloudwatch-logs";

const waitTimeBetweenTasksSeconds = 5;

export default async function run() {

    try {

        const params = {
            region: arguments[0] || process.env.OW_REGION || "",
            Region: arguments[0] || process.env.OW_REGION || "",
            cluster: arguments[1] || process.env.OW_CLUSTER || "",
            Cluster: arguments[1] || process.env.OW_CLUSTER || "",
            commandToRun: arguments[2] || process.env.OW_COMMANDTORUN || ""
        };

        const ecsclient = new ECSClient(params);
        const cwclient = new CloudWatchLogsClient(params);

        // List the running tasks given the cluster name
        const tasksToRunOn = await ecsclient.send(
            new ListTasksCommand({
                cluster: params.cluster,
                desiredStatus: "RUNNING"
            }))


        // For each task, use ECS Exec to run the command
        for (const taskToRunOn of tasksToRunOn.taskArns) {
            console.log(`Running command on task: ${taskToRunOn}`);
            const thisTask = await ecsclient.send(
                new ExecuteCommandCommand({
                    cluster: params.cluster,
                    task: taskToRunOn,
                    command: params.commandToRun,
                    interactive: true 
                }))

            // Get the task info for the task we are going to run the command in
            const thisTaskOutput = await ecsclient.send(
                new DescribeTasksCommand({
                    cluster: params.cluster,
                    tasks: [thisTask.taskArn]
                }))
            
            // Get the task definition
            const thisTaskOutputFiltered = thisTaskOutput.tasks.find(x => x.taskArn == thisTask.taskArn);    
            
            // Get the log group using the task definition
            const thisTasksTaskDefinition = await ecsclient.send(
                new DescribeTaskDefinitionCommand({
                    cluster: params.cluster,
                    taskDefinition: thisTaskOutputFiltered.taskDefinitionArn
                }))
            const thisTasksLogGroup = thisTasksTaskDefinition.taskDefinition.containerDefinitions[0].logConfiguration.options['awslogs-group'];

           // Wait 5 seconds for the log stream to be created
           await new Promise(x => setTimeout(x, 5000));

           // Get the logs and echo them to console
           const thisTasksLogs = await cwclient.send(
            new GetLogEventsCommand({
                logGroupName: thisTasksLogGroup,
                logStreamName: thisTask.session.sessionId
            }))
            console.log(`Command output (from Cloudwatch log stream ${thisTasksLogGroup}/${thisTask.session.sessionId}):`);
            console.log(thisTasksLogs.events[0].message);

            // Wait to loop this again, executing the command on the next task
            await new Promise(x => setTimeout(x, (waitTimeBetweenTasksSeconds * 1000)));
        }
    
    } catch (err) {
        console.log("Error", err);
    }

}

// Check if the function was run from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    run();
}