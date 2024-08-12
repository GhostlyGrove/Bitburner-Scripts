import { findBestTargets, rootedServers, crawlerHackable } from "library.js";

/**
 * Daemon.js - Automates hacking, growing, and weakening of target servers.
 * 
 * This script:
 * 1. Checks for Formulas.exe; if not found, runs Imp.js instead.
 * 2. Manages personal servers and runs essential scripts (purchasedServerManager.js, digger.js).
 * 3. Dynamically selects and prepares target servers for hacking.
 * 4. Calculates and distributes threads for hacking, growing, and weakening operations.
 * 5. Runs continuously, updating server operations and optimizing resource usage.
 */


/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");
  ns.writePort(1, false);

  // Check if Formulas.exe exists on the home server
  if (!ns.fileExists("Formulas.exe", "home")) {
    ns.tprint("Formulas.exe not found. You can't handle the Daemon yet. Here's an Imp instead.");
    ns.exec("Imp.js", "home");  // Run the simpler Imp script if Formulas.exe is missing
    ns.exit();  // Exit the Daemon script
  } else {
    ns.tprint("The Daemon is here and he's hungry for RAM. He will buy and upgrade personal servers and nuke anything that needs to be nuked.");
    ns.tprint("He will also eat all your ram and spit out money.");
  }

  const purchasedServerManagerScript = "purchasedServerManager.js";  // Script to manage purchased servers
  const diggerScript = "digger.js";  // Script to root servers that aren't rooted yet
  const delayBetweenCycles = 200; // Delay between cycles in milliseconds
  const formulas = ns.formulas.hacking;  // Hacking formulas from the Formulas API
  let serversMaxUpgrades = false;

  // Get the list of all purchased servers and include the home server
  let myServers = ns.getPurchasedServers();
  myServers.push("home");

  // Determine the target servers for hacking
  // If no arguments are passed, find the best targets automatically
  let targetServers = ns.args.length > 0 ? ns.args : findBestTargets(ns);

  // Prepare target servers by maximizing their money and minimizing their security level
  ns.tprint("The Daemon is preparing target servers for maximum money printing.");
  await prepareServers(ns, targetServers, formulas);
  ns.toast("Preparation is complete.");
  ns.print("Preparation is complete.");
  ns.tprint("Preparation is complete. Daemon will eat your ram and give you money in return.");

  while (true) {
    try {
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

      // Check if digger.js is needed to root any remaining servers
      if (!hasDiggerRootedAll(ns, crawlerHackable(ns))) {
        if (!ns.isRunning(diggerScript, "home")) {
          ns.print(`Starting ${diggerScript} on home server.`);
          ns.exec(diggerScript, "home");
        } else {
          ns.print(`${diggerScript} is already running on home server.`);
        }
      } else {
        ns.print(`All servers are rooted. ${diggerScript} is not needed.`);
      }

      // Update the list of target servers dynamically
      targetServers = ns.args.length > 0 ? ns.args : findBestTargets(ns);

      // Refresh the list of servers (home + purchased servers)
      myServers = ns.getPurchasedServers();
      myServers.push("home");

      // Track the completion status of hack, grow, and weaken scripts
      let scriptsRunning = {};

      for (const targetServer of targetServers) {
        const server = ns.getServer(targetServer);
        const player = ns.getPlayer();

        // Check if the server has root access before proceeding
        if (!ns.hasRootAccess(targetServer)) {
          ns.print(`Skipping ${targetServer} (no root access)`);
          continue;  // Skip to the next target if no root access
        }

        // 1. Calculate Hack Threads
        // Determine how much money to hack (50% of max money)
        const moneyTarget = ns.getServerMaxMoney(targetServer) * 0.50;
        const hackPercentPerThread = formulas.hackPercent(server, player);  // Hack percentage per thread
        const hackAmountPerThread = ns.getServerMaxMoney(targetServer) * hackPercentPerThread;
        const hackThreads = Math.ceil(moneyTarget / hackAmountPerThread);  // Number of threads needed to hack the target amount

        // 2. Calculate Grow Threads
        // Calculate how many threads are needed to grow the server back to 95% of its max money
        const desiredMoneyAfterGrow = ns.getServerMaxMoney(targetServer) * 0.95;
        const growThreads = Math.ceil(formulas.growThreads(server, player, desiredMoneyAfterGrow));

        // 3. Calculate Weaken Threads
        // Determine how many threads are needed to lower the security level to its minimum
        const hackSecurityIncrease = hackThreads * ns.hackAnalyzeSecurity(1, targetServer);  // Security increase from hacking
        const growSecurityIncrease = growThreads * ns.growthAnalyzeSecurity(1, targetServer);  // Security increase from growing
        const totalSecurityIncrease = hackSecurityIncrease + growSecurityIncrease;  // Total security increase

        const securityDecreasePerThread = 0.05;  // Each weaken thread decreases security by this amount
        const securityTarget = ns.getServerMinSecurityLevel(targetServer);  // Target security level is the minimum
        const securityToLower = (ns.getServerSecurityLevel(targetServer) + totalSecurityIncrease) - securityTarget;
        const weakenThreads = Math.ceil(securityToLower / securityDecreasePerThread);

        // 4. Distribute Threads Across Servers
        // Prioritize weakening, then growing, and finally hacking based on current server status
        if (ns.getServerSecurityLevel(targetServer) > securityTarget) {
          if (!scriptsRunning[targetServer]) scriptsRunning[targetServer] = { weaken: 0, grow: 0, hack: 0 };
          scriptsRunning[targetServer].weaken = Math.max(scriptsRunning[targetServer].weaken, weakenThreads);
        }
        else if (ns.getServerMoneyAvailable(targetServer) < desiredMoneyAfterGrow) {
          if (!scriptsRunning[targetServer]) scriptsRunning[targetServer] = { weaken: 0, grow: 0, hack: 0 };
          scriptsRunning[targetServer].grow = Math.max(scriptsRunning[targetServer].grow, growThreads);
        }
        else {
          if (!scriptsRunning[targetServer]) scriptsRunning[targetServer] = { weaken: 0, grow: 0, hack: 0 };
          scriptsRunning[targetServer].hack = Math.max(scriptsRunning[targetServer].hack, hackThreads);
        }
      }

      // Execute the appropriate scripts (hack, grow, weaken) for each target server
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
    } catch (error) {
      ns.tprint(`ERROR: An unexpected error occurred in Daemon script: ${error}`);
    }

    await ns.sleep(delayBetweenCycles); // Delay between cycles to avoid overloading the game engine
  }
}

