const core = require('@actions/core');

const autoscalingGroupName = core.getInput('autoscaling_group_name')
const script = core.getInput('script')
const region = core.getInput('region')

const { SSMClient, SendCommandCommand, ListCommandInvocationsCommand } = require("@aws-sdk/client-ssm")

const ssmClient = new SSMClient({ region })

async function run() {
    console.log(`Executing script ${script} on all instances attached to ASG ${autoscalingGroupName}`)
    
    const response = await ssmClient.send(new SendCommandCommand({
        Targets: [
            {
                Key: "tag:aws:autoscaling:groupName",
                Values: [autoscalingGroupName]
            }
        ],
        DocumentName: "AWS-RunShellScript",
        Parameters: {
            commands: [script.replaceAll("\"", "\\\"")]
        },
    }))

    const commandId = response.Command.CommandId
    console.log(`Request sent. Command ID: ${commandId}. Waiting for completion...`)

    while (true) {
        await new Promise(r => setTimeout(r, 1000));

        const results = await ssmClient.send(new ListCommandInvocationsCommand({
            CommandId: commandId,
        }))

        const total = results.CommandInvocations.length
        const done = results.CommandInvocations.filter(c => c.Status == "Success" || c.Status == "Failed").length

        console.log(`Finished: ${done} / ${total}`)

        if (total == done) {
            break
        }
    }

    const results = await ssmClient.send(new ListCommandInvocationsCommand({
        CommandId: commandId,
        Details: true
    }))

    const total = results.CommandInvocations.length
    const failures = results.CommandInvocations.filter(c => c.Status == "Failed")
    if (failures.length > 0) {
        console.log(`SSM reported execution failure on ${failures.length} out of ${total} instances`)

        failures.forEach(f => {
            const instanceId = f.InstanceId
            const output = f.CommandPlugins[0].Output
            console.log("\n", `Output for failed execution on instance ${instanceId}`, "\n", output, "\n")
        })

        core.setFailed("One or more instances reported execution failure");
    }
}

run().then(() => {
    console.log("Done")
}).catch(e => {
    console.log(e)
    core.setFailed(e.message)
})