'use strict';
module.exports = (sequelize, DataTypes) => {
  const VoteInterval = sequelize.define(
    'VoteInterval',
    {
      interval: DataTypes.INTEGER,
      beginHeight: DataTypes.INTEGER,
      endHeight: DataTypes.INTEGER,
    },
    {
      timestamps: false,
    }
  );
  VoteInterval.removeAttribute('id');
  VoteInterval.associate = function(models) {
    // associations can be defined here
  };
  return VoteInterval;
};
