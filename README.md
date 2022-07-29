# AWS SSM ASG action

This action executes a shell script on all instances attached to an Autoscaling Group. It can be used, for example to perform in-place deployments.

## Inputs

## `script`

**Required** Shell command to execute

## `region`

**Required** AWS region where to perform this action

## `autoscaling_group_name`

**Required** Name of the ASG whose instances to execute the command on