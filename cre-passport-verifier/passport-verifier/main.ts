import {
  CronCapability, EVMClient, HTTPClient, LAST_FINALIZED_BLOCK_NUMBER, Runner,
  bytesToBase64, bytesToHex, consensusIdenticalAggregation, encodeCallMsg,
  getNetwork, handler, json, ok, text, type HTTPSendRequester, type Runtime,
} from '@chainlink/cre-sdk'
import {
  decodeFunctionResult, encodeFunctionData, keccak256, parseAbi,
  zeroAddress, type Address,
} from 'viem'
import { z } from 'zod'
import { configSchema, validatePassport, type Config } from './passport'

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

const sameAddress = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
const insist = (condition: boolean, reason: string): void => {
  if (!condition) throw new Error(reason)
}

const fetchPassport = (sender: HTTPSendRequester, url: string): string => {
  const response = sender.sendRequest({ url, method: 'GET' }).result()
  if (!ok(response)) throw new Error(`Passport HTTP status ${response.statusCode}`)
  const body = text(response)
  if (body.length > 100_000) throw new Error('Passport response exceeds size limit')
  return body
}

const rpcString = (sender: HTTPSendRequester, url: string, method: string, params: string): string => {
  const response = sender.sendRequest({
    url, method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: bytesToBase64(new TextEncoder().encode(JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: JSON.parse(params) }))),
    cacheSettings: { store: false },
  }).result()
  if (!ok(response)) throw new Error(`Monad RPC HTTP status ${response.statusCode}`)
  return z.object({ result: z.string() }).parse(json(response)).result
}

export const onCronTrigger = (runtime: Runtime<Config>): string => {
  const config = configSchema.parse(runtime.config)
  const http = new HTTPClient()
  const body = http.sendRequest(runtime, fetchPassport, consensusIdenticalAggregation<string>())(config.passportUrl).result()
  const { bundle, digest } = validatePassport(JSON.parse(body), config)
  const rpc = (method: string, params: unknown[]) =>
    http.sendRequest(runtime, rpcString, consensusIdenticalAggregation<string>())(
      config.rpcUrl, method, JSON.stringify(params),
    ).result()
  insist(BigInt(rpc('eth_chainId', [])) === BigInt(config.chainId), 'RPC is not Monad Testnet 10143')
  const code = rpc('eth_getCode', [config.registryAddress, 'latest'])
  insist(code !== '0x' && keccak256(code as `0x${string}`).toLowerCase() === config.registryCodeHash.toLowerCase(),
    'Registry bytecode does not match independently pinned deployment')

  const network = getNetwork({ chainFamily: 'evm', chainSelectorName: config.chainSelectorName })
  if (!network) throw new Error('CRE does not recognize Monad Testnet')
  const client = new EVMClient(network.chainSelector.selector)
  const registryAddress = config.registryAddress as Address
  const identityAddress = config.identityRegistryAddress as Address
  const agentId = BigInt(config.agentId)
  const readRegistry = (name: 'identityRegistry' | 'latestVersion' | 'getPassportVersion', args: bigint[]) => {
    const reply = client.callContract(runtime, {
      call: encodeCallMsg({ from: zeroAddress, to: registryAddress, data: encodeFunctionData({ abi: registryAbi, functionName: name, args: args as never }) }),
      blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
    }).result()
    return bytesToHex(reply.data)
  }
  const readIdentity = (name: 'getAgentWallet' | 'ownerOf' | 'tokenURI') => {
    const reply = client.callContract(runtime, {
      call: encodeCallMsg({ from: zeroAddress, to: identityAddress, data: encodeFunctionData({ abi: identityAbi, functionName: name, args: [agentId] }) }),
      blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
    }).result()
    return decodeFunctionResult({ abi: identityAbi, functionName: name, data: bytesToHex(reply.data) })
  }

  const linkedIdentity = decodeFunctionResult({ abi: registryAbi, functionName: 'identityRegistry', data: readRegistry('identityRegistry', []) })
  insist(sameAddress(linkedIdentity, identityAddress), 'Registry points to a different ERC-8004 registry')
  const latestVersion = decodeFunctionResult({ abi: registryAbi, functionName: 'latestVersion', data: readRegistry('latestVersion', [agentId]) })
  insist(latestVersion >= BigInt(config.passportVersion), 'Passport version is not published')
  const publication = decodeFunctionResult({ abi: registryAbi, functionName: 'getPassportVersion',
    data: readRegistry('getPassportVersion', [agentId, BigInt(config.passportVersion)]) })
  insist(publication.profileHash.toLowerCase() === digest.toLowerCase(), 'Onchain profile hash differs from Passport digest')
  insist(publication.publisher !== zeroAddress && publication.publishedAt > 0n && publication.blockNumber > 0n,
    'Publication provenance is incomplete')
  const agentWallet = String(readIdentity('getAgentWallet'))
  const owner = String(readIdentity('ownerOf'))
  const agentUri = String(readIdentity('tokenURI'))
  insist(sameAddress(agentWallet, publication.publisher) && sameAddress(agentWallet, bundle.payload.subject.agentWallet),
    'Publisher does not match ERC-8004 agent wallet')
  insist(sameAddress(owner, bundle.payload.subject.ownerAddress), 'ERC-8004 owner differs from Passport')
  insist(agentUri === bundle.payload.subject.agentUri, 'ERC-8004 agent URI differs from Passport')

  const result = {
    status: 'verified', chainId: config.chainId, agentId: config.agentId,
    passportVersion: config.passportVersion, latestVersion: latestVersion.toString(),
    isLatest: latestVersion === BigInt(config.passportVersion), digest,
    publisher: publication.publisher, publicationBlock: publication.blockNumber.toString(),
    checks: ['payload-sha256', 'registry-bytecode', 'published-hash', 'publication-provenance', 'erc8004-association'],
  }
  runtime.log(`Signal Passport CRE verification: ${JSON.stringify(result)}`)
  return JSON.stringify(result)
}

export const initWorkflow = (config: Config) => [
  handler(new CronCapability().trigger({ schedule: config.schedule }), onCronTrigger),
]

export async function main() {
  const runner = await Runner.newRunner<Config>({ configSchema })
  await runner.run(initWorkflow)
}
