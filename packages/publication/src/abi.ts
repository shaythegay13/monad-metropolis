import { Interface } from "ethers";
export const IDENTITY_REGISTRY = "0x8004a818bfb912233c491871b3d84c89a494bd9e";
export const identityAbi = new Interface([
  "function register() returns (uint256)", "function register(string agentURI) returns (uint256)",
  "function setAgentURI(uint256 agentId,string newURI)", "function getAgentWallet(uint256 agentId) view returns (address)",
  "function ownerOf(uint256 agentId) view returns (address)", "function tokenURI(uint256 agentId) view returns (string)",
  "event Registered(uint256 indexed agentId,string agentURI,address indexed owner)"
]);
export const registryAbi = new Interface([
  "constructor(address identityRegistry_)", "function identityRegistry() view returns (address)",
  "function latestVersion(uint256 agentId) view returns (uint256)",
  "function publishPassport(uint256 agentId,bytes32 profileHash,string contentUri,uint256 version)",
  "function getPassportVersion(uint256 agentId,uint256 version) view returns (tuple(bytes32 profileHash,string contentUri,address publisher,uint256 publishedAt,uint256 blockNumber))",
  "function getLatestPassport(uint256 agentId) view returns (uint256 version,tuple(bytes32 profileHash,string contentUri,address publisher,uint256 publishedAt,uint256 blockNumber) publication)",
  "function verifyPassport(uint256 agentId,uint256 version,bytes32 profileHash) view returns (bool)",
  "event PassportPublished(uint256 indexed agentId,uint256 indexed version,bytes32 indexed profileHash,string contentUri,address publisher)",
  "error InvalidIdentityRegistry()", "error UnauthorizedPublisher()", "error InvalidVersion()", "error ZeroProfileHash()"
]);
