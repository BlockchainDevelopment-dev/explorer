'use strict';
module.exports = (sequelize, DataTypes) => {
  const CgpInterval = sequelize.define(
    'CgpInterval',
    {
      interval: DataTypes.INTEGER,
      resultAllocation: DataTypes.INTEGER,
      resultPayoutRecipient: DataTypes.STRING,
      resultPayoutAmount: DataTypes.BIGINT,
      fund: DataTypes.BIGINT,
      status: DataTypes.STRING,
    },
    {
      timestamps: false,
    }
  );
  CgpInterval.associate = function(models) {
    CgpInterval.hasMany(models.AllocationVote);
    CgpInterval.hasMany(models.PayoutVote);
  };
  return CgpInterval;
};
