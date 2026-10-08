import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import solc from "solc";
export function compileRegistry(extraSources: Record<string, {content: string}> = {}) {
  const source = readFileSync("contracts/SignalPassportRegistry.sol", "utf8");
  const input = { language: "Solidity", sources: { "SignalPassportRegistry.sol": { content: source }, ...extraSources },
    settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "paris",
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object", "evm.deployedBytecode.immutableReferences"] } } } };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  if (output.errors?.some((e: {severity: string}) => e.severity === "error")) throw new Error("Solidity compilation failed");
  const contract = output.contracts["SignalPassportRegistry.sol"].SignalPassportRegistry;
  return { compilerVersion: solc.version(), evmVersion: "paris", optimizerRuns: 200,
    sourceSha256: createHash("sha256").update(source).digest("hex"),
    abi: contract.abi, bytecode: `0x${contract.evm.bytecode.object}`,
    deployedBytecode: `0x${contract.evm.deployedBytecode.object}`,
    immutableReferences: contract.evm.deployedBytecode.immutableReferences as Record<string, {start:number;length:number}[]>,
    contracts: output.contracts };
}
