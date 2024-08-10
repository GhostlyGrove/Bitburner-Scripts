import { rootedServers, crawlerHackable } from "library.js";

/**
 * Imp.js - Manages server operations for maximum profit.
 * 
 * This script performs the following tasks:
 * 1. Monitors for the presence of Formulas.exe. If found, switches to the advanced Daemon.js script.
 * 2. Manages personal servers and targets for hacking.
 * 3. Runs server preparation tasks, including growing money and weakening security.
 * 4. Ensures essential scripts (purchasedServerManager.js and digger.js) are running.
 * 5. Distributes hacking, growing, and weakening tasks across available servers.
 * 
 * Runs in a loop, updating server targets and actions every few seconds.
 */


/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL"); // Disable all logging to reduce console clutter
  ns.writePort(1, false);

  const daemonScript = "Daemon.js"; // The advanced script to run once you have Formulas.exe
  const purchasedServerManagerScript = "purchasedServerManager.js"; // Script to manage buying and upgrading servers
  const diggerScript = "digger.js"; // Script to gain root access on hackable servers
  const delayBetweenCycles = 200; // Delay between each cycle of actions (in milliseconds)
  let serversMaxUpgrades = false;

  // Determine the target servers to hack based on script arguments or using a custom function
  let targetServers = ns.args.length > 0 ? ns.args : findSimpleTargets(ns);

  // Inform the user about the Imp's duties
  ns.tprint("The imp is here to help. He will handle buying/upgrading personal servers, nuking everything he can, and making money.");
  ns.tprint("Once you have Formulas.exe he will summon the Daemon.");

  // Prepare the target servers to maximize money and minimize security
  ns.tprint("Preparing servers");
  await prepareServers(ns, targetServers);

  while (true) {
    try {
      // If Formulas.exe is found, switch to the more advanced Daemon.js script
      if (ns.fileExists("Formulas.exe", "home")) {
        ns.tprint("Formulas.exe detected. Sacrificing Imp to summon the Daemon.");
        ns.exec(daemonScript, "home"); // Run Daemon.js
        ns.exit(); // Stop the Imp script
      }

      // Get the list of purchased servers and add "home" (the player's main server) to it
      let myServers = ns.getPurchasedServers();
      myServers.push("home");

      // Determine the target servers to hack based on script arguments or using a custom function
      targetServers = ns.args.length > 0 ? ns.args : findSimpleTargets(ns);

      if (ns.readPort(1) == true || serversMaxUpgrades == true) {
        ns.print("Severs have reached max ram.");
        serversMaxUpgrades = true;
      }
      else {
        ns.print("Servers still need more ram.");
      }
      if (serversMaxUpgrades == false) {
        // Ensure the purchasedServerManager.js script is running on the home server
        if (!ns.isRunning(purchasedServerManagerScript, "home")) {
          ns.print(`Starting ${purchasedServerManagerScript} on home server.`);
          ns.exec(purchasedServerManagerScript, "home");
        } else {
          ns.print(`${purchasedServerManagerScript} is already running on home server.`);
        }
      }

      // Ensure digger.js is running only if it hasn't already rooted all hackable servers
      if (!hasDiggerRootedAll(ns, crawlerHackable(ns))) {
        if (!ns.isRunning(diggerScript, "home")) {
          ns.print(`Starting ${diggerScript} on home server.`);
          ns.exec(diggerScript, "home"); // Start the digger script
          await ns.sleep(10000); // Wait for the digger script to run
        } else {
          ns.print(`${diggerScript} is already running on home server.`);
        }
      } else {
        ns.print(`All servers are rooted. ${diggerScript} is not needed.`);
      }

      // Recalculate target servers to ensure we're targeting the best ones
      targetServers = ns.args.length > 0 ? ns.args : findSimpleTargets(ns);

      // Re-update the list of servers (home + purchased servers)
      myServers = ns.getPurchasedServers();
      myServers.push("home");

      // Track which scripts (weaken, grow, hack) need to run on each target server
      let scriptsRunning = {};

      for (const targetServer of targetServers) {
        // Calculate the number of threads needed to hack 50% of the server's max money
        const moneyTarget = ns.getServerMaxMoney(targetServer) * 0.50;
        const hackAmountPerThread = ns.hackAnalyze(targetServer);
        const hackThreads = Math.ceil(moneyTarget / hackAmountPerThread);

        // Calculate the number of threads needed to grow the server's money by 50%
        const growThreads = Math.ceil(ns.growthAnalyze(targetServer, 1.5));

        // Calculate the number of threads needed to weaken the server's security to its minimum
        const securityTarget = ns.getServerMinSecurityLevel(targetServer);
        const currentSecurity = ns.getServerSecurityLevel(targetServer);
        const securityToLower = currentSecurity - securityTarget;
        const weakenThreads = Math.ceil(securityToLower / ns.weakenAnalyze(1));

        // Prioritize weakening security, then growing money, and finally hacking
        if (currentSecurity > securityTarget) {
          if (!scriptsRunning[targetServer]) scriptsRunning[targetServer] = { weaken: 0, grow: 0, hack: 0 };
          scriptsRunning[targetServer].weaken = Math.max(scriptsRunning[targetServer].weaken, weakenThreads);
        } else if (ns.getServerMoneyAvailable(targetServer) < moneyTarget) {
          if (!scriptsRunning[targetServer]) scriptsRunning[targetServer] = { weaken: 0, grow: 0, hack: 0 };
          scriptsRunning[targetServer].grow = Math.max(scriptsRunning[targetServer].grow, growThreads);
        } else {
          if (!scriptsRunning[targetServer]) scriptsRunning[targetServer] = { weaken: 0, grow: 0, hack: 0 };
          scriptsRunning[targetServer].hack = Math.max(scriptsRunning[targetServer].hack, hackThreads);
        }
      }

      // Execute the required scripts (weaken, grow, hack) on each target server
      for (const targetServer of Object.keys(scriptsRunning)) {
        const scripts = scriptsRunning[targetServer];
        if (scripts.weaken > 0) {
          distributeThreads(ns, myServers, "weaken.js", scripts.weaken, targetServer);
        }
        if (scripts.grow > 0) {
          distributeThreads(ns, myServers, "grow.js", scripts.grow, targetServer);
        }
        if (scripts.hack > 0) {
          distributeThreads(ns, myServers, "hack.js", scripts.hack, targetServer);
        }
      }

      await ns.sleep(delayBetweenCycles); // Wait before starting the next cycle
    } catch (error) {
      ns.tprint(`ERROR: An unexpected error occurred in Imp script: ${error}`); // Catch and report any errors
    }
  }
}

