'use strict';
module.exports = (sequelize, DataTypes) => {
  const PayoutVote = sequelize.define(
    'PayoutVote',
    {
      recipient: DataTypes.STRING,
      amount: DataTypes.BIGINT,
      zpCount: DataTypes.BIGINT,
    },
    {
      timestamps: false,
    }
  );
  PayoutVote.removeAttribute('id');
  PayoutVote.associate = function(models) {
    PayoutVote.belongsTo(models.CgpInterval);
  };
  return PayoutVote;
};
