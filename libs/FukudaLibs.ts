import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { ContractPromise } from "@polkadot/api-contract";
import abi from "../contrac_metadata/coin_contract_metadata.json"
import { Int } from "@polkadot/types-codec";
import { KeyringPair } from "@polkadot/keyring/types";
import { stringToU8a, u8aToHex } from '@polkadot/util';

const keyring = new Keyring({ type: "sr25519" });
/**
 * 一度だけ実行すれば良い。
 * 何度も実行するとバグる。
 * @returns コインを取り扱うスマートコントラクト。この中にいっぱい関数が入ってる 
 */
export const getApi = async () => {
  const wsProvider = new WsProvider(process.env.NEXT_PUBLIC_BLOCKCHAIN_URL);
  const api = await ApiPromise.create({ provider: wsProvider });
  // const contract = new ContractPromise(api, abi, process.env.NEXT_PUBLIC_COIN_CONTRACT_ADDRESS || "")
  return api
}

/**
 * 一度だけ実行すれば良い。
 * 何度も実行するとバグる。
 * @returns walletに紐づいているアカウント一覧
 */
export const getAccounts =async () => {
  const { web3Accounts, web3Enable } = await import(
    "@polkadot/extension-dapp"
  );
  const extensions = await web3Enable("Polk4NET");
  const account = await web3Accounts();
  return account
}

export const setKeyring =async (mnemonic:string) => {
  const me = keyring.addFromUri(mnemonic);
  const message = stringToU8a('this is our message');
  const signature = me.sign(message);
  const isValid = me.verify(message, signature, me.publicKey);

  // Log info
  console.log(`The signature ${u8aToHex(signature)}, is ${isValid ? '' : 'in'}valid`);
}

export const getTotalSupply = async (gas:number, actingAddress:string, api:ApiPromise)=>{
  const contract = new ContractPromise(api, abi, process.env.NEXT_PUBLIC_COIN_CONTRACT_ADDRESS || "")
  const { gasConsumed, result, output } = await contract.query.getTotalSupply(
    actingAddress,
    { gasLimit: -1 }
  );
  if (output !== undefined && output !== null) {
    return output.toHuman()?.toString() ?? ""
  }else{
    return ""
  }
}

export const getBalanceOf =async (gas:number, api:ApiPromise, actingAddress:string) => {
  const contract = new ContractPromise(api, abi, process.env.NEXT_PUBLIC_COIN_CONTRACT_ADDRESS || "")
  const { gasConsumed, result, output } = await contract.query["psp22::balanceOf"](
    actingAddress,
    { gasLimit: -1 },
    actingAddress
  );
  if (output !== undefined && output !== null) {
    return output.toHuman()?.toString() ?? ""
  }else{
    return ""
  }
}

export const sendCoinTo =async (gas:number, api:ApiPromise, actingAddress:string, toAddress:string, sendCoin:number) => {
  const contract = new ContractPromise(api, abi, process.env.NEXT_PUBLIC_COIN_CONTRACT_ADDRESS || "")
  const me = keyring.addFromUri("subject since foster argue left develop organ segment very link endorse kangaroo");
  const bob = keyring.addFromUri("//Bob");
  debugger
  await contract.query["psp22::transfer"](
    actingAddress,
    {gasLimit: gas},
    actingAddress,
    "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
    sendCoin
  )
}