// Function to find the best target servers based on simple criteria
function findSimpleTargets(ns) {
  const allServers = rootedServers(ns);  // Get all servers that you have rooted
  const playerHackingLevel = ns.getHackingLevel();

  // Filter out servers that require a high hacking level
  const filteredServers = allServers.filter(server => ns.getServerRequiredHackingLevel(server) <= playerHackingLevel / 2);

  // Sort the remaining servers by the amount of money they have versus their security level
  const sortedServers = filteredServers.sort((a, b) => {
    const aValue = ns.getServerMaxMoney(a) / ns.getServerMinSecurityLevel(a);
    const bValue = ns.getServerMaxMoney(b) / ns.getServerMinSecurityLevel(b);
    return bValue - aValue;
  });

  // Return the top 3 servers, or all of them if there are fewer than 3
  return sortedServers.slice(0, 3);
}

// Function to check if digger.js has rooted all hackable servers
function hasDiggerRootedAll(ns, targetServers) {
  let rootedServersList = rootedServers(ns); // Get the list of all rooted servers
  return rootedServersList.length === targetServers.length; // Check if all hackable servers are rooted
}

// Function to prepare servers for hacking by growing money and weakening security
async function prepareServers(ns, servers) {
  const preparationDelay = 5000; // Delay between preparation steps (in milliseconds)
  let myServers = ns.getPurchasedServers();
  myServers.push("home");

  for (const targetServer of servers) {
    try {
      const moneyAvailable = ns.getServerMoneyAvailable(targetServer);
      const maxMoney = ns.getServerMaxMoney(targetServer);
      const minSecurity = ns.getServerMinSecurityLevel(targetServer);
      const currentSecurity = ns.getServerSecurityLevel(targetServer);

      // Determine if the server needs more money or lower security
      const needGrow = moneyAvailable < maxMoney && moneyAvailable > 0;
      const needWeaken = currentSecurity > minSecurity;

      // Log the server's current status
      ns.print(`Preparing server ${targetServer} - Money: ${moneyAvailable}/${maxMoney}, Security: ${currentSecurity}/${minSecurity}`);
      ns.print(`Need Grow: ${needGrow}, Need Weaken: ${needWeaken}`);

      // If the server needs more money, grow it
      if (needGrow) {
        const growthMultiplier = maxMoney / moneyAvailable;
        if (growthMultiplier >= 1) { // Ensure multiplier is valid
          const growThreads = Math.ceil(ns.growthAnalyze(targetServer, growthMultiplier));
          ns.print(`Executing grow on ${targetServer} with ${growThreads} threads`);
          distributeThreads(ns, myServers, "grow.js", growThreads, targetServer);
        } else {
          ns.print(`Invalid growth multiplier for ${targetServer}`);
        }
      }

      // If the server needs lower security, weaken it
      if (needWeaken) {
        const securityDecrease = currentSecurity - minSecurity;
        const weakenThreads = Math.ceil(securityDecrease / ns.weakenAnalyze(1));
        ns.print(`Executing weaken on ${targetServer} with ${weakenThreads} threads`);
        distributeThreads(ns, myServers, "weaken.js", weakenThreads, targetServer);
      }

      await ns.sleep(preparationDelay); // Wait between preparation steps
    } catch (error) {
      ns.tprint(`ERROR: An unexpected error occurred during preparation: ${error}`);
    }
  }
}

