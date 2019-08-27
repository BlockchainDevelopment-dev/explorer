const wrapTest = require('../../../../../../test/lib/wrapTest');
const BlockchainParser = require('../../../../../../server/lib/BlockchainParser');
const cgpDAL = require('../../../../../../server/components/api/cgp/cgpDAL');
const CGPVotesAdder = require('../../../CGPVotesAdder');
const CONTRACT_ID = require('../modules/contractId');
const { addDemoData } = require('../modules/addDemoData');
const getDemoCommand = require('../modules/getDemoCommand');

module.exports = async function part({ t, before, after }) {
  function testBadMessageBody({ given, messageBody }) {
    return wrapTest(given, async () => {
      const cgpVotesAdder = new CGPVotesAdder({
        blockchainParser: new BlockchainParser('test'),
        chain: 'test',
        contractId: CONTRACT_ID,
      });
      before(cgpVotesAdder);
      await addDemoData({
        commands: [getDemoCommand({ command: 'Payout', messageBody })],
      });
      const result = await cgpVotesAdder.doJob();
      const votes = await cgpDAL.findAll();
      t.assert(
        result === 1 && votes.length === 1 && votes[0].address === null && votes[0].ballot === null,
        `${given}: should add an empty vote`
      );
      after();
    });
  }

  await testBadMessageBody({
    given: 'Given a message body with bad outer key',
    messageBody: {
      wrongKey: [
        [
          'Payout',
          {
            string: '02344dc343f0ac6d0d1d5d6e6388a9dc495ff230b650565455f040c4abd565c1d301000000',
          },
        ],
        [
          'Signature',
          {
            dict: [
              [
                '032229522443cf166e28468c58a4719ce01eb2d9b5b656ecae6e959001bbe8c469',
                {
                  signature:
                    'b0d63b4a89f53910e82e01b22a3740664ca57756b6304838f8d592008a95047543ba6a281612a41778dc109723c4e4f1937bcbc2fdc847f636a4ff9a9e7d3715',
                },
              ],
              [
                '03c27d63a7a9e2c852b76aee38f51edd07f089a53f43b087ee57811abf61b198b9',
                {
                  signature:
                    '512f09fccba6b5018ff6ccf899baeee1824862999dcb38948b8406c4fcce1aab361f406c9ce261ebd8d381330f1da487a81cd632671471d7f16803683204fb61',
                },
              ],
            ],
          },
        ],
      ],
    },
  });

  await testBadMessageBody({
    given: 'Given a message body with wrong ballot key',
    messageBody: {
      dict: [
        [
          'WrongKey',
          {
            string: '02344dc343f0ac6d0d1d5d6e6388a9dc495ff230b650565455f040c4abd565c1d301000000',
          },
        ],
        [
          'Signature',
          {
            dict: [
              [
                '032229522443cf166e28468c58a4719ce01eb2d9b5b656ecae6e959001bbe8c469',
                {
                  signature:
                    'b0d63b4a89f53910e82e01b22a3740664ca57756b6304838f8d592008a95047543ba6a281612a41778dc109723c4e4f1937bcbc2fdc847f636a4ff9a9e7d3715',
                },
              ],
              [
                '03c27d63a7a9e2c852b76aee38f51edd07f089a53f43b087ee57811abf61b198b9',
                {
                  signature:
                    '512f09fccba6b5018ff6ccf899baeee1824862999dcb38948b8406c4fcce1aab361f406c9ce261ebd8d381330f1da487a81cd632671471d7f16803683204fb61',
                },
              ],
            ],
          },
        ],
      ],
    },
  });

  await testBadMessageBody({
    given: 'Given a message body with no ballot',
    messageBody: {
      dict: [
        [
          'Signature',
          {
            dict: [
              [
                '032229522443cf166e28468c58a4719ce01eb2d9b5b656ecae6e959001bbe8c469',
                {
                  signature:
                    'b0d63b4a89f53910e82e01b22a3740664ca57756b6304838f8d592008a95047543ba6a281612a41778dc109723c4e4f1937bcbc2fdc847f636a4ff9a9e7d3715',
                },
              ],
              [
                '03c27d63a7a9e2c852b76aee38f51edd07f089a53f43b087ee57811abf61b198b9',
                {
                  signature:
                    '512f09fccba6b5018ff6ccf899baeee1824862999dcb38948b8406c4fcce1aab361f406c9ce261ebd8d381330f1da487a81cd632671471d7f16803683204fb61',
                },
              ],
            ],
          },
        ],
      ],
    },
  });

  await testBadMessageBody({
    given: 'Given a message body with empty ballot',
    messageBody: {
      dict: [
        [
          'Payout',
          {
            string: '',
          },
        ],
        [
          'Signature',
          {
            dict: [
              [
                '032229522443cf166e28468c58a4719ce01eb2d9b5b656ecae6e959001bbe8c469',
                {
                  signature:
                    'b0d63b4a89f53910e82e01b22a3740664ca57756b6304838f8d592008a95047543ba6a281612a41778dc109723c4e4f1937bcbc2fdc847f636a4ff9a9e7d3715',
                },
              ],
              [
                '03c27d63a7a9e2c852b76aee38f51edd07f089a53f43b087ee57811abf61b198b9',
                {
                  signature:
                    '512f09fccba6b5018ff6ccf899baeee1824862999dcb38948b8406c4fcce1aab361f406c9ce261ebd8d381330f1da487a81cd632671471d7f16803683204fb61',
                },
              ],
            ],
          },
        ],
      ],
    },
  });

  await testBadMessageBody({
    given: 'Given a message body with no signatures',
    messageBody: {
      dict: [
        [
          'Payout',
          {
            string: '02344dc343f0ac6d0d1d5d6e6388a9dc495ff230b650565455f040c4abd565c1d301000000',
          },
        ],
      ],
    },
  });

  await testBadMessageBody({
    given: 'Given a message body with signatures empty',
    messageBody: {
      dict: [
        [
          'Payout',
          {
            string: '02344dc343f0ac6d0d1d5d6e6388a9dc495ff230b650565455f040c4abd565c1d301000000',
          },
        ],
        [
          'Signature',
          {
            dict: [],
          },
        ],
      ],
    },
  });
};