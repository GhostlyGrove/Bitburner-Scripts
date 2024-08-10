import { findBestTargets, rootedServers, crawlerHackable } from "library.js";

/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");

  // Check if Formulas.exe exists
  if (!ns.fileExists("Formulas.exe", "home")) {
    ns.tprint("Formulas.exe not found. You can't handle the Daemon yet. Here's an Imp instead.");
    ns.exec("Imp.js", "home");
    ns.exit();
  }

  const purchasedServerManagerScript = "purchasedServerManager.js";
  const diggerScript = "digger.js";
  const delayBetweenCycles = 200; // Delay between cycles in milliseconds
  const formulas = ns.formulas.hacking;
  let myServers = ns.getPurchasedServers();
  myServers.push("home");

  // Determine target servers, defaults to a list of good targets or you can manually enter targets as arguments
  let targetServers = ns.args.length > 0 ? ns.args : findBestTargets(ns);

  // Preparation phase to maximize money and minimize security
  await prepareServers(ns, targetServers, formulas);

  while (true) {
    try {
      // Ensure purchasedServerManager.js is running on the home server
      if (!ns.isRunning(purchasedServerManagerScript, "home")) {
        ns.print(`Starting ${purchasedServerManagerScript} on home server.`);
        ns.exec(purchasedServerManagerScript, "home");
      } else {
        ns.print(`${purchasedServerManagerScript} is already running on home server.`);
      }

      // Ensure digger.js is running only if it hasn't already rooted all servers
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

      // Update targetServers using findBestTargets if needed
      targetServers = ns.args.length > 0 ? ns.args : findBestTargets(ns);

      // List of servers (home + purchased servers)
      myServers = ns.getPurchasedServers();
      myServers.push("home");

      // Track the completion status of scripts
      let scriptsRunning = {};

      for (const targetServer of targetServers) {
        const server = ns.getServer(targetServer);
        const player = ns.getPlayer();

        // Check if the server has root access
        if (!ns.hasRootAccess(targetServer)) {
          ns.print(`Skipping ${targetServer} (no root access)`);
          continue;  // Skip to the next target if no root access
        }

        // 1. Calculate Hack Threads
        const moneyTarget = ns.getServerMaxMoney(targetServer) * 0.50; // Hack 50% of max money
        const hackPercentPerThread = formulas.hackPercent(server, player);
        const hackAmountPerThread = ns.getServerMaxMoney(targetServer) * hackPercentPerThread;
        const hackThreads = Math.ceil(moneyTarget / hackAmountPerThread);

        // 2. Calculate Grow Threads
        const desiredMoneyAfterGrow = ns.getServerMaxMoney(targetServer) * 0.95; // Grow to 95% of max money
        const growThreads = Math.ceil(formulas.growThreads(server, player, desiredMoneyAfterGrow));

        // 3. Calculate Weaken Threads
        const hackSecurityIncrease = hackThreads * ns.hackAnalyzeSecurity(1, targetServer);
        const growSecurityIncrease = growThreads * ns.growthAnalyzeSecurity(1, targetServer);
        const totalSecurityIncrease = hackSecurityIncrease + growSecurityIncrease;

        const securityDecreasePerThread = 0.05; // Each weaken thread decreases security by this amount
        const securityTarget = ns.getServerMinSecurityLevel(targetServer); // Target security level is the minimum
        const securityToLower = (ns.getServerSecurityLevel(targetServer) + totalSecurityIncrease) - securityTarget;
        const weakenThreads = Math.ceil(securityToLower / securityDecreasePerThread);

        // 4. Distribute Threads Across Servers
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

      // Execute scripts for each target server
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

      await ns.sleep(delayBetweenCycles); // Delay between cycles to avoid overloading
    } catch (error) {
      ns.tprint(`ERROR: An unexpected error occurred in Daemon script: ${error}`);
    }
  }
}

// Check if digger has rooted all servers
function hasDiggerRootedAll(ns, targetServers) {
  let rootedServersList = rootedServers(ns); // Use the same method as digger
  return rootedServersList.length === targetServers.length;
}

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

      // Log the preparation status
      ns.print(`Preparing server ${targetServer} - Money: ${moneyAvailable}/${maxMoney}, Security: ${currentSecurity}/${minSecurity}`);

      if (needGrow) {
        const growThreads = Math.ceil(formulas.growThreads(server, player, maxMoney));
        ns.print(`Executing grow on ${targetServer} with ${growThreads} threads`);
        distributeThreads(ns, myServers, "grow.js", growThreads, targetServer);
      }

      if (needWeaken) {
        const securityDecrease = currentSecurity - minSecurity;
        const weakenThreads = Math.ceil(securityDecrease / 0.05);
        ns.print(`Executing weaken on ${targetServer} with ${weakenThreads} threads`);
        distributeThreads(ns, myServers, "weaken.js", weakenThreads, targetServer);
      }

      // If both grow and weaken are needed, they can run simultaneously
      await ns.sleep(preparationDelay);
    } catch (error) {
      ns.tprint(`ERROR: An unexpected error occurred during preparation for ${targetServer}: ${error}`);
    }
  }
}

function distributeThreads(ns, servers, script, totalThreads, targetServer) {
  ns.print(`Distributing ${totalThreads} threads for ${script} targeting ${targetServer}`);

  for (const server of servers) {
    const availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
    const scriptRam = ns.getScriptRam(script, server);

    // Check if the script exists on the home server
    if (!ns.fileExists(script, "home")) {
      ns.tprint(`ERROR: Script ${script} not found on home server.`);
      return;
    }

    // Calculate the amount of RAM to reserve if the server is the home server
    let ramToUse = availableRam;
    if (server === "home") {
      const reservedRam = Math.floor(ns.getServerMaxRam(server) * 0.10); // 10% reserved RAM
      ramToUse = availableRam - reservedRam;
    }

    // Calculate maximum number of threads that can be run on this server
    const maxThreads = Math.floor(ramToUse / scriptRam);
    if (maxThreads <= 0) continue; // Skip if not enough RAM

    const threadsToRun = Math.min(totalThreads, maxThreads);

    // If there are threads to run, execute the script
    if (threadsToRun > 0) {
      if (server !== "home") {
        ns.scp(script, server, "home"); // Copy the script to the server
      }
      ns.exec(script, server, threadsToRun, targetServer);
      ns.print(`Executing ${threadsToRun} threads of ${script} on ${server} targeting ${targetServer}`);
      totalThreads -= threadsToRun; // Subtract the threads that have been assigned

      if (totalThreads <= 0) break; // Stop if all threads have been allocated
    }
  }

  if (totalThreads > 0) {
    ns.print(`WARNING: Unable to allocate ${totalThreads} threads for ${script}. Not enough RAM available.`);
  }
}