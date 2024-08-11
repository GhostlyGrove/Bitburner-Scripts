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
 * 6. Deploys earlyGameHack.js when RAM is insufficient.
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
  const earlyGameHackScript = "earlyGameHack.js"; // Script to run when RAM is insufficient
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
  ns.toast("Preparation is complete.");
  ns.print("Preparation is complete.");
  ns.tprint("Preparation is complete. Imp will start trying to make money.");

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

      // Monitor RAM conditions and deploy earlyGameHack.js if necessary
      if (!hasSufficientRAM(ns, myServers)) {
        ns.print("Insufficient RAM detected. Deploying earlyGameHack.js script.");
        deployEarlyGameHack(ns, myServers, earlyGameHackScript);
        await ns.sleep(delayBetweenCycles);
        continue; // Skip the rest of the loop and restart after the delay
      } else {
        // If RAM conditions are sufficient and earlyGameHack.js was running, stop it
        for (const server of myServers) {
          if (ns.isRunning(earlyGameHackScript, server)) {
            ns.print(`Sufficient RAM detected. Stopping ${earlyGameHackScript} on ${server}.`);
            ns.kill(earlyGameHackScript, server); // Stop earlyGameHack.js
          }
        }

        // Proceed with normal operations if RAM conditions are met
        ns.print("Sufficient RAM detected. Proceeding with normal operations.");

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
  let rootedServersList = rootedServers(ns); // Get list of rooted servers
  return targetServers.every(server => rootedServersList.includes(server));
}

// Function to prepare servers by copying essential scripts and checking for necessary RAM
async function prepareServers(ns, targetServers) {
  const essentialScripts = ["grow.js", "hack.js", "weaken.js"];

  for (const server of targetServers) {
    if (ns.getServerMaxRam(server) > 0) {
      for (const script of essentialScripts) {
        if (!ns.fileExists(script, server)) {
          ns.tprint(`Copying ${script} to ${server}`);
          ns.scp(script, server);
        }
      }
    }
  }
}

// Function to check if there is enough RAM available on servers
function hasSufficientRAM(ns, servers) {
  let sufficientRAM = true;
  for (const server of servers) {
    if (ns.getServerMaxRam(server) < 64) {
      sufficientRAM = false;
    }
  }
  return sufficientRAM;
}

// Function to deploy earlyGameHack.js on servers when RAM is insufficient
function deployEarlyGameHack(ns, servers, script) {
  for (const server of servers) {
    // Check if earlyGameHack.js is already running
    if (!ns.isRunning(script, server)) {
      ns.killall(server); // Stop all other scripts on the server
      const threads = Math.floor((ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) / ns.getScriptRam(script));
      if (threads > 0) {
        ns.exec(script, server, threads, "joesguns");
        ns.print(`Deployed ${script} on ${server} with ${threads} threads targeting joesguns.`);
      } else {
        ns.print(`Not enough RAM to run ${script} on ${server}.`);
      }
    } else {
      ns.print(`${script} is already running on ${server}.`);
    }
  }
}

// Function to distribute threads across available servers
function distributeThreads(ns, servers, script, threadCount, target) {
  const totalRam = servers.reduce((total, server) => total + ns.getServerMaxRam(server), 0);
  const requiredRam = ns.getScriptRam(script);
  const availableThreads = Math.floor(totalRam / requiredRam);

  for (const server of servers) {
    const serverRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
    if (serverRam >= requiredRam) {
      const threads = Math.min(Math.floor(serverRam / requiredRam), availableThreads);
      ns.exec(script, server, threads, target);
      availableThreads -= threads;
      if (availableThreads <= 0) break;
    }
  }
}