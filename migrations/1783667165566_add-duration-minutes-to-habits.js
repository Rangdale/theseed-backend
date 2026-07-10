exports.up = (pgm) => {
  pgm.addColumn('habits', {
    duration_minutes: {
      type: 'integer',
      notNull: false,
      default: null,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('habits', 'duration_minutes');
};