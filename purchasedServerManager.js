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
  for (let i = 0; i < maxServers; i++) {
    let serverName = `${serverPrefix}${i}`;
    let actualServer = ns.getPurchasedServers().find(s => !s.includes(serverName));
    if (actualServer) {
      ns.renamePurchasedServer(actualServer, serverName);
      ns.print(`Renamed ${actualServer} to ${serverName}`);
      ns.tprint(`Renamed ${actualServer} to ${serverName}`);
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

      if (ram < maxRam) {
        allMaxed = false;
        let nextRam = ram * 2;
        if (ns.getServerMoneyAvailable("home") >= serverCost(nextRam)) {
          ns.upgradePurchasedServer(serverName, nextRam);
          ns.print(`Upgraded ${serverName} to ${nextRam} GB`);
          ns.tprint(`Upgraded ${serverName} to ${nextRam} GB`);
          lastUpgradedIndex = serverIndex; // Update the index of the last upgraded server
        } else {
          ns.print(`Not enough money to upgrade ${serverName} to ${nextRam} GB`);
          await ns.sleep(30000); // Wait 30 seconds before trying again if upgrade fails
        }
        break;
      }
    }

    if (allMaxed) {
      ns.print("All servers upgraded to maximum RAM.");
      ns.tprint("All servers upgraded to maximum RAM.");
      await ns.writePort(1, true);
      return;
    }

    await ns.sleep(30000); // Wait 30 seconds before checking again if not all servers are maxed
  }
}