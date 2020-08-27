const express = require('express');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
// Developer Testnet
const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/getRating/:mainContractAddress/:ipfsHash', async (req, res) => {
    let mainContractAddress = req.params.mainContractAddress;
    let ipfsHash = req.params.ipfsHash;
    console.log(`Request:\n\tMain Contract Address: ${mainContractAddress}\n\tIPFS Hash: ${ipfsHash}`)

    /* Helper function to get rating from particular contract on blockchain 
    Arguments:
    contractAddress (base16) - Address of contract to get data from
    ipfsHash (ipfs hash) - hash of file to get rating

    Returns:
    {[contractAddress]: rating} - rating will be 'undefined' if not found
    */
    async function getRatingFromContract(contractAddress, ipfsHash) {
        let ratingData
        try {
            const contract = zilliqa.contracts.at(`${contractAddress}`);
            ratingData = await contract.getSubState('ratings', [
                `${ipfsHash}`,
            ]);
    //         console.log(`
    // IPFS Hash: ${ipfsHash}
    // Contract Address: ${contractAddress}
    // Data from blockchain: ${JSON.stringify(ratingData)}
    //         `);
        }
        catch (err) {
            console.log("Error reading state from blockchain!");
            console.log(err);
        }

        // Check if rating for particular ipfsHash exists
        if (ratingData == null) {
            console.log(`Unable to find hash ${ipfsHash} in contract ${contractAddress}`);
            return {[contractAddress]: "undefined"};
        } else {
            rating = ratingData.ratings[ipfsHash];
            return {[contractAddress]: rating};
        }
    }
    

    let allRatings;
    try {
        const contract = zilliqa.contracts.at(`${mainContractAddress}`);
        const federationData = await contract.getSubState('federation');
    //     console.log(`
    // Contract Address: ${mainContractAddress}
    // Data from blockchain: ${JSON.stringify(federationData)}
    //         `);

        if (federationData == null) {
            console.log("Error! Possibly invalid contract address or not review smart contract")
            return res.sendStatus(400)
        }
        let ratingsArray = Array.from(federationData.federation);
        ratingsArray.unshift(mainContractAddress);
        (async function() {
            allRatings = await Promise.all(ratingsArray.map((contractAddress) => getRatingFromContract(contractAddress, ipfsHash)));
            console.log("Response: ")
            res_json = {"ipfsHash": ipfsHash, "ratings" : allRatings};
            console.log(res_json);
            res.json(res_json);
        })();
    }
    catch (err) {
        console.log("Error getting ratings data");
        console.log(err);
        return res.sendStatus(400);
    }
})

app.listen(PORT, () => {
    console.log(`Review API listening on port ${PORT}`);
})