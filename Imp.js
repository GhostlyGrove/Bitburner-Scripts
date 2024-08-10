import { rootedServers, crawlerHackable } from "library.js";

/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");

  const daemonScript = "Daemon.js";
  const purchasedServerManagerScript = "purchasedServerManager.js";
  const diggerScript = "digger.js";
  const delayBetweenCycles = 200; // Delay between cycles in milliseconds

  ns.tprint("The Imp is here to help. He will handle buying/upgrading servers, nuking servers and making money");

  while (true) {
    try {
      // Check if Formulas.exe is present, and switch to Daemon.js if so
      if (ns.fileExists("Formulas.exe", "home")) {
        ns.tprint("Formulas.exe detected. Sacrificing Imp to summon the Daemon.");
        ns.exec(daemonScript, "home");
        ns.exit();
      }

      let myServers = ns.getPurchasedServers();
      myServers.push("home");

      // Use the custom function to determine target servers
      let targetServers = ns.args.length > 0 ? ns.args : findSimpleTargets(ns);

      // Preparation phase to maximize money and minimize security
      await prepareServers(ns, targetServers);

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
          await ns.sleep(10000);
        } else {
          ns.print(`${diggerScript} is already running on home server.`);
        }
      } else {
        ns.print(`All servers are rooted. ${diggerScript} is not needed.`);
      }

      // Update targetServers using the custom function if needed
      targetServers = ns.args.length > 0 ? ns.args : findSimpleTargets(ns);

      // List of servers (home + purchased servers)
      myServers = ns.getPurchasedServers();
      myServers.push("home");

      // Track the completion status of scripts
      let scriptsRunning = {};

      for (const targetServer of targetServers) {
        const moneyTarget = ns.getServerMaxMoney(targetServer) * 0.50; // Hack 50% of max money
        const hackAmountPerThread = ns.hackAnalyze(targetServer);
        const hackThreads = Math.ceil(moneyTarget / hackAmountPerThread);

        const growThreads = Math.ceil(ns.growthAnalyze(targetServer, 1.5)); // Grow by 50%

        const securityTarget = ns.getServerMinSecurityLevel(targetServer);
        const currentSecurity = ns.getServerSecurityLevel(targetServer);
        const securityToLower = currentSecurity - securityTarget;
        const weakenThreads = Math.ceil(securityToLower / ns.weakenAnalyze(1));

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
      ns.tprint(`ERROR: An unexpected error occurred in Imp script: ${error}`);
    }
  }
}

function findSimpleTargets(ns) {
  const allServers = rootedServers(ns);  // Get all rooted servers
  const playerHackingLevel = ns.getHackingLevel();

  // Filter out servers that require a hacking level higher than half the player's level
  const filteredServers = allServers.filter(server => ns.getServerRequiredHackingLevel(server) <= playerHackingLevel / 2);

  // Sort the remaining servers by maxMoney / minSecurity
  const sortedServers = filteredServers.sort((a, b) => {
    const aValue = ns.getServerMaxMoney(a) / ns.getServerMinSecurityLevel(a);
    const bValue = ns.getServerMaxMoney(b) / ns.getServerMinSecurityLevel(b);
    return bValue - aValue;
  });

  // Return the top 3 servers or all if less than 3
  return sortedServers.slice(0, 3);
}

// Check if digger has rooted all servers
function hasDiggerRootedAll(ns, targetServers) {
  let rootedServersList = rootedServers(ns); // Use the same method as digger
  return rootedServersList.length === targetServers.length;
}

async function prepareServers(ns, servers) {
  const preparationDelay = 5000; // Delay between preparation steps in milliseconds
  let myServers = ns.getPurchasedServers();
  myServers.push("home");

  for (const targetServer of servers) {
    try {
      const moneyAvailable = ns.getServerMoneyAvailable(targetServer);
      const maxMoney = ns.getServerMaxMoney(targetServer);
      const minSecurity = ns.getServerMinSecurityLevel(targetServer);
      const currentSecurity = ns.getServerSecurityLevel(targetServer);

      // Determine if grow or weaken operations are needed
      const needGrow = moneyAvailable < maxMoney && moneyAvailable > 0;
      const needWeaken = currentSecurity > minSecurity;

      // Log the preparation status
      ns.print(`Preparing server ${targetServer} - Money: ${moneyAvailable}/${maxMoney}, Security: ${currentSecurity}/${minSecurity}`);

      if (needGrow) {
        const growthMultiplier = maxMoney / moneyAvailable;
        if (growthMultiplier >= 1) { // Ensure multiplier is valid
          const growThreads = Math.ceil(ns.growthAnalyze(targetServer, growthMultiplier));
          ns.print(`Executing grow on ${targetServer} with ${growThreads} threads`);
          distributeThreads(ns, myServers, "grow.js", growThreads, targetServer);
        }
      }

      if (needWeaken) {
        const securityDecrease = currentSecurity - minSecurity;
        const weakenThreads = Math.ceil(securityDecrease / ns.weakenAnalyze(1));
        ns.print(`Executing weaken on ${targetServer} with ${weakenThreads} threads`);
        distributeThreads(ns, myServers, "weaken.js", weakenThreads, targetServer);
      }

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

    let ramToUse = availableRam;
    if (server === "home") {
      const reservedRam = Math.floor(ns.getServerMaxRam(server) * 0.10); // 10% reserved RAM
      ramToUse = availableRam - reservedRam;
    }

    const maxThreads = Math.floor(ramToUse / scriptRam);
    if (maxThreads <= 0) continue;

    const threadsToRun = Math.min(totalThreads, maxThreads);

    if (threadsToRun > 0) {
      if (server !== "home") {
        ns.scp(script, server, "home");
      }
      ns.exec(script, server, threadsToRun, targetServer);
      ns.print(`Executing ${threadsToRun} threads of ${script} on ${server} targeting ${targetServer}`);
      totalThreads -= threadsToRun;

      if (totalThreads <= 0) break;
    }
  }

  if (totalThreads > 0) {
    ns.print(`WARNING: Unable to allocate ${totalThreads} threads for ${script}. Not enough RAM available.`);
  }
}