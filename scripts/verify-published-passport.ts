import { readFile, writeFile } from "node:fs/promises";
import { alchemyRpc } from "../packages/publication/src/rpc.js";
import { verifyPublishedPassport } from "../packages/publication/src/verify.js";
async function main() {
  const [passportPath, trustedDeploymentPath, output] = process.argv.slice(2);
  if(!passportPath||!trustedDeploymentPath)throw Error();
  const bundle=JSON.parse(await readFile(passportPath,"utf8"));
  const deployment=JSON.parse(await readFile(trustedDeploymentPath,"utf8"));
  const result=await verifyPublishedPassport(bundle,deployment.trust,alchemyRpc());
  const text=JSON.stringify(result,null,2)+"\n";
  const secrets=[process.env.ALCHEMY_MONAD_TESTNET_RPC_URL,process.env.DEPLOYER_PRIVATE_KEY,process.env.ENVIO_API_TOKEN].filter(Boolean) as string[];
  if(secrets.some(s=>text.includes(s)))throw Error();
  if(output)await writeFile(output,text,{flag:"wx"});
  console.log(text);if(result.status!=="verified")process.exitCode=1;
}
main().catch(()=>{console.error("Publication verification failed; provide Passport and independently trusted deployment JSON, with Alchemy testnet configured");process.exitCode=1;});
