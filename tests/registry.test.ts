import test from "node:test";
import assert from "node:assert/strict";
import { Common, Mainnet, Hardfork } from "@ethereumjs/common";
import { createLegacyTx } from "@ethereumjs/tx";
import { createVM, runTx } from "@ethereumjs/vm";
import { createAccount, createAddressFromPrivateKey, createAddressFromString, bytesToHex, hexToBytes } from "@ethereumjs/util";
import { Interface, ZeroAddress, ZeroHash } from "ethers";
import { compileRegistry } from "../packages/publication/src/compile.js";
import { registryAbi } from "../packages/publication/src/abi.js";

// Synthetic, isolated EVM only; no environment credentials or RPC.
const compiled=compileRegistry({"Mock.sol":{content:`// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;
contract Mock { mapping(uint256=>address) public wallets; bool public failing;
function set(uint256 id,address wallet) external {wallets[id]=wallet;}
function fail(bool value) external {failing=value;}
function getAgentWallet(uint256 id) external view returns(address) {require(!failing,"dependency failure");return wallets[id];}}
`}});
const mockAbi=new Interface(compiled.contracts["Mock.sol"].Mock.abi);
const H1=`0x${"ab".repeat(32)}`,H2=`0x${"cd".repeat(32)}`;
async function setup() {
  const common=new Common({chain:Mainnet,hardfork:Hardfork.Paris});
  const vm=await createVM({common});
  const keys=[hexToBytes(`0x${"21".repeat(32)}`),hexToBytes(`0x${"22".repeat(32)}`)];
  const addresses=keys.map(createAddressFromPrivateKey);
  for(const a of addresses)await vm.stateManager.putAccount(a,createAccount({balance:10n**22n}));
  async function tx(data:string,to?:string,who=0) {
    const nonce=(await vm.stateManager.getAccount(addresses[who]))!.nonce;
    const signed=createLegacyTx({nonce,gasLimit:6_000_000n,gasPrice:10n**9n,data:hexToBytes(data as `0x${string}`),...(to?{to:createAddressFromString(to)}:{})},{common}).sign(keys[who]);
    return runTx(vm,{tx:signed});
  }
  const mockDeployment=await tx(`0x${compiled.contracts["Mock.sol"].Mock.evm.bytecode.object}`);
  assert.equal(mockDeployment.execResult.exceptionError,undefined);
  const mock=mockDeployment.createdAddress!.toString();
  const deployment=await tx(compiled.bytecode+registryAbi.encodeDeploy([mock]).slice(2));
  assert.equal(deployment.execResult.exceptionError,undefined);
  const registry=deployment.createdAddress!.toString();
  async function set(id:number,who:number|null){return tx(mockAbi.encodeFunctionData("set",[id,who===null?ZeroAddress:addresses[who].toString()]),mock);}
  await set(1,0);await set(2,1);
  async function publish(id=1,version=1,hash=H1,who=0){return tx(registryAbi.encodeFunctionData("publishPassport",[id,hash,"",version]),registry,who);}
  async function read(name:string,args:unknown[]){const r=await tx(registryAbi.encodeFunctionData(name,args),registry);assert.equal(r.execResult.exceptionError,undefined);return registryAbi.decodeFunctionResult(name,bytesToHex(r.execResult.returnValue));}
  return {tx,mock,registry,addresses,set,publish,read};
}
test("M4 contract: current agentWallet publishes genesis and emits exact digest/publisher",async()=>{
  const s=await setup(),r=await s.publish();assert.equal(r.execResult.exceptionError,undefined);
  const record=(await s.read("getPassportVersion",[1,1]))[0];assert.equal(record.profileHash,H1);assert.equal(record.publisher.toLowerCase(),s.addresses[0].toString());
  assert.equal((await s.read("latestVersion",[1]))[0],1n);
  const logs=r.execResult.logs!;assert.equal(logs.length,1);
  const event=registryAbi.parseLog({topics:logs[0][1].map(bytesToHex),data:bytesToHex(logs[0][2])})!;
  assert.equal(event.args.agentId,1n);assert.equal(event.args.profileHash,H1);
});
for(const [name,id,version,hash,who,error] of [
  ["unauthorized caller",1,1,H1,1,"UnauthorizedPublisher"],
  ["wrong agent",2,1,H1,0,"UnauthorizedPublisher"],
  ["unset agentWallet",3,1,H1,0,"UnauthorizedPublisher"],
  ["zero hash",1,1,ZeroHash,0,"ZeroProfileHash"],
  ["version zero",1,0,H1,0,"InvalidVersion"],
  ["skipped version",1,2,H1,0,"InvalidVersion"]
] as const)test(`M4 contract: rejects ${name}`,async()=>{
  const s=await setup(),r=await s.publish(id,version,hash,who);assert.ok(r.execResult.exceptionError);
  assert.equal(registryAbi.parseError(bytesToHex(r.execResult.returnValue))?.name,error);assert.equal((await s.read("latestVersion",[1]))[0],0n);
});
test("M4 contract: duplicate/replacement rejects, version 2 appends and history remains",async()=>{
  const s=await setup();await s.publish();assert.ok((await s.publish(1,1,H2)).execResult.exceptionError);
  assert.equal((await s.publish(1,2,H2)).execResult.exceptionError,undefined);
  assert.equal((await s.read("getPassportVersion",[1,1]))[0].profileHash,H1);
  const latest=await s.read("getLatestPassport",[1]);assert.equal(latest.version,2n);assert.equal(latest.publication.profileHash,H2);
});
test("M4 contract: correct hash true, wrong/absent/zero hash false",async()=>{
  const s=await setup();await s.publish();assert.equal((await s.read("verifyPassport",[1,1,H1]))[0],true);
  for(const [version,hash] of [[1,H2],[2,H1],[0,ZeroHash]])assert.equal((await s.read("verifyPassport",[1,version,hash]))[0],false);
});
test("M4 contract: registry dependency failure reverts without state change",async()=>{
  const s=await setup();await s.tx(mockAbi.encodeFunctionData("fail",[true]),s.mock);assert.ok((await s.publish()).execResult.exceptionError);
  assert.equal((await s.read("latestVersion",[1]))[0],0n);
});
test("M4 contract: wallet rotation rejects former wallet and allows new wallet; history retained",async()=>{
  const s=await setup();await s.publish();await s.set(1,1);
  assert.ok((await s.publish(1,2,H2,0)).execResult.exceptionError);
  assert.equal((await s.publish(1,2,H2,1)).execResult.exceptionError,undefined);
  assert.equal((await s.read("getPassportVersion",[1,1]))[0].publisher.toLowerCase(),s.addresses[0].toString());
  await s.set(1,null);assert.ok((await s.publish(1,3,H1,1)).execResult.exceptionError);
});
test("M4 contract: constructor rejects non-contract Identity Registry",async()=>{
  const s=await setup();const r=await s.tx(compiled.bytecode+registryAbi.encodeDeploy([ZeroAddress]).slice(2));assert.ok(r.execResult.exceptionError);
});
