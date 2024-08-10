/**
 * purchasedServerManager.js
 * 
 * This script manages the purchase and upgrade of personal servers.
 * It buys new servers until reaching the maximum limit and upgrades
 * their RAM when affordable. It continuously monitors and adjusts
 * the server setup based on available funds.
 */

/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");  // Disable logging to keep output clean

  let ram = 8;            // Initial RAM size for new servers
  let ramUpgrade = 16;    // RAM size for upgrading servers
  let oldRam = 8;         // Previous RAM size (for comparison)
  let maxServers = ns.getPurchasedServerLimit(); // Maximum number of servers you can own
  let i = 0;              // Counter for server naming
  let availableMoney = ns.getServerMoneyAvailable("home"); // Money available on the home server

  while (true) {
    try {
      // Purchase new servers if below the maximum limit
      while (i < maxServers && ns.getPurchasedServers().length < maxServers) {
        let cost = ns.getPurchasedServerCost(ram); // Cost to buy a server with current RAM
        availableMoney = ns.getServerMoneyAvailable("home"); // Money available on the home server

        if (cost < availableMoney * 0.5) { // Check if we have enough money to buy the server
          ns.print(`Purchasing server pserv-${i} with ${ram}GB RAM for ${ns.formatNumber(cost)}`);
          if (ns.purchaseServer("pserv-" + i, ram)) {
            i++; // Increment server counter on successful purchase
          } else {
            ns.tprint(`ERROR: Failed to purchase server pserv-${i}`);
          }
        } else {
          ns.print(`Insufficient funds to purchase server with ${ram}GB RAM`);
        }
        await ns.sleep(100); // Brief pause between purchases
      }

      let purchasedServers = ns.getPurchasedServers(); // List of all purchased servers

      // Check if upgrading servers to a higher RAM is affordable
      if (purchasedServers.length > 0) {
        let serverInfo = ns.getServer(purchasedServers[0]);
        if (ramUpgrade < serverInfo.maxRam) {
          ramUpgrade = serverInfo.maxRam * 2;
        }
        let upgradeCost = ns.getPurchasedServerUpgradeCost(purchasedServers[0], ramUpgrade * 2);
        if (upgradeCost < availableMoney * 0.1) { // Check if we have enough money to upgrade servers
          ns.print(`Affordable to upgrade servers from ${ramUpgrade}GB to ${ramUpgrade * 2}GB RAM`);
          ramUpgrade *= 2; // Double the RAM size for the next upgrade
        }
      }

      if (ns.getServer(purchasedServers[24]).maxRam != 1048576) {
        // Upgrade servers if the new RAM size is greater than the old one
        for (let j = 0; j < purchasedServers.length; j++) {
          let server = purchasedServers[j];

          if (ramUpgrade > oldRam) {
            let upgradeCost = ns.getPurchasedServerUpgradeCost(server, ramUpgrade);

            if (upgradeCost < availableMoney * 0.1) { // Check if we have enough money to upgrade the server
              ns.print(`Upgrading server ${server} to ${ramUpgrade}GB RAM for ${ns.formatNumber(upgradeCost)}`);
              if (ns.upgradePurchasedServer(server, ramUpgrade)) {
                ns.print(`Successfully upgraded ${server} to ${ramUpgrade}GB RAM`);
              } else {
                ns.print(`ERROR: Failed to upgrade server ${server} to ${ramUpgrade}GB RAM`);
              }
            } else {
              ns.print(`Insufficient funds to upgrade server ${server} to ${ramUpgrade}GB RAM`);
            }
          }
          await ns.sleep(100);
        }
      }
      else {
        ns.writePort(1, true);
        ns.print("Your servers have be fully upgraded.")
        ns.tprint("Your servers have be fully upgraded.");
        ns.toast("Your servers have be fully upgraded.");
        ns.exit();
      }

      oldRam = ramUpgrade; // Update oldRam to the new RAM size
    } catch (error) {
      ns.tprint(`ERROR: An unexpected error occurred: ${error}`); // Handle any unexpected errors
    }

    await ns.sleep(1000); // Pause before the next loop iteration
  }
}