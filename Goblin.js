/** @param {NS} ns **/
export async function main(ns) {
  const script = "earlyGameHack.js";
  const target = "joesguns";
  const minRAM = 64; // Minimum RAM in GB

  ns.tprint("The Goblin is here to help. He will try to start making you some money.");
  ns.tprint("Buy 8GB personal servers from Alpha-Enterprises in the city.");
  ns.tprint("Goblin will summon the Imp once the Home server has 64 gb of ram or you have at least 8 personal servers with 8 gb of ram.");

  while (true) {
    let myServers = ns.getPurchasedServers();
    myServers.push("home");

    // Get the maximum RAM on the home server
    const homeMaxRAM = ns.getServerMaxRam("home");
    const combinedPurchasedServerRAM = myServers
      .filter(server => server !== "home")
      .reduce((total, server) => total + ns.getServerMaxRam(server), 0);

    // Check if either condition is met
    if (homeMaxRAM >= minRAM || combinedPurchasedServerRAM >= minRAM) {
      ns.tprint("Conditions met. Transitioning to Imp.js.");

      // Kill all instances of earlyGameHack.js
      for (const server of myServers) {
        const runningProcesses = ns.ps(server);
        for (const proc of runningProcesses) {
          if (proc.filename === script) {
            ns.print(`Killing ${script} on ${server}`);
            ns.kill(proc.pid, server);
          }
        }
      }

      // Start Imp.js
      ns.exec("Imp.js", "home");

      // Exit the script
      return;
    }

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