/** @param {NS} ns **/
export async function main(ns) {
  const purchasedServers = ns.getPurchasedServers(); // Get the list of purchased servers

  ns.tprint("Purchased Servers and their Max RAM:");

  for (const server of purchasedServers) {
    const ram = ns.getServerMaxRam(server); // Get the maximum RAM of each server
    ns.tprint(`${server}: ${ram} GB`); // Print the server name and its RAM
  }
}