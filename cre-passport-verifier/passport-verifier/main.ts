import {
  CronCapability, EVMClient, HTTPClient, LAST_FINALIZED_BLOCK_NUMBER, Runner,
  bytesToBase64, bytesToHex, consensusIdenticalAggregation, encodeCallMsg,
  getNetwork, handler, json, ok, text, protoBigIntToBigint, blockNumber,
  type HTTPSendRequester, type Runtime,
} from '@chainlink/cre-sdk'
import { decodeFunctionResult, encodeFunctionData, keccak256, parseAbi, sha256, zeroAddress, type Address, type Hex } from 'viem'
import { z } from 'zod'
import {
  configSchema, validatePassport, newResult, check, applyPublication, applyIdentity,
  applyFailure, resultSchema, sameAddress, VerificationFailure, MAX_ARTIFACT_BYTES, type Config,
} from './passport'

const registryAbi = parseAbi([
  'function identityRegistry() view returns (address)',
  'function latestVersion(uint256 agentId) view returns (uint256)',
  'function getPassportVersion(uint256 agentId,uint256 version) view returns ((bytes32 profileHash,string contentUri,address publisher,uint256 publishedAt,uint256 blockNumber))',
])
const identityAbi = parseAbi([
  'function getAgentWallet(uint256 agentId) view returns (address)',
  'function ownerOf(uint256 agentId) view returns (address)',
  'function tokenURI(uint256 agentId) view returns (string)',
])

export const fetchPassport = (sender: HTTPSendRequester, url: string): string => {
  const response = sender.sendRequest({ url, method: 'GET' }).result()
  if (!ok(response)) throw new Error('Passport HTTP failure')
  if (response.body.length > MAX_ARTIFACT_BYTES) throw new VerificationFailure('invalid_local', 'download', 'Passport response exceeds byte limit')
  return JSON.stringify({ body: text(response), rawHash: sha256(response.body), byteLength: response.body.length })
}

const rpcValue = (sender: HTTPSendRequester, url: string, method: string, params: unknown[]): unknown => {
  const response = sender.sendRequest({
    url, method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: bytesToBase64(new TextEncoder().encode(JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }))),
    cacheSettings: { store: false },
  }).result()
  if (!ok(response)) throw new Error('Monad RPC HTTP failure')
  const envelope = z.object({ result: z.unknown(), error: z.unknown().optional() }).parse(json(response))
  if (envelope.error || envelope.result === undefined || envelope.result === null) throw new Error('Monad RPC result unavailable')
  return envelope.result
}
const snapshotRpc = (sender: HTTPSendRequester, url: string, registry: string, number: string): string => {
  const chain = z.string().parse(rpcValue(sender, url, 'eth_chainId', []))
  const header = z.object({ number: z.string(), hash: z.string().regex(/^0x[0-9a-fA-F]{64}$/) })
    .parse(rpcValue(sender, url, 'eth_getBlockByNumber', [number, false]))
  const code = z.string().regex(/^0x(?:[0-9a-fA-F]{2})*$/).parse(rpcValue(sender, url, 'eth_getCode', [registry, number]))
  return JSON.stringify({ chain, number: header.number, hash: header.hash, code })
}

