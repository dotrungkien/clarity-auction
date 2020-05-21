import {
  Client,
  Result,
  Provider,
  ProviderRegistry,
} from '@blockstack/clarity';

import { expect } from 'chai';

describe('Auction contract', () => {
  const contractName = 'auction';
  const deployer = 'SP2R8MPF1WYDQD2AZY9GCZRAVG8JYZ25FNB8X45EK';
  const assetOwner = 'SP1DQW1980HVS71XPSW91A8K2W2R3ZAJ75M5M0K5W';
  const bidderA = 'SP13VF98697SCY877MECN9CESFN5VHK8P744DB0TY';
  const bidderB = 'SP33AV3DHD6P9XAPYKJ6JTEF83QRZXX6Q5YMVWS5X';
  const bidderC = 'SP3DWF717EZRH2M4S16TZDVNZPWT7DG95ZK5YAS69';

  let provider: Provider;
  let client: Client;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    client = new Client(`${deployer}.${contractName}`, contractName, provider);
  });

  const createBid = async (bidder, price) => {
    const tx = client.createTransaction({
      method: {
        name: 'bid',
        args: [price],
      },
    });
    await tx.sign(bidder);
    let receipt = await client.submitTransaction(tx);
    return receipt;
  };

  it('make sure contract has valid syntax', async () => {
    await client.checkContract();
    await client.deployContract();
  });

  describe('Check initialize state', () => {
    it('start price is 100', async () => {
      let query = client.createQuery({
        method: {
          name: 'get-start-price',
          args: [],
        },
      });
      const receipt = await client.submitQuery(query);
      const startPrice = Result.unwrapInt(receipt);
      expect(startPrice).to.equal(100);
    });

    it('first highest bidder is the asset owner', async () => {
      let query = client.createQuery({
        method: {
          name: 'get-highest-bidder',
          args: [],
        },
      });

      const receipt = await client.submitQuery(query);
      const result = Result.unwrap(receipt);
      const highestBidder = result.match(/^\(ok\s(\w+)\)$/)[1];
      expect(highestBidder).to.equal(assetOwner);
    });

    it('winner still not be decided yet', async () => {
      let query = client.createQuery({
        method: {
          name: 'get-winner',
          args: [],
        },
      });
      const receipt = await client.submitQuery(query);
      const result = Result.unwrap(receipt);
      expect(result).to.contain('err');
    });
  });

  describe('bid with price bellow start price', () => {
    it('must return an error', async () => {
      let receipt = await createBid(bidderA, '90');
      expect(receipt.success).to.false;
    });

    describe('check bid logic', () => {
      before('create scenario', async () => {
        await createBid(bidderA, '200');
        await createBid(bidderB, '300');
        await createBid(bidderA, '450');
        await createBid(bidderC, '750');
        await createBid(bidderA, '750');
      });

      it('highest bid is 750', async () => {
        let query = client.createQuery({
          method: {
            name: 'get-highest-bid',
            args: [],
          },
        });

        const receipt = await client.submitQuery(query);
        const highestBid = Result.unwrapInt(receipt);
        expect(highestBid).to.equal(750);
      });

      it('highest bidder is bidder C', async () => {
        let query = client.createQuery({
          method: {
            name: 'get-highest-bidder',
            args: [],
          },
        });
        const receipt = await client.submitQuery(query);
        const result = Result.unwrap(receipt);
        const highestBidder = result.match(/^\(ok\s(\w+)\)$/)[1];
        expect(highestBidder).to.equal(bidderC);
      });

      it('latest bid of bidder A is 750', async () => {
        let query = client.createQuery({
          method: {
            name: 'get-latest-bid-of',
            args: [`'${bidderA}`],
          },
        });

        const receipt = await client.submitQuery(query);
        const bid = Result.unwrapInt(receipt);
        expect(bid).to.equal(750);
      });

      it('latest bid of bidder B is 300', async () => {
        let query = client.createQuery({
          method: {
            name: 'get-latest-bid-of',
            args: [`'${bidderB}`],
          },
        });

        const receipt = await client.submitQuery(query);
        const bid = Result.unwrapInt(receipt);
        expect(bid).to.equal(300);
      });
    });

    describe('max bid count exceeded', () => {
      it('no more bid will be accepted', async () => {
        let receipt = await createBid(bidderA, '900');
        expect(receipt.success).to.false;
      });
    });

    describe('check winner', () => {
      it('winner is bidder C', async () => {
        let query = client.createQuery({
          method: {
            name: 'get-winner',
            args: [],
          },
        });
        const receipt = await client.submitQuery(query);
        const result = Result.unwrap(receipt);
        const highestBidder = result.match(/^\(ok\s(\w+)\)$/)[1];
        expect(highestBidder).to.equal(bidderC);
      });
    });
  });

  after(async () => {
    await provider.close();
  });
});