// Check if digger.js has rooted all hackable servers
function hasDiggerRootedAll(ns, targetServers) {
  let rootedServersList = rootedServers(ns); // Get the list of all rooted servers
  return rootedServersList.length === targetServers.length; // Compare with the total hackable servers
}

// Prepare the target servers by maximizing money and minimizing security
async function prepareServers(ns, servers, formulas) {
  const preparationDelay = 5000; // Delay between preparation steps in milliseconds
  let myServers = ns.getPurchasedServers();
  myServers.push("home");

  for (const targetServer of servers) {
    try {
      const server = ns.getServer(targetServer);
      const player = ns.getPlayer();

      const moneyAvailable = ns.getServerMoneyAvailable(targetServer);
      const maxMoney = ns.getServerMaxMoney(targetServer);
      const minSecurity = ns.getServerMinSecurityLevel(targetServer);
      const currentSecurity = ns.getServerSecurityLevel(targetServer);

      // Determine if grow or weaken operations are needed
      const needGrow = moneyAvailable < maxMoney;
      const needWeaken = currentSecurity > minSecurity;

      // Log the preparation status for each server
      ns.print(`Preparing server ${targetServer} - Money: ${moneyAvailable}/${maxMoney}, Security: ${currentSecurity}/${minSecurity}`);

      if (needGrow) {
        const growThreads = Math.ceil(formulas.growThreads(server, player, maxMoney));
        ns.print(`Preparation: Executing grow on ${targetServer} with ${growThreads} threads`);
        distributeThreads(ns, myServers, "grow.js", growThreads, targetServer);
      }

      if (needWeaken) {
        const securityDecrease = currentSecurity - minSecurity;
        const weakenThreads = Math.ceil(securityDecrease / 0.05);
        ns.print(`Preparation: Executing weaken on ${targetServer} with ${weakenThreads} threads`);
        distributeThreads(ns, myServers, "weaken.js", weakenThreads, targetServer);
      }

      // If both grow and weaken are needed, they can run simultaneously
      await ns.sleep(preparationDelay);
    } catch (error) {
      ns.tprint(`ERROR: An unexpected error occurred during preparation for ${targetServer}: ${error}`);
    }
  }
}

// Distribute threads across available servers for a given script targeting a specific server
function distributeThreads(ns, servers, script, totalThreadsNeeded, targetServer) {
  ns.print(`Distributing ${totalThreadsNeeded} threads for ${script} targeting ${targetServer}`);

  // Iterate over each server to allocate threads for the operation
  for (const server of servers) {

    // Check if the script is present on the server, and if not, copy it
    if (!ns.fileExists(script, server)) {
      ns.print(`Script ${script} not found on ${server}. Copying...`);
      ns.scp(script, server); // Copy the script to the server
    }

    let maxThreads = Math.floor((ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) / ns.getScriptRam(script));

    if (server === "home" && ns.getServerMaxRam(server) - ns.getServerUsedRam(server) > 64) {
      // Reserve 64GB of RAM on home server for other tasks
      maxThreads = Math.floor((ns.getServerMaxRam(server) - 64 - ns.getServerUsedRam(server)) / ns.getScriptRam(script));
    }

    const threadsToUse = Math.min(totalThreadsNeeded, maxThreads);

    if (threadsToUse > 0) {
      ns.print(`Executing ${script} with ${threadsToUse} threads on ${server}`);
      ns.exec(script, server, threadsToUse, targetServer);
      totalThreadsNeeded -= threadsToUse; // Reduce the number of threads needed by the amount used

      if (totalThreadsNeeded <= 0) {
        break;  // Stop if all threads have been distributed
      }
    }
  }

  if (totalThreadsNeeded > 0) {
    ns.print(`WARNING: Not enough threads to fully execute ${script} on ${targetServer}. Remaining threads: ${totalThreadsNeeded}`);
  }
}