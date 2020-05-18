const { Client, ProviderRegistry, Result } = require('@blockstack/clarity');
const assert = require('chai').assert;

describe('counter 22222 contract', () => {
  let counterClient;
  let provider;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    counterClient = new Client(
      'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.counter',
      'counter',
      provider
    );
  });

  it('should have a valid syntax', async () => {
    await counterClient.checkContract();
  });

  describe('check contract functions', () => {
    const getCounter = async () => {
      const query = counterClient.createQuery({
        method: { name: 'get-counter', args: [] },
      });

      const receipt = await counterClient.submitQuery(query);
      const result = Result.unwrapInt(receipt);
      return result;
    };

    const execMethod = async (methodName) => {
      const tx = counterClient.createTransaction({
        method: {
          name: methodName,
          args: [],
        },
      });
      await tx.sign('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7');
      const receipt = await counterClient.submitTransaction(tx);
      return receipt;
    };

    before(async () => {
      await counterClient.deployContract();
    });

    it('should start at zero', async () => {
      const start = await getCounter();
      assert.equal(start, 0);
    });

    it('should increment', async () => {
      await execMethod('increment');
      assert.equal(await getCounter(), 1);
      await execMethod('increment');
      assert.equal(await getCounter(), 2);
      await execMethod('increment');
      assert.equal(await getCounter(), 3);
    });

    it('should increment', async () => {
      await execMethod('decrement');
      const start = await getCounter();
      assert.equal(start, 2);
    });
  });
  after(async () => {
    await provider.close();
  });
});
