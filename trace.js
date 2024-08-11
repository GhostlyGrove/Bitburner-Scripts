/** @param {NS} ns */
export async function main(ns) {
  if (ns.args.length === 0) {
    ns.tprint("ERROR: No target server specified.");
    return;
  }

  const target = ns.args[0];
  const path = findPath(ns, ns.getHostname(), target);

  if (path.length === 0) {
    ns.tprint(`ERROR: No path found to ${target}.`);
  } else {
    ns.tprint(`Path to ${target}:`);
    ns.tprint(path.join(" -> "));
  }
}

// Function to find the path from the current server to the target server
function findPath(ns, start, target, visited = []) {
  visited.push(start);

  if (start === target) {
    return [start];
  }

  const neighbors = ns.scan(start);
  for (const next of neighbors) {
    if (!visited.includes(next)) {
      const path = findPath(ns, next, target, visited);
      if (path.length > 0) {
        return [start, ...path];
      }
    }
  }

  return [];
}

// Autocomplete function for server names
export function autocomplete(data, args) {
  return data.servers;
}