'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    const cgpIntervalsPromise = queryInterface
      .createTable('CgpIntervals', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        interval: {
          allowNull: false,
          type: Sequelize.INTEGER,
        },
        resultAllocation: {
          type: Sequelize.INTEGER,
        },
        resultPayoutRecipient: {
          type: Sequelize.STRING,
        },
        resultPayoutAmount: {
          type: Sequelize.BIGINT,
        },
        fund: {
          type: Sequelize.BIGINT,
        },
        status: {
          allowNull: false,
          type: Sequelize.STRING,
        },
      })
      .then(() =>
        queryInterface.addConstraint('CgpIntervals', ['interval'], {
          type: 'UNIQUE',
          name: 'CgpIntervals_interval_unique_constraint',
        })
      );
    const allocationVotesPromise = queryInterface.createTable('AllocationVotes', {
      CgpIntervalId: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      amount: {
        type: Sequelize.INTEGER,
      },
      zpCount: {
        type: Sequelize.BIGINT,
      },
    });
    const payoutVotesPromise = queryInterface.createTable('PayoutVotes', {
      CgpIntervalId: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      recipient: {
        type: Sequelize.STRING,
      },
      amount: {
        type: Sequelize.BIGINT,
      },
      zpCount: {
        type: Sequelize.BIGINT,
      },
    });

    return Promise.all([cgpIntervalsPromise, allocationVotesPromise, payoutVotesPromise]).then(() =>
      Promise.all([
        queryInterface.addConstraint('AllocationVotes', ['CgpIntervalId'], {
          type: 'foreign key',
          name: 'AllocationVotes_CgpIntervalId_fkey',
          references: {
            table: 'CgpIntervals',
            field: 'id',
          },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        }),
        queryInterface.addConstraint('PayoutVotes', ['CgpIntervalId'], {
          type: 'foreign key',
          name: 'PayoutVotes_CgpIntervalId_fkey',
          references: {
            table: 'CgpIntervals',
            field: 'id',
          },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        }),
      ])
    );
  },
  down: (queryInterface, Sequelize) => {
    // drop all dependents first
    return Promise.all([
      queryInterface.dropTable('AllocationVotes'),
      queryInterface.dropTable('PayoutVotes'),
    ]).then(() => queryInterface.dropTable('CgpIntervals'));
  },
};
