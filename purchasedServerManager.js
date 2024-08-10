/**
 * purchasedServerManager.js
 * 
 * Summary:
 * This script automatically manages the purchase and upgrade of personal servers.
 * It starts by buying servers with an initial amount of RAM, then upgrades them when you have enough money.
 * The script runs continuously, adjusting your server setup based on your available funds.
 * If all servers reach the maximum upgrade level, the script stops running.
 */

/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");  // Disable all logging messages to keep the output clean and readable

  let ram = 8;            // Initial amount of RAM (memory) for new servers (in GB)
  let ramUpgrade = 16;    // Amount of RAM to upgrade servers to in the next step
  let oldRam = 8;         // Tracks the last RAM size to compare with the new one
  let maxServers = ns.getPurchasedServerLimit(); // Maximum number of servers you can own
  let i = 0;              // Counter to keep track of how many servers have been purchased
  let availableMoney = ns.getServerMoneyAvailable("home"); // How much money you have available on your home server
  let failureCounter = 0; // Counts how many times a server upgrade fails in a row
  const maxFailures = 5;  // Maximum number of consecutive failures allowed before stopping the upgrade attempts

  while (true) {  // Infinite loop to keep the script running until all servers are fully upgraded
    try {
      // Step 1: Purchase new servers if you haven't reached the maximum limit
      while (i < maxServers && ns.getPurchasedServers().length < maxServers) {
        let cost = ns.getPurchasedServerCost(ram); // Get the cost to buy a server with the current RAM size
        availableMoney = ns.getServerMoneyAvailable("home"); // Update the amount of available money

        // Only buy a server if you have more than double the required money (50% of your funds)
        if (cost < availableMoney * 0.5) {
          ns.print(`Purchasing server pserv-${i} with ${ram}GB RAM for ${ns.formatNumber(cost)}`);
          if (ns.purchaseServer("pserv-" + i, ram)) {
            i++; // If purchase is successful, move to the next server
          } else {
            ns.tprint(`ERROR: Failed to purchase server pserv-${i}`); // Print an error if the purchase fails
          }
        } else {
          ns.print(`Insufficient funds to purchase server with ${ram}GB RAM`); // Notify if not enough money
        }
        await ns.sleep(100); // Pause briefly between each purchase attempt
      }

      // Step 2: Check if upgrading the servers' RAM is possible
      let purchasedServers = ns.getPurchasedServers(); // Get a list of all the servers you've bought

      // If you own at least one server, check if it's time to upgrade the RAM
      if (purchasedServers.length > 0) {
        let serverInfo = ns.getServer(purchasedServers[0]); // Get details of the first server

        // If the next upgrade RAM size is less than the current server's max RAM, double it
        if (ramUpgrade < serverInfo.maxRam) {
          ramUpgrade = serverInfo.maxRam * 2;
        }
        let upgradeCost = ns.getPurchasedServerUpgradeCost(purchasedServers[0], ramUpgrade * 2); // Get the cost of the upgrade
        if (upgradeCost < availableMoney * 0.1) { // Upgrade if the cost is less than 10% of your available money
          ns.print(`Affordable to upgrade servers from ${ramUpgrade}GB to ${ramUpgrade * 2}GB RAM`);
          ramUpgrade *= 2; // Double the RAM size for the next upgrade
        }
      }

      // Step 3: Upgrade all servers to the next level of RAM if they aren't fully upgraded yet
      if (ns.getServer(purchasedServers[24]).maxRam != 1048576) { // 1 TB RAM (1048576 GB) is the max possible

        // Loop through each server to upgrade its RAM
        for (let j = 0; j < purchasedServers.length; j++) {
          let server = purchasedServers[j];

          // Only attempt to upgrade if the new RAM size is larger than the old one
          if (ramUpgrade > oldRam) {
            let upgradeCost = ns.getPurchasedServerUpgradeCost(server, ramUpgrade); // Get the upgrade cost

            // Upgrade the server if the cost is less than 10% of your available money
            if (upgradeCost < availableMoney * 0.1) {
              ns.print(`Upgrading server ${server} to ${ramUpgrade}GB RAM for ${ns.formatNumber(upgradeCost)}`);
              if (ns.upgradePurchasedServer(server, ramUpgrade)) {
                ns.print(`Successfully upgraded ${server} to ${ramUpgrade}GB RAM`);
                failureCounter = 0; // Reset the failure counter if the upgrade is successful
              } else {
                ns.print(`ERROR: Failed to upgrade server ${server} to ${ramUpgrade}GB RAM`);
                failureCounter++; // Increment the failure counter on an upgrade failure
                // If too many consecutive failures occur, stop trying to upgrade
                if (failureCounter >= maxFailures) {
                  ns.print(`ERROR: Too many consecutive upgrade failures. Breaking out of the loop.`);
                  ns.exit();
                }
              }
            } else {
              ns.print(`Insufficient funds to upgrade server ${server} to ${ramUpgrade}GB RAM`);
            }
          }
          await ns.sleep(100); // Brief pause between each server upgrade attempt
        }
      } else {
        // Step 4: If all servers are fully upgraded, notify the user and stop the script
        ns.writePort(1, true);
        ns.print("Your servers have been fully upgraded.");
        ns.tprint("Your servers have been fully upgraded.");
        ns.toast("Your servers have been fully upgraded.");
        ns.exit(); // Exit the script when all servers are maxed out
      }

      oldRam = ramUpgrade; // Update the old RAM size for the next upgrade comparison
    } catch (error) {
      ns.tprint(`ERROR: An unexpected error occurred: ${error}`); // Handle any unexpected errors that might occur
    }

    await ns.sleep(1000); // Pause before the next loop iteration to prevent excessive CPU usage
  }
}