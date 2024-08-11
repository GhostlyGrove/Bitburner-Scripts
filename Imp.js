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
  let runningScripts = ns.ps("home");

  // Determine the target servers to hack based on script arguments or using a custom function
  let targetServers = ns.args.length > 0 ? ns.args : findSimpleTargets(ns);

  // Inform the user about the Imp's duties
  ns.tprint("The imp is here to help. He will handle buying/upgrading personal servers, nuking everything he can, and making money.");
  ns.tprint("Once you have Formulas.exe he will summon the Daemon.");

  // If Formulas.exe is found, switch to the more advanced Daemon.js script
  if (ns.fileExists("Formulas.exe", "home")) {
    ns.tprint("Formulas.exe detected. Sacrificing Imp to summon the Daemon.");

    runningScripts = ns.ps("home");
    // Kill all scripts except purchasedServerManager.js, digger.js, and Imp.js
    for (const script of runningScripts) {
      const scriptName = script.filename;
      if (!["purchasedServerManager.js", "digger.js", "Imp.js"].includes(scriptName)) {
        ns.kill(scriptName, "home");
      }
    }
    await ns.sleep(1000);
    ns.exec(daemonScript, "home"); // Run Daemon.js
    ns.exit(); // Stop the Imp script
  }

  // Prepare the target servers to maximize money and minimize security
  ns.tprint("Preparing servers");
  await prepareServers(ns, targetServers);
  ns.toast("Preparation is complete.");
  ns.print("Preparation is complete.");
  ns.tprint("Preparation is complete. Imp will start trying to make money.");

  while (true) {
    try {
      // If Formulas.exe is found, switch to the more advanced Daemon.js script
      if (ns.fileExists("Formulas.exe", "home")) {
        ns.tprint("Formulas.exe detected. Sacrificing Imp to summon the Daemon.");

        runningScripts = ns.ps("home");
        // Kill all scripts except purchasedServerManager.js, digger.js, and Imp.js
        for (const script of runningScripts) {
          const scriptName = script.filename;
          if (!["purchasedServerManager.js", "digger.js", "Imp.js"].includes(scriptName)) {
            ns.kill(scriptName, "home");
          }
        }
        await ns.sleep(1000);
        ns.exec(daemonScript, "home"); // Run Daemon.js
        ns.exit(); // Stop the Imp script
      }

      // Get the list of purchased servers and add "home" (the player's main server) to it
      let myServers = ns.getPurchasedServers();
      myServers.push("home");

      // Determine the target servers to hack based on script arguments or using a custom function
      targetServers = ns.args.length > 0 ? ns.args : findSimpleTargets(ns);

      if (ns.readPort(1) == true || serversMaxUpgrades == true) {
        ns.print("Servers have reached max RAM.");
        serversMaxUpgrades = true;
      } else {
        ns.print("Servers still need more RAM.");
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

      if (shouldRunGoblin(ns)) {
        if (!ns.isRunning("Goblin.js", "home")) {
          ns.print("RAM conditions not met. Starting Goblin.js.");
          ns.tprint("You aren't ready for the imp either. Here's a Goblin for your troubles.");
          ns.tprint("The Imp will stick around and get rid of the Goblin once you have more ram on home or a purchased server,");
          ns.writePort(2, myServers);
          ns.exec("Goblin.js", "home"); // Start Goblin.js
        }

        // Monitor RAM until conditions are met
        while (shouldRunGoblin(ns)) {
          myServers = ns.getPurchasedServers();
          myServers.push("home");
          ns.writePort(2, myServers);
          await ns.sleep(30000); // Wait before rechecking RAM conditions
        }

        // Stop Goblin.js and any earlyGameHack.js scripts
        if (ns.isRunning("Goblin.js", "home")) {
          ns.print("RAM conditions met. Stopping Goblin.js.");
          ns.tprint("RAM conditions met. Killing the Goblin.");

          runningScripts = ns.ps("home");
          // Kill all scripts except purchasedServerManager.js, digger.js, and Imp.js
          for (const script of runningScripts) {
            const scriptName = script.filename;
            if (!["purchasedServerManager.js", "digger.js", "Imp.js"].includes(scriptName)) {
              ns.kill(scriptName, "home");
            }
          }
        }

        const personalServers = ns.getPurchasedServers();

        for (const server of personalServers) {  // Kill earlyGameHack.js script on purchased servers if running
          ns.kill("earlyGameHack.js", server);
        }
        ns.print("Resuming normal operations.");
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
function hasDiggerRootedAll(ns, hackableServers) {
  const allRootedServers = rootedServers(ns);
  return hackableServers.every(server => allRootedServers.includes(server));
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

      if (needWeaken) {
        // Weaken security first
        ns.print(`Weakening security of ${targetServer}.`);
        await distributeThreads(ns, myServers, "weaken.js", 1, targetServer);
        await ns.sleep(preparationDelay); // Wait between operations
      }

      if (needGrow) {
        // Grow money second
        ns.print(`Growing money on ${targetServer}.`);
        await distributeThreads(ns, myServers, "grow.js", 1, targetServer);
        await ns.sleep(preparationDelay); // Wait between operations
      }
    } catch (error) {
      ns.tprint(`ERROR: Failed to prepare ${targetServer} due to: ${error}`);
    }
  }
}

function distributeThreads(ns, servers, scriptName, totalThreads, target) {
  let remainingThreads = totalThreads;
  ns.print(`Distributing ${totalThreads} threads for ${scriptName} on ${servers.length} servers.`);

  for (const server of servers) {
    // Ensure the script is copied to the server before attempting to run it
    if (!ns.fileExists(scriptName, server)) {
      ns.print(`Script ${scriptName} not found on ${server}. Copying now.`);
      const copySuccess = ns.scp(scriptName, server);
      if (!copySuccess) {
        ns.print(`Failed to copy ${scriptName} to ${server}.`);
        continue;
      }
      ns.print(`Successfully copied ${scriptName} to ${server}.`);
    }

    const scriptRam = ns.getScriptRam(scriptName);
    let ramAvailable = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);

    if (server === "home") {
      // Reserve 10% of the home server's maximum RAM
      const ramReserve = 0.10 * ns.getServerMaxRam(server);
      ramAvailable -= ramReserve;
    }

    // Check if the server has enough RAM to run the script
    if (ramAvailable < scriptRam) {
      ns.print(`Not enough RAM on ${server} to run ${scriptName}. Required: ${scriptRam} MB, Available: ${ramAvailable} MB.`);
      continue;
    }

    // Calculate how many threads can be run with the available RAM
    const threads = Math.floor(ramAvailable / scriptRam);
    const threadsToRun = Math.min(remainingThreads, threads);

    if (threadsToRun > 0) {
      ns.print(`Running ${threadsToRun} threads of ${scriptName} on ${server}.`);
      const success = ns.exec(scriptName, server, threadsToRun, target);
      if (!success) {
        ns.print(`Failed to start ${scriptName} on ${server}.`);
      }
      remainingThreads -= threadsToRun; // Subtract the number of threads just used

      // Break the loop if all threads have been distributed
      if (remainingThreads <= 0) break;
    }
  }

  // If there are remaining threads that couldn't be distributed, log the information
  if (remainingThreads > 0) {
    ns.print(`Warning: ${remainingThreads} threads could not be distributed due to insufficient RAM on available servers.`);
  }
}

function shouldRunGoblin(ns) {
  const minHomeRAM = 64;  // 64 GB
  const minPurchasedServerRAM = 16;  // 16 GB
  const highPurchasedServerRAM = 64;  // 64 GB

  let homeRAM = ns.getServerMaxRam("home");
  let purchasedServers = ns.getPurchasedServers();

  ns.print(`Home server RAM: ${homeRAM} GB`);
  ns.print(`Purchased servers: ${purchasedServers.map(server => `${server}: ${ns.getServerMaxRam(server)} GB`).join(", ")}`);

  // Check if the home server has 64 GB or more of RAM
  if (homeRAM >= minHomeRAM) {
    ns.print("Home server has 64 GB or more of RAM. Goblin.js should not run.");
    return false;
  }

  // Check if any purchased server has 64 GB or more of RAM
  for (let server of purchasedServers) {
    let serverRam = ns.getServerMaxRam(server);
    ns.print(`Checking server ${server} with ${serverRam} GB RAM`);
    if (serverRam >= highPurchasedServerRAM) {
      ns.print(`Server ${server} has 64 GB or more of RAM. Goblin.js should not run.`);
      return false;
    }
  }

  // Check if home RAM is below 64 GB
  if (homeRAM < minHomeRAM) {
    ns.print("Home server has less than 64 GB of RAM. Goblin.js should run.");
    return true;
  }

  // Check if all purchased servers have less than 16 GB of RAM
  if (purchasedServers.every(server => ns.getServerMaxRam(server) < minPurchasedServerRAM)) {
    ns.print("All purchased servers have less than 16 GB of RAM. Goblin.js should run.");
    return true;
  }

  ns.print("Conditions not met for running Goblin.js.");
  return false;
}