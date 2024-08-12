/** @param {NS} ns */
export async function main(ns) {
  const serverPrefix = "pserv-";
  const maxServers = 25; // pserv-0 through pserv-24
  const maxRam = 1048576; // 2^20
  const serverCost = (ram) => ns.getPurchasedServerCost(ram);

  // Purchase servers if they don't exist
  for (let i = 0; i < maxServers; i++) {
    let serverName = `${serverPrefix}${i}`;
    if (!ns.serverExists(serverName)) {
      if (ns.getServerMoneyAvailable("home") >= serverCost(8)) {
        ns.purchaseServer(serverName, 8);
        ns.tprint("Purchased server: " + serverName);
      } else {
        ns.print(`Not enough money to buy ${serverName}`);
        await ns.sleep(30000); // Wait 30 seconds before trying again
      }
    }
  }

  // Ensure servers are correctly named
  const purchasedServers = ns.getPurchasedServers();
  const correctNames = new Set(purchasedServers.map(s => s.split('-')[1])); // Get current suffixes

  for (let i = 0; i < maxServers; i++) {
    let expectedName = `${serverPrefix}${i}`;
    if (!correctNames.has(i.toString())) {
      // Find server that does not have the correct name
      let actualServer = purchasedServers.find(s => !s.startsWith(serverPrefix) || s !== expectedName);
      if (actualServer) {
        ns.renamePurchasedServer(actualServer, expectedName);
        ns.print(`Renamed ${actualServer} to ${expectedName}`);
        ns.tprint(`Renamed ${actualServer} to ${expectedName}`);
      }
    }
  }

  let lastUpgradedIndex = -1; // Initialize to -1 to start with the first server

  // Upgrade servers evenly
  while (true) {
    let allMaxed = true;

    // Determine the next server to upgrade
    let startIndex = (lastUpgradedIndex + 1) % maxServers;
    for (let i = 0; i < maxServers; i++) {
      let serverIndex = (startIndex + i) % maxServers;
      let serverName = `${serverPrefix}${serverIndex}`;
      let ram = ns.getServerMaxRam(serverName);
      let nextRam = ram * 2;

      if (ram < maxRam) {
        allMaxed = false;
        if (ns.getServerMoneyAvailable("home") >= serverCost(nextRam)) {
          ns.upgradePurchasedServer(serverName, nextRam);
          ns.print(`Upgraded ${serverName} to ${nextRam} GB`);
          ns.tprint(`Upgraded ${serverName} to ${nextRam} GB`);
          lastUpgradedIndex = serverIndex; // Update the index of the last upgraded server
          break;
        } else {
          ns.print(`Not enough money to upgrade ${serverName} to ${nextRam} GB`);
        }
      }

      // Skip to the next server if upgrade fails
      if (i === maxServers - 1) {
        await ns.sleep(30000); // Wait 30 seconds before checking again if not all servers are maxed
      }
    }

    if (allMaxed) {
      ns.print("All servers upgraded to maximum RAM.");
      ns.tprint("All servers upgraded to maximum RAM.");
      await ns.writePort(1, true);
      return;
    }
  }
}