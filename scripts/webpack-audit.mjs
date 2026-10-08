import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

// Optional build-only dependency evidence. No module source or environment values.
export class DependencyAuditPlugin {
  constructor(root, target) { this.root = root; this.target = target; }
  apply(compiler) {
    compiler.hooks.done.tap("SignalPassportDependencyAudit", stats => {
      const packages = /bigint-buffer|@dynamic-labs[\\/]solana-core|@solana[\\/](spl-token|buffer-layout-utils)|stream-json|[\\/]uuid[\\/]/;
      const result = [];
      function visit(module, inheritedChunks = []) {
        const chunks = [...stats.compilation.chunkGraph.getModuleChunksIterable(module)].map(c => c.name ?? String(c.id));
        const effectiveChunks = chunks.length ? chunks : inheritedChunks;
        const identifier = module.identifier();
        if (packages.test(identifier)) result.push({ identifier, chunks: effectiveChunks, emitted: effectiveChunks.length > 0 });
        if (module.modules) for (const child of module.modules) visit(child, effectiveChunks);
      }
      for (const module of stats.compilation.modules) visit(module);
      const directory = path.join(this.root, "dist", "m5-build-audit");
      mkdirSync(directory, { recursive: true });
      writeFileSync(path.join(directory, `${this.target}.json`), JSON.stringify({ target: this.target, modules: result }, null, 2));
    });
  }
}
