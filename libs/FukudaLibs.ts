import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { ContractPromise } from "@polkadot/api-contract";
import abi from "../contrac_metadata/coin_contract_metadata.json"
import { Int } from "@polkadot/types-codec";


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
    "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
  );
  if (output !== undefined && output !== null) {
    return output.toHuman()?.toString() ?? ""
  }else{
    return ""
  }
}

export const sendCoinTo =async (gas:number, api:ApiPromise, actingAddress:string, toAddress:string, sendCoin:string) => {
  const contract = new ContractPromise(api, abi, process.env.NEXT_PUBLIC_COIN_CONTRACT_ADDRESS || "")
  console.log(gas)
  console.log(api)
  console.log(actingAddress)
  console.log(toAddress)
  console.log(sendCoin)
  await contract.query["psp22::transfer"](
    actingAddress,
    { gasLimit: gas },
    actingAddress,
    toAddress,
    sendCoin
  );
  // if (output !== undefined && output !== null) {
  //   return output.toHuman()?.toString() ?? ""
  // }else{
  //   return ""
  // }
}
