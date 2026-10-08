import path from "node:path";
import { fileURLToPath } from "node:url";
import { DependencyAuditPlugin } from "../../scripts/webpack-audit.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export default {
  outputFileTracingRoot: root,
  serverExternalPackages: ["@envio-dev/hypersync-client"],
  turbopack: { root, resolveAlias: {} },
  webpack(config, { isServer, nextRuntime }) {
    config.resolve.extensionAlias = { ".js": [".ts", ".tsx", ".js"], ".mjs": [".mts", ".mjs"] };
    if (process.env.SIGNAL_PASSPORT_BUILD_AUDIT === "1")
      config.plugins.push(new DependencyAuditPlugin(root, isServer ? nextRuntime ?? "server" : "browser"));
    return config;
  }
};