// Function to distribute threads across available servers
function distributeThreads(ns, myServers, script, threadsNeeded, targetServer) {
  ns.print(`Distributing ${threadsNeeded} threads for ${script} on ${targetServer}`);

  const reserveRAM = 32 * 1024; // Reserve 32 GB of RAM (in MB)

  let threadsToAllocate = threadsNeeded;

  // Loop over each server to allocate the necessary threads
  for (const server of myServers) {
    const ramAvailable = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
    const scriptRam = ns.getScriptRam(script);
    let threadsAvailable;

    if (server === "home") {
      // Calculate available RAM on home server considering reserve
      const homeRamAvailable = ramAvailable - reserveRAM;
      threadsAvailable = Math.floor(homeRamAvailable / scriptRam);
    } else {
      threadsAvailable = Math.floor(ramAvailable / scriptRam);
    }

    const threadsToUse = Math.min(threadsAvailable, threadsToAllocate);

    if (threadsToUse > 0) {
      // Check if the script is already present on the server
      if (!ns.fileExists(script, server)) {
        ns.print(`Copying ${script} to ${server}`);
        ns.scp(script, server); // Copy the script to the server
      }

      ns.print(`Executing ${script} on ${server} with ${threadsToUse} threads targeting ${targetServer}`);
      const result = ns.exec(script, server, threadsToUse, targetServer);

      if (result === 0) {
        ns.tprint(`ERROR: Failed to execute ${script} on ${server}`);
      }

      threadsToAllocate -= threadsToUse;

      // If all threads are allocated, stop the loop
      if (threadsToAllocate <= 0) {
        break;
      }
    }
  }

  if (threadsToAllocate > 0) {
    ns.print(`WARNING: Not enough RAM to allocate all threads for ${script} on ${targetServer}`);
  }
}