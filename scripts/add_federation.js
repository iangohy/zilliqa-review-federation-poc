require('dotenv').config();
const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const {
  toBech32Address,
  getAddressFromPrivateKey,
} = require('@zilliqa-js/crypto');

const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');

const chainId = 333;
const msgVersion = 1;
const VERSION = bytes.pack(chainId, msgVersion);

const privateKey = process.env.PRIVATE_KEY;

zilliqa.wallet.addByPrivateKey(privateKey);


(async () => {
  try {
    const address = getAddressFromPrivateKey(privateKey);
    console.log(`Account address is: ${address}`);
    console.log(`Bench32 Address: ${toBech32Address(address)}`);
    
    const minGasPrice = await zilliqa.blockchain.getMinimumGasPrice();
    
    console.log(`Current Minimum Gas Price: ${minGasPrice.result}`);
    const myGasPrice = units.toQa('1000', units.Units.Li);
    console.log(`My Gas Price ${myGasPrice.toString()}`);
    const isGasSufficient = myGasPrice.gte(new BN(minGasPrice.result));
    console.log(`Is the gas price sufficient? ${isGasSufficient}`);

    if (!isGasSufficient)  {
      throw Error("Gas price is insufficient!")
    }

    const deployedContract = zilliqa.contracts.at(process.env.CONTRACT_ADDRESS);
    // transition AddToFed(newAddr : ByStr20)
    console.log(`Calling AddToFed transition with data: \n\tnewAddr: ${process.env.ADD_CONTRACT_ADDRESS}`);
    const callTx = await deployedContract.call(
      'AddToFed',
      [
        {
          vname: 'newAddr',
          type: 'ByStr20',
          value: process.env.ADD_CONTRACT_ADDRESS,
        },
      ],
      {
        // amount, gasPrice and gasLimit must be explicitly provided
        version: VERSION,
        amount: new BN(0),
        gasPrice: myGasPrice,
        gasLimit: Long.fromNumber(8000),
      },
      33,
      1000,
      false,
    );

    // Retrieving the transaction receipt 
    // console.log(JSON.stringify(callTx.receipt, null, 4));

    //Get the contract state
    console.log('Getting contract state...');
    const state = await deployedContract.getState();
    console.log('The state of the contract is:');
    console.log(JSON.stringify(state, null, 4));
  } catch (err) {
  console.log(err);
  }
})()