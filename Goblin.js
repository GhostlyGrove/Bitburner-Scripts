/** @param {NS} ns **/
export async function main(ns) {
  const script = "earlyGameHack.js";
  const target = "joesguns";
  let myServers = ns.readPort(2);

  ns.tprint("The Goblin is here to help. He will try to start making you some money.");

  while (true) {
    const portCheck = ns.readPort(2);

    if (portCheck != "NULL PORT DATA") {
      myServers = portCheck;  // Get list of purchased servers and add home server to the list
    }

    // Get the maximum RAM on the home server
    const homeMaxRAM = ns.getServerMaxRam("home");

    // Iterate over each server to deploy the earlyGameHack.js script
    for (const server of myServers) {
      const maxRAM = ns.getServerMaxRam(server);
      const scriptRAM = ns.getScriptRam(script);

      // Calculate the maximum number of threads that can be run on the server using max RAM
      let threadsAvailable = Math.floor(maxRAM / scriptRAM);

      // If it's the home server, reserve 10% of its RAM
      if (server === "home") {
        const homeReserveRAM = 0.10 * homeMaxRAM; // 10% of home server's max RAM
        threadsAvailable = Math.floor((maxRAM - homeReserveRAM) / scriptRAM);
      }

      // Check if the script is already running on the server
      const runningProcesses = ns.ps(server);
      const runningScriptCount = runningProcesses.filter(p => p.filename === script).length;

      // If multiple instances are running, kill them all
      if (runningScriptCount > 1) {
        ns.print(`Killing ${runningScriptCount - 1} extra instances of ${script} on ${server}`);
        for (const proc of runningProcesses) {
          if (proc.filename === script) {
            ns.kill(proc.pid, server);
          }
        }
      }

      // Deploy the script with the calculated number of threads
      if (threadsAvailable > 0) {
        if (!ns.fileExists(script, server)) {
          ns.print(`Copying ${script} to ${server}`);
          await ns.scp(script, server);
        }

        ns.print(`Executing ${script} on ${server} with ${threadsAvailable} threads`);
        ns.exec(script, server, threadsAvailable, target);
      }
    }

    // Sleep for a while before checking again
    await ns.sleep(60000); // 1 minute delay
  }
}