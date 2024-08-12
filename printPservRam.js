/** @param {NS} ns **/
export async function main(ns) {
  const purchasedServers = ns.getPurchasedServers(); // Get the list of purchased servers

  // Sort servers based on their numeric suffix
  purchasedServers.sort((a, b) => {
    // Extract the numeric part of the server names (e.g., "pserv-1" -> 1)
    const aIndex = parseInt(a.split('-')[1]);
    const bIndex = parseInt(b.split('-')[1]);
    return aIndex - bIndex;
  });

  ns.tprint("Purchased Servers and their Max RAM:");

  for (const server of purchasedServers) {
    const ram = ns.getServerMaxRam(server); // Get the maximum RAM of each server
    ns.tprint(`${server}: ${ram} GB`); // Print the server name and its RAM
  }
}