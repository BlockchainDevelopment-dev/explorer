'use strict';
module.exports = (sequelize, DataTypes) => {
  const AllocationVote = sequelize.define(
    'AllocationVote',
    {
      amount: DataTypes.INTEGER,
      zpCount: DataTypes.BIGINT,
    },
    {
      timestamps: false,
    }
  );
  AllocationVote.removeAttribute('id');
  AllocationVote.associate = function(models) {
    AllocationVote.belongsTo(models.CgpInterval);
  };
  return AllocationVote;
};
