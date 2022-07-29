let cmd = "sudo \"set-version.sh\" \\\" \\\" $(git rev-parse --short HEAD) && sudo install-current-version.sh"


console.log(`command="${cmd.replaceAll("\"", "\\\"")}"`)