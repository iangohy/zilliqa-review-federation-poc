require('dotenv').config();
const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const chainId = 333; // chainId of the developer testnet
const msgVersion = 1; // current msgVersion
const VERSION = bytes.pack(chainId, msgVersion);
// console.log(process.env.PRIVATE_KEY);
const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');
zilliqa.wallet.addByPrivateKey(process.env.PRIVATE_KEY);
const code = `scilla_version 0

import BoolUtils ListUtils

library RatingsFed

let removeSpecific = 
  fun (addrToRemove : ByStr20) =>
  fun (fedAddress : ByStr20) =>
    let equal = builtin eq addrToRemove fedAddress in
    negb equal
    
let not_owner_code = Int32 1

contract RatingsFed (owner : ByStr20)

(* 
-----Ratings-----
1 - g : suitable for display on all websites with any audience type.
2 - pg : may contain rude gestures, provocatively dressed individuals, the lesser swear
words, or mild violence.
3 - r : may contain such things as harsh profanity, intense violence, nudity, or hard drug
use.
4 - x : may contain hardcore sexual imagery or extremely disturbing violence.
*)

(* Map IPFS_hash Rating *)
(* Ratings as int for ease of calculating average and to allow for negative ratings to denote other meanings in future*)
field ratings : Map String Int32 = Emp String Int32

(* List of other trusted contract addresses *)
field federation : List ByStr20 = Nil {ByStr20}

transition AddRating(ipfsHash : String, rating : Int32)
  isOwner = builtin eq owner _sender;
  match isOwner with 
  | True =>
    ratings[ipfsHash] := rating;
    e = {_eventname : "AddRating success"; ipfsHash : ipfsHash; rating : rating};
    event e
  | False =>
    e = {_eventname : "AddRating failure"; errcode : not_owner_code};
    event e
  end
end

transition AddToFed(newAddr : ByStr20)
  isOwner = builtin eq owner _sender;
  match isOwner with 
  | True =>
    currentFed <- federation;
    newFedList = Cons {ByStr20} newAddr currentFed;
    federation := newFedList;
    e = {_eventname : "AddToFed success"; newAddr : newAddr};
    event e
  | False =>
    e = {_eventname : "AddToFed failure"; errcode : not_owner_code};
    event e
  end
end

transition RemoveFromFed(removeAddr : ByStr20)
  isOwner = builtin eq owner _sender;
  match isOwner with 
  | True =>
    currentFed <- federation;
    filterByStr20 = @list_filter ByStr20;
    removeCompare = removeSpecific removeAddr;
    newFed = filterByStr20 removeCompare currentFed;
    federation := newFed;
    e = {_eventname : "RemoveFromFed success"; removeAddr : removeAddr};
    event e
  | False =>
    e = {_eventname : "RemoveFromFed failure"; errcode : not_owner_code};
    event e
  end
end`;

const goal = units.toQa('100', units.Units.Zil).toString();
const init = [
    {
    vname: '_scilla_version',
    type: 'Uint32',
    value: '0',
    },
    {
    vname: 'owner',
    type: 'ByStr20',
    value: zilliqa.wallet.defaultAccount.address,
    }
];

const contract = zilliqa.contracts.new(code, init);
const myGasPrice = units.toQa('1000', units.Units.Li);


(async () => {
  const minGasPrice = await zilliqa.blockchain.getMinimumGasPrice();
  console.log(`Current Minimum Gas Price: ${minGasPrice.result}`);
  const isGasSufficient = myGasPrice.gte(new BN(minGasPrice.result)); // Checks if your gas price is less than the minimum gas price
  console.log(`Is the gas price sufficient? ${isGasSufficient}`);


  console.log(`Deploy transaction using ${zilliqa.wallet.defaultAccount.bech32Address}...`);
  // const [txn] = await contract.deploy(
  //     {
  //         version: VERSION,
  //         gasPrice: myGasPrice,
  //         gasLimit: Long.fromNumber(10000),
  //     },
  // );

  // console.log(txn)

  if (txn.receipt.success === true) {
      console.log(`Your contract is now deployed at
      ${contract.address}`);
      } else {
      console.dir(txn);
      }
  })();