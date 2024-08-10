/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");
  let ram = 8;
  let ramUpgrade = 16;
  let oldRam = 8;
  let maxServers = ns.getPurchasedServerLimit();
  let i = 0;

  while (true) {
    try {
      // Purchase servers if not at max limit
      while (i < maxServers && ns.getPurchasedServers().length < maxServers) {
        let cost = ns.getPurchasedServerCost(ram);
        if (cost < ns.getServerMoneyAvailable("home") * 0.5) {
          ns.print(`Purchasing server pserv-${i} with ${ram}GB RAM for ${ns.nFormat(cost, "$0.0a")}`);
          if (ns.purchaseServer("pserv-" + i, ram)) {
            i++;
          } else {
            ns.tprint(`ERROR: Failed to purchase server pserv-${i}`);
          }
        } else {
          ns.print(`Insufficient funds to purchase server with ${ram}GB RAM`);
        }
        await ns.sleep(100);
      }

      let purchasedServers = ns.getPurchasedServers();

      // Check if a higher RAM upgrade is affordable
      if (purchasedServers.length > 0) {
        let upgradeCost = ns.getPurchasedServerUpgradeCost(purchasedServers[0], ramUpgrade * 2);
        if (upgradeCost < ns.getServerMoneyAvailable("home") * 0.05) {
          ns.print(`Affordable to upgrade servers from ${ramUpgrade}GB to ${ramUpgrade * 2}GB RAM`);
          ramUpgrade *= 2;
        }
      }

      // Upgrade servers if possible
      for (let j = 0; j < purchasedServers.length; j++) {
        let server = purchasedServers[j];
        if (ramUpgrade > oldRam) {
          let upgradeCost = ns.getPurchasedServerUpgradeCost(server, ramUpgrade);
          if (upgradeCost < ns.getServerMoneyAvailable("home") * 0.05) {
            ns.print(`Upgrading server ${server} to ${ramUpgrade}GB RAM for ${ns.nFormat(upgradeCost, "$0.0a")}`);
            if (ns.upgradePurchasedServer(server, ramUpgrade)) {
              ns.print(`Successfully upgraded ${server} to ${ramUpgrade}GB RAM`);
            } else {
              ns.print(`ERROR: Failed to upgrade server ${server} to ${ramUpgrade}GB RAM`);
            }
          } else {
            ns.print(`Insufficient funds to upgrade server ${server} to ${ramUpgrade}GB RAM`);
          }
        }
      }

      oldRam = ramUpgrade;
    } catch (error) {
      ns.tprint(`ERROR: An unexpected error occurred: ${error}`);
    }

    await ns.sleep(1000);
  }
}