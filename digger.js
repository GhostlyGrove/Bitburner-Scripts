import * as lib from "library.js";

/**
 * digger.js
 * 
 * This script automates the process of gaining root access to all hackable servers.
 * It scans for servers that can be hacked, attempts to open necessary ports, and
 * uses available tools to gain root access. It continues this process until all
 * identified servers are rooted.
 */

/** @param {NS} ns **/
export async function main(ns) {
  // Get a list of all hackable servers
  let targets = lib.crawlerHackable(ns);

  // Get the total number of port-opening tools available
  let virusTotal = lib.portViruses(ns);

  // List to keep track of servers that we have already rooted
  let rootedServers = [];

  ns.print("Starting the server rooting process...");

  while (true) {
    await ns.sleep(500);  // Pause briefly to avoid excessive updates

    // Update the count of port-opening tools
    virusTotal = lib.portViruses(ns);

    // Refresh the list of servers that have been rooted
    rootedServers = lib.rootedServers(ns);

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];

      // Check if the server is not already rooted and if we have enough tools to hack it
      if (!ns.hasRootAccess(target) && virusTotal >= ns.getServerNumPortsRequired(target)) {
        // Attempt to gain root access to the server
        lib.superNuke(ns, target);
        ns.toast(target + " has been nuked");  // Notify that the server has been nuked
        ns.print(`Nuked ${target}`);  // Log the action
      }
    }

    // Check if all target servers are rooted
    if (rootedServers.length === targets.length) {
      ns.toast("Digger has gained access to all Roots");  // Notify completion
      ns.print("Digger has gained access to all Roots");  // Log completion
      ns.exit();  // Exit the script
    }
  }
}