/**
 * Script Summary:
 * This script traces the path from the current server to a specified target server in Bitburner.
 * It prints the path in a clear format in the terminal. It also includes an autocomplete feature
 * for server names when using the script in the terminal.
 *
 * Usage:
 * run trace.js [target-server]
 * 
 * Features:
 * - Finds the path between the current server and a specified target server.
 * - Prints the path in the format: "home -> server1 -> server2 -> target-server".
 * - Provides server name autocompletion in the terminal.
 */

/** @param {NS} ns **/
export async function main(ns) {
  // Check if a target server was provided as an argument.
  if (ns.args.length === 0) {
    ns.tprint("ERROR: No target server specified."); // Print an error if no target is provided.
    return; // Exit the script early.
  }

  const target = ns.args[0]; // Get the target server name from the script arguments.
  const path = findPath(ns, ns.getHostname(), target); // Find the path from the current server to the target server.

  // If no path is found, print an error message.
  if (path.length === 0) {
    ns.tprint(`ERROR: No path found to ${target}.`);
  } else {
    // If a path is found, print it to the terminal.
    ns.tprint(`Path to ${target}:`);
    ns.tprint(path.join(" -> ")); // Join the path array into a string and print it.
  }
}

/**
 * Recursively finds the path from the start server to the target server.
 * @param {NS} ns - The Netscript environment.
 * @param {string} start - The starting server name.
 * @param {string} target - The target server name.
 * @param {string[]} visited - An array to track visited servers to avoid loops.
 * @returns {string[]} - An array representing the path to the target server.
 */
function findPath(ns, start, target, visited = []) {
  visited.push(start); // Add the current server to the visited list.

  // If the start server is the target server, return the path with just this server.
  if (start === target) {
    return [start];
  }

  const neighbors = ns.scan(start); // Get the neighboring servers of the current server.

  // Loop through each neighboring server.
  for (const next of neighbors) {
    // Check if the neighbor hasn't been visited yet.
    if (!visited.includes(next)) {
      // Recursively search for the path from the neighbor to the target.
      const path = findPath(ns, next, target, visited);
      if (path.length > 0) {
        return [start, ...path]; // If a path is found, return it, adding the current server at the start.
      }
    }
  }

  return []; // Return an empty array if no path is found.
}

/**
 * Autocomplete function for server names.
 * This function helps in autocompleting server names when the script is executed in the terminal.
 * @param {Object} data - The data object containing server information.
 * @param {string[]} args - The arguments passed to the script.
 * @returns {string[]} - An array of all known server names.
 */
export function autocomplete(data, args) {
  return data.servers; // Return the list of known server names for autocompletion.
}