export const onCronTrigger = (runtime: Runtime<Config>): string => {
  const config = configSchema.parse(runtime.config)
  const result = newResult(config, runtime.now().toISOString())
  const http = new HTTPClient()
  let stage = 'download'
  try {
    runtime.log('CRE HTTPClient: retrieving raw Passport artifact with identical aggregation')
    const downloaded = z.object({ body: z.string(), rawHash: z.string(), byteLength: z.number() }).parse(JSON.parse(
      http.sendRequest(runtime, fetchPassport, consensusIdenticalAggregation<string>())(config.passportUrl).result(),
    ))
    result.rawFileSha256 = downloaded.rawHash
    result.downloadedBytes = downloaded.byteLength
    check(result, 'download', downloaded.byteLength <= MAX_ARTIFACT_BYTES, 'Bounded raw artifact retrieved through CRE HTTPClient', 'invalid_local')
    if (config.expectedRawSha256) check(result, 'raw_file_hash', downloaded.rawHash === config.expectedRawSha256, 'Raw file SHA-256 matches independently pinned artifact bytes', 'invalid_local')
    else result.criteria.raw_file_hash = { status: 'UNKNOWN', detail: 'Raw-file SHA-256 calculated; no expected file hash configured' }
    stage = 'artifact-validation'
    let raw: unknown
    try { raw = JSON.parse(downloaded.body) }
    catch { throw new VerificationFailure('invalid_local', 'schema', 'Artifact is not valid JSON') }
    const { bundle, digest } = validatePassport(raw, config, result)
    stage = 'finalized_snapshot'
    const network = getNetwork({ chainFamily: 'evm', chainSelectorName: config.chainSelectorName })
    if (!network) throw new Error('CRE network unavailable')
    const client = new EVMClient(network.chainSelector.selector)
    const readHeader = (number: ReturnType<typeof blockNumber>) => {
      const header = client.headerByNumber(runtime, { blockNumber: number }).result().header
      if (!header?.blockNumber || header.hash.length !== 32) throw new Error('CRE header incomplete')
      const height = protoBigIntToBigint(header.blockNumber)
      if (height <= 0n) throw new Error('CRE header height invalid')
      return { height, hash: bytesToHex(header.hash) }
    }
    const snapshot = readHeader(LAST_FINALIZED_BLOCK_NUMBER)
    result.snapshot = { blockNumber: snapshot.height.toString(), blockHash: snapshot.hash, finality: 'finalized', consistent: false }
    const exactBlock = blockNumber(snapshot.height)
    runtime.log(`CRE EVMClient: finalized snapshot ${snapshot.height} ${snapshot.hash}; every contract read uses this exact block`)
    stage = 'chain'
    const rpc = JSON.parse(http.sendRequest(runtime, snapshotRpc, consensusIdenticalAggregation<string>())(
      config.rpcUrl, config.registryAddress, `0x${snapshot.height.toString(16)}`,
    ).result()) as { chain: string; number: string; hash: string; code: Hex }
    check(result, 'chain', BigInt(rpc.chain) === BigInt(config.chainId), 'RPC confirms Monad Testnet chain ID 10143', 'invalid_registry')
    stage = 'finalized_snapshot'
    if (BigInt(rpc.number) !== snapshot.height || rpc.hash.toLowerCase() !== snapshot.hash.toLowerCase()) throw new Error('Snapshot disagreement')
    stage = 'registry_bytecode'
    check(result, 'registry_bytecode', rpc.code !== '0x' && keccak256(rpc.code).toLowerCase() === config.registryCodeHash.toLowerCase(),
      'Exact-block runtime bytecode matches independent M4 pin', 'invalid_registry')

    const read = (to: Address, data: Hex) => bytesToHex(client.callContract(runtime, {
      call: encodeCallMsg({ from: zeroAddress, to, data }), blockNumber: exactBlock,
    }).result().data)
    const registry = config.registryAddress as Address, identity = config.identityRegistryAddress as Address
    const agentId = BigInt(config.agentId)
    stage = 'identity_registry'
    const linkedIdentity = decodeFunctionResult({ abi: registryAbi, functionName: 'identityRegistry',
      data: read(registry, encodeFunctionData({ abi: registryAbi, functionName: 'identityRegistry' })) })
    check(result, 'identity_registry', sameAddress(linkedIdentity, identity), 'Pinned Registry immutable ERC-8004 dependency matches', 'invalid_registry')
    stage = 'publication'
    const latest = decodeFunctionResult({ abi: registryAbi, functionName: 'latestVersion',
      data: read(registry, encodeFunctionData({ abi: registryAbi, functionName: 'latestVersion', args: [agentId] })) })
    const publication = decodeFunctionResult({ abi: registryAbi, functionName: 'getPassportVersion',
      data: read(registry, encodeFunctionData({ abi: registryAbi, functionName: 'getPassportVersion', args: [agentId, BigInt(config.passportVersion)] })) })
    applyPublication(result, digest, latest, publication)
    stage = 'identity-association'
    const readIdentity = (name: 'getAgentWallet' | 'ownerOf' | 'tokenURI') => decodeFunctionResult({
      abi: identityAbi, functionName: name, data: read(identity, encodeFunctionData({ abi: identityAbi, functionName: name, args: [agentId] })),
    })
    applyIdentity(result, bundle, String(readIdentity('ownerOf')), String(readIdentity('getAgentWallet')), String(readIdentity('tokenURI')))
    stage = 'finalized_snapshot'
    const rechecked = readHeader(exactBlock)
    if (rechecked.height !== snapshot.height || rechecked.hash.toLowerCase() !== snapshot.hash.toLowerCase()) throw new Error('Snapshot changed')
    result.snapshot.consistent = true
    check(result, 'finalized_snapshot', true, 'Finalized CRE header, HTTP RPC bytecode and all CRE contract reads use one block; hash rechecked after reads')
  } catch (error) { applyFailure(result, error, stage) }
  const output = JSON.stringify(resultSchema.parse(result))
  runtime.log(`Signal Passport CRE verification: ${output}`)
  return output
}

export const initWorkflow = (config: Config) => [
  handler(new CronCapability().trigger({ schedule: config.schedule }), onCronTrigger),
]
export async function main() {
  const runner = await Runner.newRunner<Config>({ configSchema })
  await runner.run(initWorkflow)
}
